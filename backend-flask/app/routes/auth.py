from flask import Blueprint, request, jsonify, current_app
import bcrypt
import jwt
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
        
        # Generate JWT token
        token = jwt.encode(
            {'userId': user.id, 'email': user.email},
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
        
        # Generate JWT token (same as email login)
        token = jwt.encode(
            {'userId': user.id, 'email': user.email},
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
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'auth_provider': user.auth_provider,
                'onboarding_completed': user.onboarding_completed,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
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
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'auth_provider': user.auth_provider,
                'onboarding_completed': user.onboarding_completed,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Complete onboarding failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500