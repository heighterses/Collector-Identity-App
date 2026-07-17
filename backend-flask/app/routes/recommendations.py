from flask import Blueprint, request, jsonify
from app.middleware.auth import jwt_required_custom
from app.services.recommendation_service import recommendation_service
from app.services.insight_explanation_service import insight_explanation_service
from app.services.pattern_service import pattern_service
from app.models.identity import IdentityTemplate
import logging

bp = Blueprint('recommendations', __name__)
logger = logging.getLogger(__name__)


@bp.route('/', methods=['GET'])
@jwt_required_custom
def get_recommendations():
    """
    M3-02: Artwork recommendations based on the user's identity patterns.
    """
    try:
        user_id = request.current_user['user_id']

        templates = (
            IdentityTemplate.query
            .filter_by(user_id=user_id)
            .order_by(IdentityTemplate.created_at.asc())
            .all()
        )

        if not templates:
            return jsonify({
                "recommendations": [],
                "reasoning": "Upload your first artwork to receive personalised recommendations."
            }), 200

        identities = [t.to_dict() for t in templates]
        result = recommendation_service.recommend_next_artwork(identities)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Recommendations failed: {str(e)}")
        return jsonify({"error": str(e)}), 500


@bp.route('/explain', methods=['POST'])
@jwt_required_custom
def explain_insights():
    """
    M3-01: Explains why identity insights connect to the user's artwork patterns.
    Body: { "insights": [...], "artwork_description": "..." (optional) }
    """
    try:
        user_id = request.current_user['user_id']
        data = request.get_json()

        insights = data.get("insights", [])
        artwork_description = data.get("artwork_description", "")

        if not insights:
            return jsonify({"error": "insights list is required"}), 400

        templates = (
            IdentityTemplate.query
            .filter_by(user_id=user_id)
            .order_by(IdentityTemplate.created_at.desc())
            .first()
        )

        traits = templates.to_dict().get("traits", []) if templates else []

        results = insight_explanation_service.explain_all_insights(
            insights, traits, artwork_description
        )

        return jsonify({"explanations": results}), 200

    except Exception as e:
        logger.error(f"Insight explanation failed: {str(e)}")
        return jsonify({"error": str(e)}), 500
