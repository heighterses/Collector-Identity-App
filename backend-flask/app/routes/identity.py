from flask import Blueprint, request, jsonify
from app.middleware.auth import jwt_required_custom
from app import db
from app.models.identity import IdentityTemplate, IdentityTrait, log_edit_event
from app.services.identity_service import identity_service
from app.services.identity_refinement_service import identity_refinement_service
from app.services.pattern_service import pattern_service
from app.services.intent_service import intent_service

bp = Blueprint('identity', __name__, url_prefix='/api/identity')


# ==========================================================
# ✅ M2-05: GET IDENTITY TEMPLATE FOR DISPLAY (READ-ONLY)
# ==========================================================
@bp.route('/template/<artwork_id>', methods=['GET'])
@jwt_required_custom
def get_identity_template(artwork_id):
    try:
        user_id = request.current_user['user_id']

        template = IdentityTemplate.query.filter_by(
            user_id=user_id,
            artwork_id=artwork_id
        ).first()

        if not template:
            return jsonify({"template": None, "traits": []}), 200

        traits = sorted(template.traits, key=lambda t: t.position)

        return jsonify({
            "template_id": template.id,
            "artwork_id": template.artwork_id,
            "traits": [
                {
                    "id": t.id,
                    "label": t.label,
                    "value": str(t.value) if t.value is not None else "",
                    "type": t.trait_type,
                    "position": t.position,
                    "ai_generated": t.ai_generated
                }
                for t in traits
            ]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================================
# ✅ M2-06: PATCH TRAIT (VALUE + LABEL) WITH EDIT TRACKING
# ==========================================================
@bp.route('/trait/<trait_id>', methods=['PATCH'])
@jwt_required_custom
def update_trait(trait_id):
    try:
        user_id = request.current_user['user_id']
        data = request.get_json()

        if 'value' not in data and 'label' not in data:
            return jsonify({"error": "value or label is required"}), 400

        trait = IdentityTrait.query.get(trait_id)
        if not trait:
            return jsonify({"error": "Trait not found"}), 404

        if trait.template.user_id != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        # Handle value update
        if 'value' in data:
            old_value = trait.value
            new_value = str(data['value'])
            trait.value = new_value
            log_edit_event(
                db_session=db.session,
                template_id=trait.template_id,
                user_id=user_id,
                event_type='update_value',
                trait_id=trait.id,
                old_value=old_value,
                new_value=new_value
            )

        # Handle label update
        if 'label' in data:
            old_label = trait.label
            new_label = str(data['label']).strip()
            if new_label and new_label != old_label:
                trait.label = new_label
                log_edit_event(
                    db_session=db.session,
                    template_id=trait.template_id,
                    user_id=user_id,
                    event_type='update_value',
                    trait_id=trait.id,
                    old_value=old_label,
                    new_value=new_label
                )

        db.session.commit()

        return jsonify({
            "id": trait.id,
            "label": trait.label,
            "value": str(trait.value) if trait.value is not None else "",
            "type": trait.trait_type,
            "position": trait.position,
            "ai_generated": trait.ai_generated
        }), 200

    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ==========================================================
# ✅ GENERATE IDENTITY (OPTIONAL)
# ==========================================================
@bp.route('/generate', methods=['POST'])
@jwt_required_custom
def generate_identity():
    try:
        data = request.get_json()
        reflection = data.get("reflection")

        if not reflection:
            return jsonify({"error": "Reflection required"}), 400

        result = identity_service.generate_identity(reflection)

        return jsonify({
            "identity": result
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================================
# 🔥 REFINE IDENTITY (INTELLIGENT — UPDATED)
# ==========================================================
@bp.route('/refine', methods=['POST'])
@jwt_required_custom
def refine_identity():
    try:
        data = request.get_json()

        identity = data.get("identity")
        user_input = data.get("input")

        if not identity or not user_input:
            return jsonify({"error": "Missing data"}), 400

        # 🔥 STEP 1: Detect intent
        intent = intent_service.detect_intent(user_input)

        # 🔥 STEP 2: Apply logic
        if intent == "REFINE":
            result = identity_refinement_service.refine_identity(identity, user_input)
        else:
            result = identity_service.apply_user_edit(identity, user_input, intent)

        return jsonify({
            "identity": result,
            "intent": intent
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================================
# ✅ PATTERN DETECTION (MANUAL)
# ==========================================================
@bp.route('/patterns', methods=['POST'])
@jwt_required_custom
def get_patterns():
    try:
        data = request.get_json()
        identities = data.get("identities", [])

        if not identities:
            return jsonify({"error": "No identities provided"}), 400

        result = pattern_service.detect_patterns(identities)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================================
# 🔥 PROFILE DATA (FINAL — WITH COUNTS + TREND)
# ==========================================================
@bp.route('/profile-data', methods=['GET'])
@jwt_required_custom
def get_profile_data():
    try:
        user_id = request.current_user['user_id']

        from app.models.identity import IdentityTemplate

        templates = IdentityTemplate.query.filter_by(user_id=user_id).all()

        if not templates:
            return jsonify({
                "identities": [],
                "patterns": {
                    "traits": [],
                    "emotions": [],
                    "themes": []
                },
                "trend": {
                    "new_traits": [],
                    "dropped_traits": []
                }
            }), 200

        identities = [t.to_dict() for t in templates]

        patterns = pattern_service.detect_patterns(identities)
        trend = pattern_service.detect_trend(identities)

        return jsonify({
            "identities": identities,
            "patterns": patterns,
            "trend": trend
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500