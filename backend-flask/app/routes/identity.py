from flask import Blueprint, request, jsonify
from app.middleware.auth import jwt_required_custom

from app.services.identity_service import identity_service
from app.services.identity_refinement_service import identity_refinement_service
from app.services.pattern_service import pattern_service
from app.services.intent_service import intent_service  # 🔥 NEW

bp = Blueprint('identity', __name__, url_prefix='/api/identity')


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