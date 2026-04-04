from flask import Blueprint, request, jsonify, current_app
from app.middleware.auth import jwt_required_custom
from app import db

bp = Blueprint('reflection', __name__, url_prefix='/api/reflection')


# ==========================================================
# ✅ GET USER REFLECTION
# ==========================================================
@bp.route('/mine', methods=['GET'])
@jwt_required_custom
def get_my_reflection():
    try:
        user_id = request.current_user['user_id']

        from app.models.artwork import Artwork
        from app.models.reflection import Reflection

        artwork = Artwork.query.filter_by(user_id=user_id).first()

        if not artwork:
            return jsonify({'error': 'No artwork found'}), 404

        reflection = Reflection.query.filter_by(artwork_id=artwork.id).first()

        if not reflection:
            return jsonify({'error': 'No reflection found'}), 404

        return jsonify({
            'reflection': reflection.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f'Fetch reflection failed: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500


# ==========================================================
# ✅ REFINE REFLECTION (USER INPUT + AI)
# ==========================================================
@bp.route('/refine', methods=['POST'])
@jwt_required_custom
def refine_reflection():
    try:
        user_id = request.current_user['user_id']
        data = request.get_json()

        user_input = data.get('user_input')

        if not user_input or not user_input.strip():
            return jsonify({'error': 'User input is required'}), 400

        from app.models.artwork import Artwork
        from app.models.reflection import Reflection
        from app.services.reflection_pipeline import ReflectionPipeline

        artwork = Artwork.query.filter_by(user_id=user_id).first()

        if not artwork:
            return jsonify({'error': 'No artwork found'}), 404

        reflection = Reflection.query.filter_by(artwork_id=artwork.id).first()

        if not reflection:
            return jsonify({'error': 'No reflection found'}), 404

        pipeline = ReflectionPipeline()

        # 🧠 Build refine prompt
        prompt = pipeline.build_refinement_prompt(
            artwork=artwork,
            previous_reflection=reflection.content,
            user_input=user_input
        )

        # 🤖 Generate new reflection
        new_reflection = pipeline.generate(prompt)

        if not new_reflection:
            raise ValueError("AI returned empty response")

        # 💾 Update existing reflection
        reflection.content = new_reflection
        db.session.commit()

        return jsonify({
            'reflection': reflection.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f'Refine reflection failed: {str(e)}')
        return jsonify({'error': 'Failed to refine reflection'}), 500


# ==========================================================
# ✅ OPTIONAL: REGENERATE REFLECTION (WITHOUT USER INPUT)
# ==========================================================
@bp.route('/regenerate', methods=['POST'])
@jwt_required_custom
def regenerate_reflection():
    try:
        user_id = request.current_user['user_id']

        from app.models.artwork import Artwork
        from app.models.reflection import Reflection
        from app.services.reflection_pipeline import ReflectionPipeline

        artwork = Artwork.query.filter_by(user_id=user_id).first()

        if not artwork:
            return jsonify({'error': 'No artwork found'}), 404

        reflection = Reflection.query.filter_by(artwork_id=artwork.id).first()

        if not reflection:
            return jsonify({'error': 'No reflection found'}), 404

        pipeline = ReflectionPipeline()

        # Reuse initial prompt logic
        prompt = pipeline.build_initial_prompt(artwork)

        new_reflection = pipeline.generate(prompt)

        if not new_reflection:
            raise ValueError("AI returned empty response")

        reflection.content = new_reflection
        db.session.commit()

        return jsonify({
            'reflection': reflection.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.error(f'Regenerate reflection failed: {str(e)}')
        return jsonify({'error': 'Failed to regenerate reflection'}), 500