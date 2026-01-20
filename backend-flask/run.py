from app import create_app, db
from app.services.s3_service import s3_service
import os

app = create_app()

def initialize_services():
    """Initialize services on startup"""
    s3_status = 'unavailable'
    
    try:
        # Try to initialize S3 service (create bucket if needed)
        s3_service.initialize()
        s3_status = 'connected'
        app.logger.info('S3 service initialized successfully')
    except Exception as s3_error:
        app.logger.warning(f'S3 service initialization failed: {str(s3_error)}')
        s3_status = 'failed'
    
    app.logger.info(f'Flask app started on port {os.getenv("PORT", 3001)}, S3 status: {s3_status}')

if __name__ == '__main__':
    with app.app_context():
        # Create database tables
        db.create_all()
        
        # Initialize services
        initialize_services()
    
    # Start the Flask app
    port = int(os.getenv('PORT', 3001))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    app.run(host='0.0.0.0', port=port, debug=debug)