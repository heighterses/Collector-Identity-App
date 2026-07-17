from flask import Blueprint, request, jsonify
from app.middleware.auth import jwt_required_custom
from app.services.version_comparison_service import version_comparison_service
from app.services.embedding_service import embedding_service
from app.models.identity import IdentityTemplate
from app.models.identity_version import IdentityVersion
import logging

bp = Blueprint('comparison', __name__)
logger = logging.getLogger(__name__)


@bp.route('/versions', methods=['POST'])
@jwt_required_custom
def compare_versions():
    """
    M3-14: Compares two identity versions side by side.
    Body: { "version_a_id": "...", "version_b_id": "..." }
    """
    try:
        user_id = request.current_user['user_id']
        data = request.get_json()

        id_a = data.get("version_a_id")
        id_b = data.get("version_b_id")

        if not id_a or not id_b:
            return jsonify({"error": "Both version_a_id and version_b_id are required"}), 400

        if id_a == id_b:
            return jsonify({"error": "Cannot compare a version to itself"}), 400

        version_a = IdentityVersion.query.get(id_a)
        version_b = IdentityVersion.query.get(id_b)

        if not version_a or not version_b:
            return jsonify({"error": "One or both versions not found"}), 404

        # Ownership check via template → user
        template_a = IdentityTemplate.query.filter_by(
            id=version_a.template_id, user_id=user_id
        ).first()
        template_b = IdentityTemplate.query.filter_by(
            id=version_b.template_id, user_id=user_id
        ).first()

        if not template_a or not template_b:
            return jsonify({"error": "Unauthorized"}), 403

        result = version_comparison_service.compare(
            version_a.to_dict(),
            version_b.to_dict(),
            embedding_service=embedding_service
        )

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Version comparison failed: {str(e)}")
        return jsonify({"error": str(e)}), 500


@bp.route('/templates/<template_id>/versions', methods=['GET'])
@jwt_required_custom
def list_comparable_versions(template_id):
    """
    Returns all saved versions for a template so the UI can let the user pick two.
    """
    try:
        user_id = request.current_user['user_id']

        template = IdentityTemplate.query.filter_by(
            id=template_id, user_id=user_id
        ).first()

        if not template:
            return jsonify({"error": "Template not found"}), 404

        versions = (
            IdentityVersion.query
            .filter_by(template_id=template_id)
            .order_by(IdentityVersion.version_number.asc())
            .all()
        )

        return jsonify({
            "template_id": template_id,
            "versions": [v.to_dict() for v in versions]
        }), 200

    except Exception as e:
        logger.error(f"List versions failed: {str(e)}")
        return jsonify({"error": str(e)}), 500
