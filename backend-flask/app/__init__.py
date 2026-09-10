from flask import Flask, request, jsonify, g, has_request_context
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from werkzeug.exceptions import HTTPException
from config import Config
import logging
from logging.handlers import RotatingFileHandler
import os
import uuid

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()


class RequestIdFilter(logging.Filter):
    """Injects the current request's id into every log line (or '-' outside a
    request), so log entries can be correlated per request."""
    def filter(self, record):
        try:
            record.request_id = getattr(g, 'request_id', '-') if has_request_context() else '-'
        except Exception:
            record.request_id = '-'
        return True


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

        # Rotating file handler so logs don't grow unbounded in production.
        file_handler = RotatingFileHandler(
            'logs/app.log', maxBytes=5 * 1024 * 1024, backupCount=5
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s [%(request_id)s]: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.addFilter(RequestIdFilter())
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
    from app.models import chat_message  # noqa: F401

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

    # Per-request correlation id (available in logs + returned as a header).
    @app.before_request
    def _assign_request_id():
        g.request_id = uuid.uuid4().hex[:12]

    # Conservative security headers on every response. No CSP here so the
    # existing frontend is unaffected.
    @app.after_request
    def _security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Referrer-Policy'] = 'no-referrer-when-downgrade'
        if not app.debug:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        rid = getattr(g, 'request_id', None)
        if rid:
            response.headers['X-Request-ID'] = rid
        return response

    # JSON error handlers so failures never leak HTML/stack traces to clients.
    @app.errorhandler(404)
    def _not_found(e):
        return jsonify({'error': 'Not found'}), 404

    @app.errorhandler(405)
    def _method_not_allowed(e):
        return jsonify({'error': 'Method not allowed'}), 405

    @app.errorhandler(Exception)
    def _unhandled(e):
        # Preserve intentional HTTP errors (abort(...), 401, etc.).
        if isinstance(e, HTTPException):
            return e
        # In debug, let the interactive debugger handle it.
        if app.debug:
            raise e
        app.logger.error(f'Unhandled exception: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500

    # Health check route (liveness)
    @app.route('/health')
    def health_check():
        return {
            'status': 'OK',
            'message': 'Collector Identity API is running'
        }

    # Readiness check — verifies the app can actually reach its dependencies.
    @app.route('/health/ready')
    def readiness_check():
        from sqlalchemy import text
        checks = {}
        ready = True

        try:
            db.session.execute(text('SELECT 1'))
            checks['database'] = 'ok'
        except Exception:
            checks['database'] = 'error'
            ready = False

        try:
            s3_service.client.head_bucket(Bucket=s3_service.bucket_name)
            checks['storage'] = 'ok'
        except Exception:
            checks['storage'] = 'error'
            ready = False

        try:
            import requests as _requests
            base = os.getenv('OLLAMA_BASE_URL', 'http://host.docker.internal:11434')
            r = _requests.get(f'{base}/api/tags', timeout=3)
            checks['llm'] = 'ok' if r.ok else 'error'
            ready = ready and r.ok
        except Exception:
            checks['llm'] = 'error'
            ready = False

        return jsonify({
            'status': 'ready' if ready else 'degraded',
            'checks': checks,
        }), (200 if ready else 503)

    return app