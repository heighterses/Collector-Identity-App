from app import create_app, db
from app.services.s3_service import s3_service
import os

app = create_app()


def ensure_schema():
    """Add any missing columns that SQLite won't auto-create via db.create_all()."""
    from sqlalchemy import text, inspect
    inspector = inspect(db.engine)

    migrations = {
        'identity_templates': [
            ('version',   'INTEGER DEFAULT 1 NOT NULL'),
            ('embedding', 'TEXT'),
        ],
        'identity_traits': [
            ('position',     'INTEGER DEFAULT 0 NOT NULL'),
            ('ai_generated', 'INTEGER DEFAULT 1 NOT NULL'),
            ('is_confirmed', 'INTEGER DEFAULT 1 NOT NULL'),
        ],
    }

    with db.engine.connect() as conn:
        for table, cols in migrations.items():
            # Table might not exist yet on a brand-new DB — skip safely
            if table not in inspector.get_table_names():
                continue
            existing = [c['name'] for c in inspector.get_columns(table)]
            for col_name, col_def in cols:
                if col_name not in existing:
                    try:
                        conn.execute(text(f'ALTER TABLE {table} ADD COLUMN {col_name} {col_def}'))
                        conn.commit()
                        app.logger.info(f'Schema: added {table}.{col_name}')
                    except Exception as e:
                        app.logger.warning(f'Schema: could not add {table}.{col_name}: {e}')


def initialize_services():
    """Initialize services on startup"""
    s3_status = 'unavailable'

    try:
        s3_service.initialize()
        s3_status = 'connected'
        app.logger.info('S3 service initialized successfully')
    except Exception as s3_error:
        app.logger.warning(f'S3 service initialization failed: {str(s3_error)}')
        s3_status = 'failed'

    app.logger.info(f'Flask app started on port {os.getenv("PORT", 3001)}, S3 status: {s3_status}')


if __name__ == '__main__':
    with app.app_context():
        # Create all tables (new DBs)
        db.create_all()

        # Add any columns that exist in models but not in the DB
        ensure_schema()

        # Initialize services
        initialize_services()

    port = int(os.getenv('PORT', 3001))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)