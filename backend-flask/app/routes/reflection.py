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
    try:
        user_id = request.current_user['user_id']
        
        # Get user's artwork
        artwork = Artwork.query.filter_by(user_id=user_id).first()
        if not artwork:
            return jsonify({
                'error': 'No artwork found. Please create an artwork first.'
            }), 404
        
        # MILESTONE 1 CONSTRAINT: Check if reflection already exists
        existing_reflection = Reflection.query.filter_by(artwork_id=artwork.id).first()
        if existing_reflection:
            return jsonify({
                'error': 'Reflection already exists for this artwork. Only one reflection allowed in Milestone 1.'
            }), 409
        
        # Generate reflection using mock service
        reflection_data = reflection_service.generate_initial_reflection_sync(artwork)
        
        # Create reflection in database
        reflection = Reflection(
            artwork_id=artwork.id,
            content=reflection_data['content'],
            type=reflection_data['type']
        )
        
        db.session.add(reflection)
        db.session.commit()
        
        # Get user info for response
        user = User.query.filter_by(id=user_id).first()
        
        # Log successful reflection creation
        current_app.logger.info(f'Reflection created: {user_id}, {artwork.id}, {reflection.id}')
        
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
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Reflection creation failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

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