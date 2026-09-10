from flask import Blueprint, request, jsonify, current_app
from app.middleware.auth import jwt_required_custom
from app import db

bp = Blueprint('reflection', __name__, url_prefix='/api/reflection')


# ==========================================================
# ✅ GET ALL REFLECTIONS FOR USER (across all artworks)
# ==========================================================
@bp.route('/all', methods=['GET'])
@jwt_required_custom
def get_all_reflections():
    try:
        user_id = request.current_user['user_id']

        from app.models.artwork import Artwork
        from app.models.reflection import Reflection

        artworks = (
            Artwork.query
            .filter_by(user_id=user_id)
            .order_by(Artwork.created_at.desc())
            .all()
        )

        artwork_ids = [a.id for a in artworks]

        reflections = (
            Reflection.query
            .filter(Reflection.artwork_id.in_(artwork_ids))
            .order_by(Reflection.created_at.desc())
            .all()
        )

        return jsonify({
            'reflections': [r.to_dict() for r in reflections]
        }), 200

    except Exception as e:
        current_app.logger.error(f'Fetch all reflections failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


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

        # ✅ Generate identity (non-blocking — may return a dict on error)
        try:
            identity = identity_service.generate_for_reflection(
                user_id=user_id,
                artwork_id=artwork.id,
                reflection_text=reflection.content
            )
            identity_data = identity.to_dict() if hasattr(identity, 'to_dict') else identity
        except Exception as identity_err:
            current_app.logger.warning(f"Identity generation failed (non-blocking): {str(identity_err)}")
            identity_data = None

        return jsonify({
            'reflection': reflection.to_dict(),
            'identity': identity_data
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
# 🔥 REGENERATE (Issue 10)
# Regenerates the reflection for a SPECIFIC artwork when artwork_id is supplied
# (ownership-checked), falling back to the user's most recent artwork only when
# it isn't — previously it always targeted the latest artwork regardless of what
# the user was viewing. Also refreshes the derived identity so identity analysis
# stays in sync, matching /refine. See REFINE_VS_REGENERATE.md.
# ==========================================================
@bp.route('/regenerate', methods=['POST'])
@jwt_required_custom
def regenerate_reflection():
    try:
        user_id = request.current_user['user_id']
        data = request.get_json(silent=True) or {}
        artwork_id = data.get('artwork_id')

        from app.models.artwork import Artwork
        from app.services.reflection_service import reflection_service
        from app.services.identity_service import identity_service

        if artwork_id:
            artwork = Artwork.query.filter_by(id=artwork_id, user_id=user_id).first()
        else:
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

        # Keep identity in sync with the regenerated reflection (non-blocking).
        try:
            identity_service.generate_for_reflection(
                user_id=user_id,
                artwork_id=artwork.id,
                reflection_text=updated_reflection.content
            )
        except Exception as identity_err:
            current_app.logger.warning(
                f"Identity refresh after regenerate failed (non-blocking): {str(identity_err)}"
            )

        return jsonify({
            'reflection': updated_reflection.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f'Regenerate reflection failed: {str(e)}')
        return jsonify({'error': 'Failed to regenerate reflection'}), 500