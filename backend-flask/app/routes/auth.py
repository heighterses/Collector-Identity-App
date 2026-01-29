from flask import Blueprint, request, jsonify, current_app
import bcrypt
import jwt
from datetime import datetime, timedelta
from google.auth.transport import requests
from google.oauth2 import id_token
from app import db
from app.models.user import User
from app.middleware.auth import jwt_required_custom

bp = Blueprint('auth', __name__)

@bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        name = data.get('name')
        
        # Validate input
        if not email or not password or not name:
            return jsonify({'error': 'Name, email, and password are required'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'An account with this email already exists'}), 409
        
        # Hash password
        salt = bcrypt.gensalt(rounds=12)
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
        
        # Create user with auth_provider = "email"
        user = User(
            email=email,
            password=hashed_password.decode('utf-8'),
            name=name,
            auth_provider='email'
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Log successful signup
        current_app.logger.info(f'User signed up: {user.id}, {user.email}, email')
        
        # Return success message WITHOUT logging user in
        return jsonify({'message': 'Account created. Please sign in.'}), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Signup failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        # Validate input
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate JWT token with expiration
        token = jwt.encode(
            {
                'userId': user.id, 
                'email': user.email,
                'exp': datetime.utcnow() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
            },
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
        
        # Log successful login
        current_app.logger.info(f'User logged in: {user.id}, {user.email}, email')
        
        # Return user data (without password) and token
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name
            },
            'token': token
        })
        
    except Exception as e:
        current_app.logger.error(f'Login failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/google', methods=['POST'])
def google_signin():
    try:
        data = request.get_json()
        id_token_str = data.get('idToken')
        
        if not id_token_str:
            return jsonify({'error': 'Google ID token is required'}), 400
        
        # Verify Google ID token server-side
        try:
            idinfo = id_token.verify_oauth2_token(
                id_token_str, 
                requests.Request(), 
                current_app.config['GOOGLE_CLIENT_ID']
            )
            
            google_id = idinfo['sub']
            email = idinfo['email']
            name = idinfo['name']
            
        except ValueError as e:
            return jsonify({'error': 'Invalid Google token'}), 400
        
        if not email or not google_id:
            return jsonify({'error': 'Invalid Google token'}), 400
        
        # Check if user exists by email or google_id
        user = User.query.filter(
            (User.email == email) | (User.google_id == google_id)
        ).first()
        
        if user:
            # EXISTING USER: Link Google account if not already linked
            if not user.google_id:
                user.google_id = google_id
                user.auth_provider = 'google'
                db.session.commit()
        else:
            # NEW USER: Create user with Google data
            user = User(
                email=email,
                name=name,
                google_id=google_id,
                auth_provider='google',
                password=None  # No password for Google users
            )
            db.session.add(user)
            db.session.commit()
        
        # Generate JWT token with expiration (same as email login)
        token = jwt.encode(
            {
                'userId': user.id, 
                'email': user.email,
                'exp': datetime.utcnow() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
            },
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
        
        # Log successful Google login
        current_app.logger.info(f'User logged in: {user.id}, {user.email}, google')
        
        # Return user data and token
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'auth_provider': user.auth_provider
            },
            'token': token
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Google Sign-In failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/me', methods=['GET'])
@jwt_required_custom
def get_current_user():
    try:
        user_id = request.current_user['user_id']
        
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': user.to_dict()
        })
        
    except Exception as e:
        current_app.logger.error(f'Get user profile failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/complete-onboarding', methods=['POST'])
@jwt_required_custom
def complete_onboarding():
    try:
        user_id = request.current_user['user_id']
        
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.onboarding_completed = True
        db.session.commit()
        
        return jsonify({
            'user': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Complete onboarding failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/refresh', methods=['POST'])
@jwt_required_custom
def refresh_token():
    try:
        user_id = request.current_user['user_id']
        user_email = request.current_user['email']
        
        # Generate new JWT token with expiration
        new_token = jwt.encode(
            {
                'userId': user_id, 
                'email': user_email,
                'exp': datetime.utcnow() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
            },
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
        
        current_app.logger.info(f'Token refreshed for user: {user_id}, {user_email}')
        
        return jsonify({
            'token': new_token
        })
        
    except Exception as e:
        current_app.logger.error(f'Token refresh failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/profile', methods=['PUT'])
@jwt_required_custom
def update_profile():
    try:
        user_id = request.current_user['user_id']
        data = request.get_json()
        
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update allowed fields
        if 'name' in data:
            user.name = data['name'].strip()
        if 'language' in data:
            user.language = data['language']
        if 'timezone' in data:
            user.timezone = data['timezone']
        
        db.session.commit()
        
        current_app.logger.info(f'Profile updated for user: {user_id}')
        
        return jsonify({
            'user': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Profile update failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/avatar', methods=['POST'])
@jwt_required_custom
def upload_avatar():
    try:
        user_id = request.current_user['user_id']
        
        if 'avatar' not in request.files:
            return jsonify({'error': 'No avatar file provided'}), 400
        
        avatar_file = request.files['avatar']
        if avatar_file.filename == '':
            return jsonify({'error': 'No avatar file selected'}), 400
        
        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        if not ('.' in avatar_file.filename and 
                avatar_file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({'error': 'Invalid file type. Use PNG, JPG, JPEG, GIF, or WEBP'}), 400
        
        # Validate file size (2MB max)
        avatar_file.seek(0, 2)  # Seek to end
        file_size = avatar_file.tell()
        avatar_file.seek(0)  # Reset to beginning
        
        if file_size > 2 * 1024 * 1024:  # 2MB
            return jsonify({'error': 'File too large. Maximum size is 2MB'}), 400
        
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Upload to S3
        from app.services.s3_service import s3_service
        from werkzeug.utils import secure_filename
        
        file_buffer = avatar_file.read()
        upload_result = s3_service.upload_file(
            file_buffer,
            f"avatar_{secure_filename(avatar_file.filename)}",
            avatar_file.mimetype,
            user_id
        )
        
        # Delete old avatar if exists
        if user.avatar_url:
            try:
                old_key = user.avatar_url.replace('/api/images/', '')
                s3_service.delete_file(old_key)
            except Exception as e:
                current_app.logger.warning(f'Failed to delete old avatar: {str(e)}')
        
        # Update user avatar URL
        user.avatar_url = f'/api/images/{upload_result["object_key"]}'
        db.session.commit()
        
        current_app.logger.info(f'Avatar updated for user: {user_id}')
        
        return jsonify({
            'user': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Avatar upload failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/change-password', methods=['POST'])
@jwt_required_custom
def change_password():
    try:
        user_id = request.current_user['user_id']
        data = request.get_json()
        
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has password (not Google user)
        if not user.password:
            return jsonify({'error': 'Password change not available for Google accounts'}), 400
        
        # Verify current password
        if not bcrypt.checkpw(current_password.encode('utf-8'), user.password.encode('utf-8')):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Validate new password
        if len(new_password) < 8:
            return jsonify({'error': 'New password must be at least 8 characters long'}), 400
        
        # Hash new password
        salt = bcrypt.gensalt(rounds=12)
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), salt)
        
        # Update password
        user.password = hashed_password.decode('utf-8')
        db.session.commit()
        
        current_app.logger.info(f'Password changed for user: {user_id}')
        
        return jsonify({'message': 'Password updated successfully'})
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Password change failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/export-data', methods=['GET'])
@jwt_required_custom
def export_user_data():
    try:
        user_id = request.current_user['user_id']
        
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Collect user data
        from app.models.artwork import Artwork
        from app.models.reflection import Reflection
        
        artworks = Artwork.query.filter_by(user_id=user_id).all()
        reflections = []
        
        for artwork in artworks:
            artwork_reflections = Reflection.query.filter_by(artwork_id=artwork.id).all()
            reflections.extend(artwork_reflections)
        
        # Build export data
        export_data = {
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'auth_provider': user.auth_provider,
                'language': user.language,
                'timezone': user.timezone,
                'created_at': user.created_at.isoformat() if user.created_at else None
            },
            'artworks': [
                {
                    'id': artwork.id,
                    'title': artwork.title,
                    'description': artwork.description,
                    'image_url': artwork.image_url,
                    'created_at': artwork.created_at.isoformat() if artwork.created_at else None
                }
                for artwork in artworks
            ],
            'reflections': [
                {
                    'id': reflection.id,
                    'content': reflection.content,
                    'type': reflection.type,
                    'artwork_id': reflection.artwork_id,
                    'created_at': reflection.created_at.isoformat() if reflection.created_at else None
                }
                for reflection in reflections
            ],
            'export_date': datetime.utcnow().isoformat()
        }
        
        current_app.logger.info(f'Data exported for user: {user_id}')
        
        return jsonify(export_data)
        
    except Exception as e:
        current_app.logger.error(f'Data export failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/delete-account', methods=['DELETE'])
@jwt_required_custom
def delete_account():
    try:
        user_id = request.current_user['user_id']
        
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete user's artworks (cascade will handle reflections)
        from app.models.artwork import Artwork
        artworks = Artwork.query.filter_by(user_id=user_id).all()
        
        # Delete S3 files
        from app.services.s3_service import s3_service
        
        for artwork in artworks:
            if artwork.s3_object_key:
                try:
                    s3_service.delete_file(artwork.s3_object_key)
                except Exception as e:
                    current_app.logger.warning(f'Failed to delete artwork file: {str(e)}')
        
        # Delete avatar
        if user.avatar_url:
            try:
                avatar_key = user.avatar_url.replace('/api/images/', '')
                s3_service.delete_file(avatar_key)
            except Exception as e:
                current_app.logger.warning(f'Failed to delete avatar: {str(e)}')
        
        # Delete user (cascade will delete artworks and reflections)
        db.session.delete(user)
        db.session.commit()
        
        current_app.logger.info(f'Account deleted for user: {user_id}')
        
        return jsonify({'message': 'Account deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Account deletion failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500