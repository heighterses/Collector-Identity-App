from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models.user import User
from app.models.artwork import Artwork
from app.models.reflection import Reflection
from app.middleware.auth import jwt_required_custom
from app.services.reflection_service import reflection_service

bp = Blueprint('reflection', __name__)

@bp.route('/', methods=['POST'])
@jwt_required_custom
def create_reflection():
    """
    DEPRECATED: Reflections are now auto-generated when artwork is created.
    This endpoint is kept for backward compatibility but will return an error.
    """
    return jsonify({
        'error': 'Reflections are now automatically generated when you upload artwork. Please check the Reflections page to view your reflection.'
    }), 400

@bp.route('/mine', methods=['GET'])
@jwt_required_custom
def get_user_reflection():
    try:
        user_id = request.current_user['user_id']
        
        # Get user's artwork with reflection
        artwork = Artwork.query.filter_by(user_id=user_id).first()
        if not artwork:
            return jsonify({'error': 'No artwork found for this user'}), 404
        
        reflection = Reflection.query.filter_by(artwork_id=artwork.id).first()
        if not reflection:
            return jsonify({
                'error': 'No reflection found. Please generate a reflection first.'
            }), 404
        
        # Get user info
        user = User.query.filter_by(id=user_id).first()
        
        return jsonify({
            'reflection': {
                'id': reflection.id,
                'content': reflection.content,
                'type': reflection.type,
                'created_at': reflection.created_at.isoformat(),
                'artwork': {
                    'id': artwork.id,
                    'title': artwork.title,
                    'description': artwork.description,
                    'image_url': artwork.image_url,
                    'user': {
                        'id': user.id,
                        'name': user.name,
                        'email': user.email
                    }
                }
            }
        })
        
    except Exception as e:
        current_app.logger.error(f'Get reflection failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500