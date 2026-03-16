from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from config import Config
import logging
import os

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    migrate.init_app(app, db)
    
    # Configure logging
    if not app.debug:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        file_handler = logging.FileHandler('logs/app.log')
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Flask app startup')
    
    # Import models so Flask-Migrate can detect them
    from app.models import identity  # noqa: F401

    # Register blueprints
    from app.routes.auth import bp as auth_bp
    from app.routes.artwork import bp as artwork_bp
    from app.routes.reflection import bp as reflection_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(artwork_bp, url_prefix='/api/artwork')
    app.register_blueprint(reflection_bp, url_prefix='/api/reflection')
    
    # Health check route
    @app.route('/health')
    def health_check():
        return {'status': 'OK', 'message': 'Collector Identity API is running'}
    
    # Image serving route
    from app.services.s3_service import s3_service
    
    @app.route('/api/images/<path:object_key>')
    def serve_image(object_key):
        try:
            if not object_key:
                return {'error': 'Object key is required'}, 400
            
            # Generate signed URL for the image
            signed_url = s3_service.get_signed_url(object_key)
            
            # Redirect to signed URL
            from flask import redirect
            return redirect(signed_url)
        except Exception as error:
            app.logger.error(f'Image serving failed: {str(error)}')
            return {'error': 'Image not found'}, 404
    
    return app