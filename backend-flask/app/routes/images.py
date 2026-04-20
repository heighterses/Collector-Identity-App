from flask import Blueprint, Response, current_app
from app.services.s3_service import s3_service

bp = Blueprint('images', __name__)


@bp.route('/<path:object_key>', methods=['GET'])
def get_image(object_key):
    try:
        current_app.logger.info(f"Fetching image: {object_key}")

        # Get file from S3 / MinIO
        file_obj = s3_service.get_file(object_key)

        if not file_obj:
            return {"error": "Image not found"}, 404

        return Response(
            file_obj["Body"].read(),
            mimetype=file_obj.get("ContentType", "image/jpeg")
        )

    except Exception as e:
        current_app.logger.error(f"Image fetch failed: {str(e)}")
        return {"error": "Failed to fetch image"}, 500