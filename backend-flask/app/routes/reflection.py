from flask import Blueprint, request, jsonify, current_app
from app.middleware.auth import jwt_required_custom
from app import db

bp = Blueprint('reflection', __name__, url_prefix='/api/reflection')


# ==========================================================
# ✅ GET USER REFLECTION (LATEST)
# ==========================================================
@bp.route('/mine', methods=['GET'])
@jwt_required_custom
def get_my_reflection():
    try:
        user_id = request.current_user['user_id']

        from app.models.artwork import Artwork
        from app.models.reflection import Reflection

        artwork = (
            Artwork.query
            .filter_by(user_id=user_id)
            .order_by(Artwork.created_at.desc())
            .first()
        )

        if not artwork:
            return jsonify({'error': 'No artwork found'}), 404

        reflection = Reflection.query.filter_by(artwork_id=artwork.id).first()

        if not reflection:
            return jsonify({'error': 'No reflection found'}), 404

        return jsonify({
            'reflection': reflection.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f'Fetch reflection failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


# ==========================================================
# ✅ GET BY ARTWORK ID
# ==========================================================
@bp.route('/artwork/<artwork_id>', methods=['GET'])
@jwt_required_custom
def get_by_artwork(artwork_id):
    try:
        from app.models.reflection import Reflection

        reflection = Reflection.query.filter_by(artwork_id=artwork_id).first()

        if not reflection:
            return jsonify({'error': 'Reflection not found'}), 404

        return jsonify({
            'reflection': reflection.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f'Fetch by artwork failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


# ==========================================================
# 🔥 GENERATE FOR SPECIFIC ARTWORK
# ==========================================================
@bp.route('/generate/<artwork_id>', methods=['POST'])
@jwt_required_custom
def generate_reflection_for_artwork(artwork_id):
    try:
        from app.models.artwork import Artwork
        from app.services.reflection_service import reflection_service
        from app.services.identity_service import identity_service

        user_id = request.current_user['user_id']

        artwork = Artwork.query.filter_by(id=artwork_id, user_id=user_id).first()

        if not artwork:
            return jsonify({'error': 'Artwork not found'}), 404

        # ✅ Generate reflection
        reflection = reflection_service.generate_for_artwork(artwork)

        if not reflection:
            return jsonify({'error': 'Reflection generation failed'}), 500

        # ✅ Generate identity
        identity = identity_service.generate_for_reflection(
            user_id=user_id,
            artwork_id=artwork.id,
            reflection_text=reflection.content
        )

        return jsonify({
            'reflection': reflection.to_dict(),
            'identity': identity.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f'Generate reflection failed: {str(e)}')
        return jsonify({'error': 'Failed to generate reflection'}), 500


# ==========================================================
# 🔥 FIXED: REFINE REFLECTION + GENERATE IDENTITY
# ==========================================================
@bp.route('/refine', methods=['POST'])
@jwt_required_custom
def refine_reflection():
    try:
        data = request.get_json()

        reflection_id = data.get('reflection_id')
        user_input = data.get('input')

        if not reflection_id or not user_input or not user_input.strip():
            return jsonify({'error': 'User input is required'}), 400

        from app.models.reflection import Reflection
        from app.models.artwork import Artwork
        from app.services.reflection_service import reflection_service
        from app.services.identity_service import identity_service  # 🔥 IMPORTANT

        reflection = Reflection.query.get(reflection_id)

        if not reflection:
            return jsonify({'error': 'Reflection not found'}), 404

        artwork = Artwork.query.get(reflection.artwork_id)

        if not artwork:
            return jsonify({'error': 'Artwork not found'}), 404

        # ✅ REFINE
        updated_reflection = reflection_service.refine_reflection(
            artwork,
            reflection,
            user_input
        )

        if not updated_reflection:
            return jsonify({'error': 'Refinement failed'}), 500

        # 🔥🔥🔥 THIS WAS MISSING (MAIN FIX)
        identity_service.generate_for_reflection(
            user_id=request.current_user['user_id'],
            artwork_id=artwork.id,
            reflection_text=updated_reflection.content
        )

        return jsonify({
            'reflection': updated_reflection.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f'Refine reflection failed: {str(e)}')
        return jsonify({'error': 'Failed to refine reflection'}), 500


# ==========================================================
# ⚠️ KEEP OLD REGENERATE
# ==========================================================
@bp.route('/regenerate', methods=['POST'])
@jwt_required_custom
def regenerate_reflection():
    try:
        user_id = request.current_user['user_id']

        from app.models.artwork import Artwork
        from app.services.reflection_service import reflection_service

        artwork = (
            Artwork.query
            .filter_by(user_id=user_id)
            .order_by(Artwork.created_at.desc())
            .first()
        )

        if not artwork:
            return jsonify({'error': 'No artwork found'}), 404

        updated_reflection = reflection_service.generate_for_artwork(artwork)

        if not updated_reflection:
            return jsonify({'error': 'Generation failed'}), 500

        return jsonify({
            'reflection': updated_reflection.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f'Regenerate reflection failed: {str(e)}')
        return jsonify({'error': 'Failed to regenerate reflection'}), 500