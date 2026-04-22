from flask import Blueprint, request, jsonify
from app.middleware.auth import jwt_required_custom

from app.services.identity_service import identity_service
from app.services.identity_refinement_service import identity_refinement_service
from app.services.pattern_service import pattern_service
from app.services.intent_service import intent_service  # 🔥 ML intent

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
                "clusters": [],
                "embedding_clusters": [],
                "similarities": [],
                "insights": []
            }), 200

        identities = [t.to_dict() for t in templates]

        # ✅ EXISTING
        patterns = pattern_service.detect_patterns(identities)
        trend = pattern_service.detect_trend(identities)

        # 🔥 KEEP YOUR ORIGINAL (trait-based clustering)
        clusters = pattern_service.cluster_identities(identities)

        # 🔥 ADD REAL ML (embedding-based)
        embedding_clusters = pattern_service.cluster_embeddings(identities)
        similarities = pattern_service.similarity_matrix(identities)

        # 🔥 INSIGHTS
        insights = pattern_service.generate_insights(patterns, trend)

        return jsonify({
            "identities": identities,
            "patterns": patterns,
            "trend": trend,
            "clusters": clusters,  # old (safe)
            "embedding_clusters": embedding_clusters,  # new ML
            "similarities": similarities,  # new ML
            "insights": insights
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500