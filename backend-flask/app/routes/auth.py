from flask import Blueprint, request, jsonify, current_app
import bcrypt
import jwt
import json
import os
from datetime import datetime, timedelta
from google.auth.transport import requests
from google.oauth2 import id_token
from werkzeug.utils import secure_filename
from app import db
from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.services.sendgrid_email_service import sendgrid_email_service
from app.services.s3_service import s3_service
from app.middleware.auth import jwt_required_custom
import re

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
                'name': user.name,
                'user_role': user.user_role
            },
            'token': token,
            'role_required': user.user_role is None
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
            current_app.logger.error(f'Google token verification failed: {str(e)}')
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
                'auth_provider': user.auth_provider,
                'user_role': user.user_role
            },
            'token': token,
            'role_required': user.user_role is None
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
@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        # Validate input
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Validate email format
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return jsonify({'error': 'Please enter a valid email address'}), 400
        
        # Find user by email (but don't reveal if user exists)
        user = User.query.filter_by(email=email).first()
        
        if user and user.auth_provider == 'email':
            # Generate reset token
            try:
                reset_token = PasswordResetToken.create_reset_token(user.id)
                
                # Send reset email
                email_sent = sendgrid_email_service.send_password_reset_email(
                    user.email, 
                    user.name, 
                    reset_token
                )
                
                if email_sent:
                    current_app.logger.info(f'Password reset requested for user: {user.id}')
                else:
                    current_app.logger.error(f'Failed to send password reset email for user: {user.id}')
                    
            except Exception as e:
                current_app.logger.error(f'Password reset token creation failed: {str(e)}')
        
        # Always return the same message (security: don't reveal if email exists)
        return jsonify({
            'message': 'If an account exists, a reset link has been sent to your email.'
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Forgot password failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token"""
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('password')
        
        # Validate input
        if not token or not new_password:
            return jsonify({'error': 'Token and new password are required'}), 400
        
        # Validate password strength
        if len(new_password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
        # Validate token
        reset_token = PasswordResetToken.validate_token(token)
        if not reset_token:
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        
        # Get user
        user = User.query.filter_by(id=reset_token.user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user is email-based (not Google)
        if user.auth_provider != 'email':
            return jsonify({'error': 'Password reset not available for this account type'}), 400
        
        # Hash new password
        salt = bcrypt.gensalt(rounds=12)
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), salt)
        
        # Update password
        user.password = hashed_password.decode('utf-8')
        
        # Mark token as used
        reset_token.mark_as_used()
        
        db.session.commit()
        
        current_app.logger.info(f'Password reset completed for user: {user.id}')
        
        return jsonify({'message': 'Password reset successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Password reset failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/verify-reset-token', methods=['POST'])
def verify_reset_token():
    """Verify reset token without using it"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'valid': False, 'error': 'Token is required'}), 400
        
        # Validate token
        reset_token = PasswordResetToken.validate_token(token)
        if not reset_token:
            return jsonify({'valid': False, 'error': 'Invalid or expired token'}), 200
        
        return jsonify({'valid': True}), 200
        
    except Exception as e:
        current_app.logger.error(f'Token verification failed: {str(e)}')
        return jsonify({'valid': False, 'error': 'Internal server error'}), 500

@bp.route('/validate-reset-token', methods=['POST'])
def validate_reset_token():
    """Validate reset token without using it"""
    try:
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'Token is required'}), 400
        
        # Validate token
        reset_token = PasswordResetToken.validate_token(token)
        if not reset_token:
            return jsonify({'valid': False}), 200
        
        return jsonify({'valid': True}), 200
        
    except Exception as e:
        current_app.logger.error(f'Token validation failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

# Profile Management Endpoints

@bp.route('/profile', methods=['PUT'])
@jwt_required_custom
def update_profile():
    """Update user profile (name, language, timezone)"""
    try:
        data = request.get_json()
        user_id = request.current_user['user_id']
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update allowed profile fields
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'error': 'Name cannot be empty'}), 400
            user.name = name
            
        if 'language' in data:
            language = data['language']
            # Validate language code (basic validation)
            if language not in ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh']:
                return jsonify({'error': 'Invalid language code'}), 400
            user.language = language
            
        if 'timezone' in data:
            timezone = data['timezone']
            # Basic timezone validation
            valid_timezones = [
                'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 
                'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
                'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Seoul', 'Australia/Sydney'
            ]
            if timezone not in valid_timezones:
                return jsonify({'error': 'Invalid timezone'}), 400
            user.timezone = timezone
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        current_app.logger.info(f'Profile updated for user: {user_id}')
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Profile update failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/avatar', methods=['POST'])
@jwt_required_custom
def upload_avatar():
    """Upload user avatar to MinIO and save proxy URL in DB"""
    try:
        user_id = request.current_user['user_id']

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if 'avatar' not in request.files:
            return jsonify({'error': 'No avatar file provided'}), 400

        file = request.files['avatar']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Validate file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
        if ext not in allowed_extensions:
            return jsonify({'error': 'Invalid file type. Allowed: PNG, JPG, JPEG, GIF, WEBP'}), 400

        # Validate file size (2 MB max)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        if file_size > 2 * 1024 * 1024:
            return jsonify({'error': 'File too large. Maximum size is 2MB'}), 400

        # Build a unique object key inside the avatars/ prefix
        object_key = f"avatars/user-{user_id}/{int(datetime.utcnow().timestamp())}.{ext}"

        # Read bytes and upload via s3_service
        file_bytes = file.read()
        mime_type = file.mimetype or f"image/{ext}"

        try:
            # Use explicit key upload so avatars go to avatars/ prefix, not artworks/
            upload_result = s3_service.upload_file_with_key(
                file_bytes,
                object_key,
                mime_type
            )
            saved_key = upload_result['object_key']
            current_app.logger.info(f'Avatar uploaded to S3: {saved_key}')
        except Exception as upload_error:
            current_app.logger.error(f'Avatar S3 upload failed: {str(upload_error)}')
            return jsonify({'error': 'Failed to upload avatar'}), 500

        # Delete old avatar from S3 if it exists
        if user.avatar_url:
            try:
                # avatar_url is stored as /api/images/<object_key>
                old_key = user.avatar_url.replace('/api/images/', '', 1)
                s3_service.delete_file(old_key)
            except Exception:
                pass  # Non-fatal

        # Store as a proxy path — never store raw MinIO URLs
        user.avatar_url = f'/api/images/{saved_key}'
        user.updated_at = datetime.utcnow()
        db.session.commit()

        current_app.logger.info(f'Avatar saved for user {user_id}: {user.avatar_url}')
        return jsonify({
            'message': 'Avatar uploaded successfully',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Avatar upload failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

# Settings Management Endpoints

@bp.route('/change-password', methods=['POST'])
@jwt_required_custom
def change_password():
    """Change user password"""
    try:
        data = request.get_json()
        user_id = request.current_user['user_id']
        
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user has a password (Google users might not)
        if not user.password:
            return jsonify({'error': 'Password change not available for this account type'}), 400
        
        # Verify current password
        if not bcrypt.checkpw(current_password.encode('utf-8'), user.password.encode('utf-8')):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        # Validate new password
        if len(new_password) < 8:
            return jsonify({'error': 'New password must be at least 8 characters long'}), 400
        
        # Hash new password
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        user.password = hashed_password.decode('utf-8')
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        current_app.logger.info(f'Password changed for user: {user_id}')
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Password change failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/preferences', methods=['PUT'])
@jwt_required_custom
def update_preferences():
    """Update user preferences (privacy and notification settings)"""
    try:
        data = request.get_json()
        user_id = request.current_user['user_id']
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update privacy settings
        if 'privacy_settings' in data:
            privacy_data = data['privacy_settings']
            current_privacy = user.privacy_settings or {}
            
            # Validate and update privacy settings
            if 'profile_visibility' in privacy_data:
                if privacy_data['profile_visibility'] in ['public', 'private']:
                    current_privacy['profile_visibility'] = privacy_data['profile_visibility']
            
            if 'data_sharing' in privacy_data:
                current_privacy['data_sharing'] = bool(privacy_data['data_sharing'])
            
            if 'analytics' in privacy_data:
                current_privacy['analytics'] = bool(privacy_data['analytics'])
            
            user.privacy_settings = current_privacy
        
        # Update notification settings
        if 'notification_settings' in data:
            notification_data = data['notification_settings']
            current_notifications = user.notification_settings or {}
            
            # Validate and update notification settings
            if 'email_notifications' in notification_data:
                current_notifications['email_notifications'] = bool(notification_data['email_notifications'])
            
            if 'push_notifications' in notification_data:
                current_notifications['push_notifications'] = bool(notification_data['push_notifications'])
            
            if 'marketing_emails' in notification_data:
                current_notifications['marketing_emails'] = bool(notification_data['marketing_emails'])
            
            user.notification_settings = current_notifications
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        current_app.logger.info(f'Preferences updated for user: {user_id}')
        return jsonify({
            'message': 'Preferences updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Preferences update failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/export-data', methods=['GET'])
@jwt_required_custom
def export_data():
    """Export user data"""
    try:
        user_id = request.current_user['user_id']
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get user's artworks
        from app.models.artwork import Artwork
        from app.models.reflection import Reflection
        
        artworks = Artwork.query.filter_by(user_id=user_id).all()
        artwork_data = []
        
        for artwork in artworks:
            artwork_dict = {
                'id': artwork.id,
                'title': artwork.title,
                'description': artwork.description,
                'image_url': artwork.image_url,
                'created_at': artwork.created_at.isoformat() if artwork.created_at else None
            }
            
            # Get reflections for this artwork
            reflections = Reflection.query.filter_by(artwork_id=artwork.id).all()
            artwork_dict['reflections'] = [
                {
                    'id': reflection.id,
                    'content': reflection.content,
                    'created_at': reflection.created_at.isoformat() if reflection.created_at else None
                }
                for reflection in reflections
            ]
            
            artwork_data.append(artwork_dict)
        
        # Compile export data
        export_data = {
            'user': user.to_dict(include_sensitive=False),
            'artworks': artwork_data,
            'export_date': datetime.utcnow().isoformat(),
            'version': '1.0'
        }
        
        current_app.logger.info(f'Data exported for user: {user_id}')
        return jsonify(export_data), 200
        
    except Exception as e:
        current_app.logger.error(f'Data export failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/delete-account', methods=['DELETE'])
@jwt_required_custom
def delete_account():
    """Delete user account and all associated data"""
    try:
        user_id = request.current_user['user_id']
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Delete user's avatar from S3 if exists
        if user.avatar_url:
            try:
                avatar_key = user.avatar_url.split('/')[-1]
                s3_service.delete_file(f"avatars/{avatar_key}")
            except:
                pass  # Don't fail if avatar deletion fails
        
        # Delete user's artworks and associated files
        from app.models.artwork import Artwork
        artworks = Artwork.query.filter_by(user_id=user_id).all()
        
        for artwork in artworks:
            # Delete artwork image from S3
            if artwork.image_url:
                try:
                    image_key = artwork.image_url.split('/')[-1]
                    s3_service.delete_file(f"artworks/{image_key}")
                except:
                    pass
        
        # Delete password reset tokens
        PasswordResetToken.query.filter_by(user_id=user_id).delete()
        
        # Delete user (cascade will handle artworks and reflections)
        db.session.delete(user)
        db.session.commit()
        
        current_app.logger.info(f'Account deleted for user: {user_id}')
        return jsonify({'message': 'Account deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Account deletion failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/complete-onboarding', methods=['POST'])
@jwt_required_custom
def complete_onboarding():
    """Mark user onboarding as completed"""
    try:
        user_id = request.current_user['user_id']
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.onboarding_completed = True
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        current_app.logger.info(f'Onboarding completed for user: {user_id}')
        return jsonify({
            'message': 'Onboarding completed successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Complete onboarding failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

@bp.route('/set-role', methods=['POST'])
@jwt_required_custom
def set_role():
    """Set user role during onboarding"""
    try:
        user_id = request.current_user['user_id']
        data = request.get_json()
        role = data.get('role', '').lower().strip()

        VALID_ROLES = {'artist', 'collector', 'enthusiast'}
        if role not in VALID_ROLES:
            return jsonify({'error': f'Invalid role. Must be one of: {", ".join(VALID_ROLES)}'}), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user.user_role = role
        user.role_selected_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        db.session.commit()

        current_app.logger.info(f'Role set for user {user_id}: {role}')
        return jsonify({
            'message': 'Role set successfully',
            'user_role': user.user_role
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Set role failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500
