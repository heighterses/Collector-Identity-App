from flask import Blueprint, request, jsonify, current_app
from app.middleware.auth import jwt_required_custom
from app import db

bp = Blueprint('artwork', __name__, url_prefix='/api/artwork')


# ==========================================================
# ✅ CREATE ARTWORK (NOW MULTIPLE ALLOWED)
# ==========================================================
@bp.route('/', methods=['POST'])
@jwt_required_custom
def create_artwork():
    try:
        user_id = request.current_user['user_id']

        from app.models.artwork import Artwork

        title = request.form.get('title')
        description = request.form.get('description')

        artwork = Artwork(
            user_id=user_id,
            title=title,
            description=description
        )

        db.session.add(artwork)
        db.session.commit()

        # 🔥 Trigger identity generation if description exists
        if description:
            try:
                from app.services.identity_service import identity_service
                identity_service.generate_for_reflection(
                    user_id=user_id,
                    artwork_id=artwork.id,
                    reflection_text=description
                )
                current_app.logger.info(f"Identity generated for artwork {artwork.id}")
            except Exception as e:
                current_app.logger.warning(f"Identity generation failed (non-blocking): {str(e)}")

        return jsonify({
            "artwork": artwork.to_dict()
        }), 201

    except Exception as e:
        current_app.logger.error(f'Artwork creation failed: {str(e)}')
        return jsonify({'error': 'Failed to create artwork'}), 500


# ==========================================================
# ✅ GET ALL USER ARTWORKS
# ==========================================================
@bp.route('/mine', methods=['GET'])
@jwt_required_custom
def get_my_artworks():
    try:
        user_id = request.current_user['user_id']

        from app.models.artwork import Artwork

        artworks = Artwork.query.filter_by(user_id=user_id).order_by(Artwork.created_at.desc()).all()

        return jsonify({
            "artworks": [a.to_dict() for a in artworks]
        }), 200

    except Exception as e:
        current_app.logger.error(f'Fetch artworks failed: {str(e)}')
        return jsonify({'error': 'Failed to fetch artworks'}), 500


# ==========================================================
# ✅ DELETE SINGLE ARTWORK
# ==========================================================
@bp.route('/<artwork_id>', methods=['DELETE'])
@jwt_required_custom
def delete_artwork(artwork_id):
    try:
        user_id = request.current_user['user_id']

        from app.models.artwork import Artwork

        artwork = Artwork.query.filter_by(id=artwork_id, user_id=user_id).first()

        if not artwork:
            return jsonify({'error': 'Artwork not found'}), 404

        db.session.delete(artwork)
        db.session.commit()

        return jsonify({'message': 'Artwork deleted'}), 200

    except Exception as e:
        current_app.logger.error(f'Delete artwork failed: {str(e)}')
        return jsonify({'error': 'Failed to delete artwork'}), 500