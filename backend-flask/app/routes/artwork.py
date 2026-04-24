from flask import Blueprint, request, jsonify, current_app
from app.middleware.auth import jwt_required_custom
from app import db

bp = Blueprint('artwork', __name__, url_prefix='/api/artwork')


# ==========================================================
# ✅ CREATE ARTWORK (WITH IMAGE UPLOAD)
# ==========================================================
@bp.route('/', methods=['POST'])
@jwt_required_custom
def create_artwork():
    try:
        user_id = request.current_user['user_id']

        from app.models.artwork import Artwork

        title = request.form.get('title')
        description = request.form.get('description')
        artwork_type = request.form.get('artwork_type', 'image')

        if not title or not title.strip():
            return jsonify({'error': 'Title is required'}), 400

        artwork = Artwork(
            user_id=user_id,
            title=title.strip(),
            description=description,
            artwork_type=artwork_type,
        )

        # ── Handle image upload ──────────────────────────────────
        image_file = request.files.get('imageFile')
        if image_file and image_file.filename:
            try:
                from app.services.s3_service import s3_service
                file_bytes = image_file.read()
                mime_type = image_file.mimetype or 'image/jpeg'
                result = s3_service.upload_file(
                    file_buffer=file_bytes,
                    original_filename=image_file.filename,
                    mime_type=mime_type,
                    user_id=user_id,
                )
                # Store the proxy path so the browser fetches via /api/images/<key>
                artwork.image_url = f"/api/images/{result['object_key']}"
                artwork.s3_object_key = result['object_key']
                current_app.logger.info(f"Image uploaded: {result['object_key']}")
            except Exception as upload_err:
                current_app.logger.error(f"Image upload failed (non-blocking): {str(upload_err)}")
                # Continue without image rather than failing the whole request

        db.session.add(artwork)
        db.session.commit()

        # ── Trigger identity generation if description exists ────
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