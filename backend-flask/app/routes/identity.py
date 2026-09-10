from flask import Blueprint, request, jsonify
from app.middleware.auth import jwt_required_custom
from app import db
from app.models.identity import IdentityTemplate, IdentityTrait
from app.models.edit_event import EditEvent
from app.models.identity_version import IdentityVersion
from app.models.identity_note import IdentityNote
from app.services.identity_service import identity_service
from app.services.identity_refinement_service import identity_refinement_service
from app.services.pattern_service import pattern_service
from app.services.intent_service import intent_service
from app.services.identity_export_service import identity_export_service

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
            user_id=user_id, artwork_id=artwork_id
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
                    "ai_generated": t.ai_generated,
                    "is_confirmed": t.is_confirmed
                }
                for t in traits
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================================
# ✅ M2-06/07/08: PATCH TRAIT WITH EDIT TRACKING
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
            new_value = str(data['value'])
            if new_value != str(trait.value or ''):
                db.session.add(EditEvent(
                    user_id=user_id,
                    trait_label=trait.label,
                    action='update_value'
                ))
                trait.value = new_value

        # Handle label update
        if 'label' in data:
            new_label = str(data['label']).strip()
            if new_label and new_label != trait.label:
                db.session.add(EditEvent(
                    user_id=user_id,
                    trait_label=new_label,
                    action='update_label'
                ))
                trait.label = new_label

        # Handle is_confirmed update
        if 'is_confirmed' in data:
            new_confirmed = bool(data['is_confirmed'])
            if new_confirmed != trait.is_confirmed:
                db.session.add(EditEvent(
                    user_id=user_id,
                    trait_label=trait.label,
                    action='confirm' if new_confirmed else 'reject'
                ))
                trait.is_confirmed = new_confirmed

        db.session.commit()

        return jsonify({
            "id": trait.id,
            "label": trait.label,
            "value": str(trait.value) if trait.value is not None else "",
            "type": trait.trait_type,
            "position": trait.position,
            "ai_generated": trait.ai_generated,
            "is_confirmed": trait.is_confirmed
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ==========================================================
# ✅ M2-03: SAVE IDENTITY VERSION (SNAPSHOT)
# ==========================================================
@bp.route('/version/save/<template_id>', methods=['POST'])
@jwt_required_custom
def save_version(template_id):
    try:
        user_id = request.current_user['user_id']

        template = IdentityTemplate.query.filter_by(
            id=template_id, user_id=user_id
        ).first()

        if not template:
            return jsonify({"error": "Template not found"}), 404

        # Get next version number
        last = IdentityVersion.query.filter_by(template_id=template_id)\
            .order_by(IdentityVersion.version_number.desc()).first()
        next_version = (last.version_number + 1) if last else 1

        # M2-12: Only include confirmed traits, reflect latest edited state
        confirmed_traits = [
            t for t in sorted(template.traits, key=lambda t: t.position)
            if t.is_confirmed
        ]

        # Build structured snapshot with user-edited values
        trait_snapshot = [
            {
                "label": t.label,
                "value": t.value,
                "trait_type": t.trait_type,
                "position": t.position,
                "ai_generated": t.ai_generated
            }
            for t in confirmed_traits
        ]

        # Extract core identity from text traits - skip empty/None values
        core_identity = next(
            (t.value for t in confirmed_traits
             if t.trait_type == "text" and t.value and t.value.lower() != "none"),
            None
        )

        snapshot = {
            "traits": trait_snapshot,
            "core_identity": core_identity
        }

        version = IdentityVersion(
            template_id=template_id,
            version_number=next_version,
            snapshot_json=snapshot
        )
        db.session.add(version)
        db.session.commit()

        return jsonify({
            "message": "Version saved",
            "version": version.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ==========================================================
# ✅ M2-03: GET VERSION HISTORY
# ==========================================================
@bp.route('/version/history/<template_id>', methods=['GET'])
@jwt_required_custom
def get_version_history(template_id):
    try:
        user_id = request.current_user['user_id']

        template = IdentityTemplate.query.filter_by(
            id=template_id, user_id=user_id
        ).first()

        if not template:
            return jsonify({"error": "Template not found"}), 404

        versions = IdentityVersion.query.filter_by(template_id=template_id)\
            .order_by(IdentityVersion.version_number.asc()).all()

        return jsonify({
            "versions": [v.to_dict() for v in versions]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================================
# 🔥 M3-19: EXPORT IDENTITY SUMMARY
# Read-only, own-data-only. Exports only CONFIRMED traits — unconfirmed AI
# suggestions are not the user's authorized meaning (CLAUDE.md Section 2)
# and must never appear in something they might keep or share.
# ==========================================================
@bp.route('/export', methods=['GET'])
@jwt_required_custom
def export_identity():
    try:
        user_id = request.current_user['user_id']
        from app.models.user import User as UserModel
        from app.models.artwork import Artwork

        user = UserModel.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        templates = (
            IdentityTemplate.query
            .filter_by(user_id=user_id)
            .order_by(IdentityTemplate.created_at.asc())
            .all()
        )

        # Top artworks linked to the identity — most recent ones that
        # actually contributed a template, ownership-scoped via user_id.
        artwork_ids = [t.artwork_id for t in templates if t.artwork_id]
        artworks = []
        if artwork_ids:
            artworks = (
                Artwork.query
                .filter(Artwork.id.in_(artwork_ids), Artwork.user_id == user_id)
                .order_by(Artwork.created_at.desc())
                .limit(5)
                .all()
            )

        export = identity_export_service.build_export(user, templates, artworks)
        return jsonify(export), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================================
# 🔥 M3-15: MICRO-NOTES ON IDENTITY VERSIONS
# Deliberately separate from the identity template/trait structure — notes
# are metadata about a moment, never fed into identity generation, pattern
# detection, or any prompt-building code. Create + delete only, no edit.
# ==========================================================

def _owned_version_or_none(version_id, user_id):
    """Ownership-checked version lookup, shared by all three note routes."""
    return (
        IdentityVersion.query
        .join(IdentityTemplate, IdentityVersion.template_id == IdentityTemplate.id)
        .filter(IdentityVersion.id == version_id, IdentityTemplate.user_id == user_id)
        .first()
    )


@bp.route('/<version_id>/note', methods=['POST'])
@jwt_required_custom
def add_identity_note(version_id):
    try:
        user_id = request.current_user['user_id']
        data = request.get_json() or {}
        note_text = (data.get('note_text') or '').strip()

        if not note_text:
            return jsonify({"error": "note_text is required"}), 400
        if len(note_text) > 280:
            return jsonify({"error": "note_text must be 280 characters or fewer"}), 400

        version = _owned_version_or_none(version_id, user_id)
        if not version:
            return jsonify({"error": "Identity version not found"}), 404

        note = IdentityNote(
            user_id=user_id,
            identity_version_id=version_id,
            note_text=note_text
        )
        db.session.add(note)
        db.session.commit()

        return jsonify({"note": note.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route('/<version_id>/notes', methods=['GET'])
@jwt_required_custom
def get_identity_notes(version_id):
    try:
        user_id = request.current_user['user_id']

        version = _owned_version_or_none(version_id, user_id)
        if not version:
            return jsonify({"error": "Identity version not found"}), 404

        notes = (
            IdentityNote.query
            .filter_by(identity_version_id=version_id)
            .order_by(IdentityNote.created_at.asc())
            .all()
        )
        return jsonify({"notes": [n.to_dict() for n in notes]}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/note/<note_id>', methods=['DELETE'])
@jwt_required_custom
def delete_identity_note(note_id):
    try:
        user_id = request.current_user['user_id']

        note = IdentityNote.query.filter_by(id=note_id, user_id=user_id).first()
        if not note:
            return jsonify({"error": "Note not found"}), 404

        db.session.delete(note)
        db.session.commit()

        return jsonify({"message": "Note deleted"}), 200

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
        artwork_id = data.get("artwork_id")

        if not reflection:
            return jsonify({"error": "Reflection required"}), 400

        user_id = request.current_user['user_id']

        result = identity_service.generate_identity(
            reflection,
            user_id=user_id,
            artwork_id=artwork_id
        )

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

        user_id = request.current_user['user_id']

        intent = intent_service.detect_intent(user_input)

        if intent == "REFINE":
            result = identity_refinement_service.refine_identity(identity, user_input)
        else:
            result = identity_service.apply_user_edit(
                identity,
                user_input,
                intent,
                user_id
            )

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
# 🔥 PROFILE DATA (FINAL — FULL ML OUTPUT)
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
                },
                "dynamics": {
                    "persistent": [],
                    "one_off": [],
                    "emerging": [],
                    "fading": []
                },
                "clusters": [],
                "embedding_clusters": [],
                "similarities": [],
                "insights": []
            }), 200

        identities = [t.to_dict() for t in templates]

        # ✅ EXISTING
        patterns = pattern_service.detect_patterns(identities)
        trend = pattern_service.detect_trend(identities)

        # 🔥 NEW: whole-collection trait dynamics (Issue 6)
        dynamics = pattern_service.classify_trait_dynamics(identities)

        # 🔥 KEEP YOUR ORIGINAL (trait-based clustering)
        clusters = pattern_service.cluster_identities(identities)

        # 🔥 ADD REAL ML (embedding-based)
        embedding_clusters = pattern_service.cluster_embeddings(identities)
        similarities = pattern_service.similarity_matrix(identities)

        # 🔥 INSIGHTS
        insights = pattern_service.generate_insights(patterns, trend, dynamics)

        return jsonify({
            "identities": identities,
            "patterns": patterns,
            "trend": trend,
            "dynamics": dynamics,  # new (Issue 6)
            "clusters": clusters,  # old (safe)
            "embedding_clusters": embedding_clusters,  # new ML
            "similarities": similarities,  # new ML
            "insights": insights
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500