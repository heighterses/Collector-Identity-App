from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app import db
from app.models.user import User
from app.models.artwork import Artwork
from app.middleware.auth import jwt_required_custom
from app.services.s3_service import s3_service
import os

bp = Blueprint('artwork', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/', methods=['POST'])
@jwt_required_custom
def create_artwork():
    try:
        user_id = request.current_user['user_id']
        
        # Get form data
        title = request.form.get('title')
        description = request.form.get('description')
        image_file = request.files.get('imageFile')
        
        # Validate input
        if not title or not title.strip():
            return jsonify({'error': 'Title is required'}), 400
        
        # Must have either description OR imageFile (or both)
        has_description = description and description.strip()
        has_image = image_file is not None and image_file.filename != ''
        
        if not has_description and not has_image:
            return jsonify({'error': 'Either description or image file is required'}), 400
        
        # MILESTONE 1 CONSTRAINT: Check if user already has an artwork
        existing_artwork = Artwork.query.filter_by(user_id=user_id).first()
        if existing_artwork:
            return jsonify({
                'error': 'User already has an artwork. Only one artwork allowed in Milestone 1.'
            }), 409
        
        # Validate image file if provided
        if has_image:
            if not allowed_file(image_file.filename):
                return jsonify({'error': 'Only image files are allowed'}), 400
            
            # Check file size
            image_file.seek(0, os.SEEK_END)
            file_size = image_file.tell()
            image_file.seek(0)
            
            if file_size > MAX_FILE_SIZE:
                return jsonify({'error': 'File size too large. Maximum 10MB allowed.'}), 400
        
        # Upload image to S3 if provided
        image_url = None
        s3_object_key = None
        
        if has_image:
            try:
                file_buffer = image_file.read()
                upload_result = s3_service.upload_file(
                    file_buffer,
                    secure_filename(image_file.filename),
                    image_file.mimetype,
                    user_id
                )
                
                s3_object_key = upload_result['object_key']
                # Store the backend API URL that will serve the image
                image_url = f'/api/images/{s3_object_key}'
                
                current_app.logger.info(f'Image uploaded to S3 successfully: {s3_object_key}')
                
            except Exception as upload_error:
                current_app.logger.error(f'S3 upload failed: {str(upload_error)}')
                
                # Check if it's a connection error (MinIO not running)
                if 'ECONNREFUSED' in str(upload_error) or 'connect' in str(upload_error):
                    return jsonify({
                        'error': 'Image storage service is unavailable. Please ensure MinIO is running and try again.'
                    }), 503
                
                return jsonify({'error': 'Failed to upload image. Please try again.'}), 500
        
        # Create artwork
        artwork = Artwork(
            user_id=user_id,
            title=title.strip(),
            description=description.strip() if has_description else None,
            image_url=image_url,
            s3_object_key=s3_object_key
        )
        
        db.session.add(artwork)
        db.session.commit()
        
        # AUTO-GENERATE REFLECTION: Create reflection immediately after artwork creation
        try:
            from app.services.reflection_service import reflection_service
            reflection_data = reflection_service.generate_initial_reflection_sync(artwork)
            
            from app.models.reflection import Reflection
            reflection = Reflection(
                artwork_id=artwork.id,
                content=reflection_data['content'],
                type=reflection_data['type']
            )
            
            db.session.add(reflection)
            db.session.commit()
            
            current_app.logger.info(f'Auto-generated reflection: {reflection.id} for artwork: {artwork.id}')
            
        except Exception as reflection_error:
            # Log the error but don't fail the artwork creation
            current_app.logger.warning(f'Failed to auto-generate reflection: {str(reflection_error)}')
            # Reflection can be created manually later if auto-generation fails
        
        # Get user info for response
        user = User.query.filter_by(id=user_id).first()
        
        # Log successful artwork creation
        current_app.logger.info(f'Artwork created: {user_id}, {artwork.id}, {has_image}')
        
        return jsonify({
            'artwork': {
                'id': artwork.id,
                'title': artwork.title,
                'description': artwork.description,
                'image_url': artwork.image_url,
                'created_at': artwork.created_at.isoformat(),
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

@bp.route('/mine', methods=['DELETE'])
@jwt_required_custom
def delete_user_artwork():
    try:
        user_id = request.current_user['user_id']
        
        # Find user's artwork
        artwork = Artwork.query.filter_by(user_id=user_id).first()
        if not artwork:
            return jsonify({'error': 'No artwork found for this user'}), 404
        
        # Delete associated reflection first (if exists)
        from app.models.reflection import Reflection
        reflection = Reflection.query.filter_by(artwork_id=artwork.id).first()
        if reflection:
            db.session.delete(reflection)
            current_app.logger.info(f'Reflection deleted: {reflection.id}')
        
        # Delete image from S3 if it exists
        if artwork.s3_object_key:
            try:
                s3_service.delete_file(artwork.s3_object_key)
                current_app.logger.info(f'Image deleted from S3: {artwork.s3_object_key}')
            except Exception as s3_error:
                current_app.logger.warning(f'Failed to delete image from S3: {str(s3_error)}')
                # Continue with artwork deletion even if S3 deletion fails
        
        # Delete artwork from database
        artwork_id = artwork.id
        db.session.delete(artwork)
        db.session.commit()
        
        current_app.logger.info(f'Artwork deleted: {user_id}, {artwork_id}')
        
        return jsonify({
            'message': 'Artwork and associated data deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Artwork deletion failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/mine', methods=['GET'])
@jwt_required_custom
def get_user_artwork():
    try:
        user_id = request.current_user['user_id']
        
        artwork = Artwork.query.filter_by(user_id=user_id).first()
        if not artwork:
            return jsonify({'error': 'No artwork found for this user'}), 404
        
        # Get user info
        user = User.query.filter_by(id=user_id).first()
        
        return jsonify({
            'artwork': {
                'id': artwork.id,
                'title': artwork.title,
                'description': artwork.description,
                'image_url': artwork.image_url,
                'created_at': artwork.created_at.isoformat(),
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