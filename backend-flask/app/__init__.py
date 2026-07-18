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
    CORS(app, origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")])
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
    
    # Import models (for migrations)
    from app.models import identity  # noqa: F401
    from app.models import edit_event  # noqa: F401
    from app.models import identity_version  # noqa: F401
    from app.models import identity_note  # noqa: F401
    from app.models import artwork_collection  # noqa: F401

    # Register blueprints
    from app.routes.auth import bp as auth_bp
    from app.routes.artwork import bp as artwork_bp
    from app.routes.reflection import bp as reflection_bp
    from app.routes.images import bp as images_bp
    from app.routes.identity import bp as identity_bp
    from app.routes.chat import bp as chat_bp
    from app.routes.recommendations import bp as recommendations_bp
    from app.routes.timeline import bp as timeline_bp
    from app.routes.comparison import bp as comparison_bp
    from app.routes.analytics import bp as analytics_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(artwork_bp, url_prefix='/api/artwork')
    app.register_blueprint(reflection_bp, url_prefix='/api/reflection')
    app.register_blueprint(images_bp, url_prefix='/api/images')
    app.register_blueprint(identity_bp, url_prefix='/api/identity')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(recommendations_bp, url_prefix='/api/recommendations')
    app.register_blueprint(timeline_bp, url_prefix='/api/timeline')
    app.register_blueprint(comparison_bp, url_prefix='/api/comparison')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
     
    # ✅ FIX: Initialize S3 inside app context
    from app.services.s3_service import s3_service
    with app.app_context():
        s3_service.initialize()

    # Health check route
    @app.route('/health')
    def health_check():
        return {
            'status': 'OK',
            'message': 'Collector Identity API is running'
        }

    return app