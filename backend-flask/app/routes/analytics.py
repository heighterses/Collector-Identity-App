from flask import Blueprint, jsonify
from app.middleware.auth import jwt_required_custom
from app.services.analytics_service import analytics_service

bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')


@bp.route('/return-behavior', methods=['GET'])
@jwt_required_custom
def get_return_behavior():
    """
    M3-10: share of users who added a 2nd (or more) artwork within 30 days
    of signup — the core return-behavior hypothesis from CLAUDE.md Section 8.
    """
    try:
        stats = analytics_service.get_return_behavior_stats()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
