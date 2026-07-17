from flask import Blueprint, request, jsonify
from app.middleware.auth import jwt_required_custom
from app.services.timeline_service import timeline_service
from app.services.identity_change_detector import identity_change_detector
from app.models.identity import IdentityTemplate
from app.models.identity_version import IdentityVersion
import logging

bp = Blueprint('timeline', __name__)
logger = logging.getLogger(__name__)


@bp.route('/', methods=['GET'])
@jwt_required_custom
def get_timeline():
    """
    M3-12: Returns the user's full identity evolution timeline.
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
            return jsonify({"events": [], "summary": {}}), 200

        template_dicts = [t.to_dict() for t in templates]

        versions = (
            IdentityVersion.query
            .filter(IdentityVersion.template_id.in_([t.id for t in templates]))
            .order_by(IdentityVersion.version_number.asc())
            .all()
        )
        version_dicts = [v.to_dict() for v in versions]

        events = timeline_service.build_timeline(template_dicts, version_dicts)
        summary = timeline_service.get_timeline_summary(events)

        return jsonify({"events": events, "summary": summary}), 200

    except Exception as e:
        logger.error(f"Timeline fetch failed: {str(e)}")
        return jsonify({"error": str(e)}), 500


@bp.route('/changes', methods=['GET'])
@jwt_required_custom
def get_identity_changes():
    """
    M3-13: Detects stable traits, emerging traits, fading traits, and intensity trends.
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
            return jsonify(identity_change_detector._empty_result()), 200

        template_dicts = [t.to_dict() for t in templates]
        result = identity_change_detector.detect_changes(template_dicts)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Change detection failed: {str(e)}")
        return jsonify({"error": str(e)}), 500
