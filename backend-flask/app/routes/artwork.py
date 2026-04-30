from flask import Blueprint, request, jsonify, current_app
from app.middleware.auth import jwt_required_custom
from app import db
import threading

bp = Blueprint('artwork', __name__, url_prefix='/api/artwork')


def _run_reflection_and_identity(app, artwork_id, user_id, user_role):
    """
    Background thread: generate reflection + identity for a newly uploaded
    artwork, then flip artwork.status to 'completed'.
    """
    with app.app_context():
        try:
            from app.models.artwork import Artwork
            from app.services.reflection_service import reflection_service
            from app.services.identity_service import identity_service

            artwork = Artwork.query.get(artwork_id)
            if not artwork:
                return

            # 1. Generate reflection
            reflection = reflection_service.generate_for_artwork(artwork)

            # 2. Generate identity (non-blocking on failure)
            if reflection:
                try:
                    identity_service.generate_for_reflection(
                        user_id=user_id,
                        artwork_id=artwork_id,
                        reflection_text=reflection.content,
                        user_role=user_role,
                    )
                except Exception as ie:
                    current_app.logger.warning(
                        f"Identity generation failed (non-blocking): {ie}"
                    )

            # 3. Mark artwork as completed
            artwork.status = 'completed'
            db.session.commit()
            current_app.logger.info(
                f"Artwork {artwork_id} processing complete"
            )

        except Exception as e:
            current_app.logger.error(
                f"Background processing failed for artwork {artwork_id}: {e}"
            )
            # Still flip to completed so the card doesn't spin forever
            try:
                from app.models.artwork import Artwork
                artwork = Artwork.query.get(artwork_id)
                if artwork:
                    artwork.status = 'completed'
                    db.session.commit()
            except Exception:
                pass


# ==========================================================
# ✅ CREATE ARTWORK (WITH IMAGE UPLOAD)
# ==========================================================
@bp.route('/', methods=['POST'])
@jwt_required_custom
def create_artwork():
    try:
        user_id = request.current_user['user_id']

        from app.models.artwork import Artwork
        from app.models.user import User as UserModel

        title = request.form.get('title')
        description = request.form.get('description')
        artwork_type = request.form.get('artwork_type', 'image')

        if not title or not title.strip():
            return jsonify({'error': 'Title is required'}), 400

        # Create artwork immediately with status='processing'
        artwork = Artwork(
            user_id=user_id,
            title=title.strip(),
            description=description,
            artwork_type=artwork_type,
            status='processing',
        )

        # ── Handle image upload (synchronous — fast) ─────────────
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
                artwork.image_url = f"/api/images/{result['object_key']}"
                artwork.s3_object_key = result['object_key']
                current_app.logger.info(f"Image uploaded: {result['object_key']}")
            except Exception as upload_err:
                current_app.logger.error(
                    f"Image upload failed (non-blocking): {upload_err}"
                )

        db.session.add(artwork)
        db.session.commit()

        # ── Kick off reflection + identity in background ─────────
        user_obj = UserModel.query.get(user_id)
        user_role = user_obj.user_role if user_obj else None

        t = threading.Thread(
            target=_run_reflection_and_identity,
            args=(current_app._get_current_object(), artwork.id, user_id, user_role),
            daemon=True,
        )
        t.start()

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

        artworks = (
            Artwork.query
            .filter_by(user_id=user_id)
            .order_by(Artwork.created_at.desc())
            .all()
        )

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
