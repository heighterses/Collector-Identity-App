from functools import wraps
from flask import request, jsonify, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
import jwt

def jwt_required_custom(f):
    """Custom JWT authentication decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'Access token required'}), 401
        
        try:
            # Extract token from "Bearer <token>"
            token = auth_header.split(' ')[1] if auth_header.startswith('Bearer ') else auth_header
            
            # Verify token
            payload = jwt.decode(
                token, 
                current_app.config['JWT_SECRET_KEY'], 
                algorithms=['HS256']
            )
            
            # Add user info to request context
            request.current_user = {
                'user_id': payload.get('userId'),
                'email': payload.get('email')
            }
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 403
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid or expired token'}), 403
        except IndexError:
            return jsonify({'error': 'Invalid token format'}), 401
        except Exception as e:
            current_app.logger.error(f'JWT verification error: {str(e)}')
            return jsonify({'error': 'Invalid or expired token'}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function