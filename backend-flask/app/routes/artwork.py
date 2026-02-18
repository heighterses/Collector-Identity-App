from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app import db
from app.models.user import User
from app.models.artwork import Artwork
from app.models.reflection import Reflection
from app.middleware.auth import jwt_required_custom
from app.services.s3_service import s3_service
import os

bp = Blueprint('artwork', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


# ==========================================================
# Helpers
# ==========================================================

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ==========================================================
# CREATE ARTWORK
# ==========================================================

@bp.route('/', methods=['POST'])
@jwt_required_custom
def create_artwork():
    try:
        user_id = request.current_user['user_id']

        title = request.form.get('title')
        description = request.form.get('description')
        artwork_type = request.form.get('artwork_type', 'image')
        image_file = request.files.get('imageFile')

        # ---------------- VALIDATION ----------------

        if not title or not title.strip():
            return jsonify({'error': 'Title is required'}), 400

        if artwork_type not in ['image', 'text']:
            return jsonify({'error': 'Invalid artwork type'}), 400

        # Milestone rule: one artwork per user
        existing_artwork = Artwork.query.filter_by(user_id=user_id).first()
        if existing_artwork:
            return jsonify({
                'error': 'User already has an artwork. Only one artwork allowed in Milestone 1.'
            }), 409

        if artwork_type == 'image':
            if not image_file or image_file.filename == '':
                return jsonify({'error': 'Image file is required'}), 400

            if not allowed_file(image_file.filename):
                return jsonify({'error': 'Invalid image format'}), 400

            image_file.seek(0, os.SEEK_END)
            file_size = image_file.tell()
            image_file.seek(0)

            if file_size > MAX_FILE_SIZE:
                return jsonify({'error': 'File too large (max 10MB)'}), 400

        if artwork_type == 'text':
            if not description or not description.strip():
                return jsonify({'error': 'Description is required for text artwork'}), 400

        # ---------------- S3 UPLOAD (IMAGE ONLY) ----------------

        image_url = None
        s3_object_key = None

        if artwork_type == 'image':
            try:
                file_buffer = image_file.read()

                upload_result = s3_service.upload_file(
                    file_buffer,
                    secure_filename(image_file.filename),
                    image_file.mimetype,
                    user_id
                )

                s3_object_key = upload_result['object_key']
                image_url = f'/api/images/{s3_object_key}'

                current_app.logger.info(f'Image uploaded to S3: {s3_object_key}')

            except Exception as e:
                current_app.logger.error(f'S3 upload failed: {str(e)}')
                return jsonify({'error': 'Image upload failed'}), 500

        # ---------------- CREATE ARTWORK ----------------

        artwork = Artwork(
            user_id=user_id,
            title=title.strip(),
            description=description.strip() if description else None,
            artwork_type=artwork_type,
            image_url=image_url,
            s3_object_key=s3_object_key
        )

        db.session.add(artwork)
        db.session.commit()

        # ---------------- AUTO GENERATE REFLECTION ----------------

        try:
            from app.services.reflection_service import reflection_service

            reflection_data = reflection_service.generate_initial_reflection_sync(artwork)

            if reflection_data:
                reflection = Reflection(
                    artwork_id=artwork.id,
                    content=reflection_data['content'],
                    type='initial'
                )

                db.session.add(reflection)
                db.session.commit()

                current_app.logger.info(
                    f'Reflection created for artwork {artwork.id}'
                )

        except Exception as reflection_error:
            current_app.logger.warning(
                f'Reflection generation failed: {str(reflection_error)}'
            )
            # Do NOT rollback artwork if reflection fails

        # Refresh relationship
        db.session.refresh(artwork)

        user = User.query.filter_by(id=user_id).first()

        return jsonify({
            'artwork': {
                'id': artwork.id,
                'title': artwork.title,
                'description': artwork.description,
                'artwork_type': artwork.artwork_type,
                'image_url': artwork.image_url,
                'created_at': artwork.created_at.isoformat(),
                'reflection': artwork.reflection.to_dict() if artwork.reflection else None,
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email
                }
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Artwork creation failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


# ==========================================================
# GET USER ARTWORK
# ==========================================================

@bp.route('/mine', methods=['GET'])
@jwt_required_custom
def get_user_artwork():
    try:
        user_id = request.current_user['user_id']

        artwork = Artwork.query.filter_by(user_id=user_id).first()
        if not artwork:
            return jsonify({'error': 'No artwork found'}), 404

        user = User.query.filter_by(id=user_id).first()

        return jsonify({
            'artwork': {
                'id': artwork.id,
                'title': artwork.title,
                'description': artwork.description,
                'artwork_type': artwork.artwork_type,
                'image_url': artwork.image_url,
                'created_at': artwork.created_at.isoformat(),
                'reflection': artwork.reflection.to_dict() if artwork.reflection else None,
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email
                }
            }
        })

    except Exception as e:
        current_app.logger.error(f'Get artwork failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


# ==========================================================
# DELETE USER ARTWORK
# ==========================================================

@bp.route('/mine', methods=['DELETE'])
@jwt_required_custom
def delete_user_artwork():
    try:
        user_id = request.current_user['user_id']

        artwork = Artwork.query.filter_by(user_id=user_id).first()
        if not artwork:
            return jsonify({'error': 'No artwork found'}), 404

        # Delete reflection first
        reflection = Reflection.query.filter_by(artwork_id=artwork.id).first()
        if reflection:
            db.session.delete(reflection)

        # Delete S3 image if exists
        if artwork.s3_object_key:
            try:
                s3_service.delete_file(artwork.s3_object_key)
            except Exception as e:
                current_app.logger.warning(f'S3 delete failed: {str(e)}')

        db.session.delete(artwork)
        db.session.commit()

        return jsonify({'message': 'Artwork deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Delete artwork failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500
