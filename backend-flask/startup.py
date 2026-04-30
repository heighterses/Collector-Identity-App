"""
Startup script: ensures DB is stamped at the correct Alembic revision
before running migrations, then starts the Flask app.

This handles three cases:
  1. Fresh clone / empty volume  -> db.create_all() + stamp head
  2. Old DB with no alembic stamp -> stamp at current state + upgrade
  3. Normal run                   -> flask db upgrade (no-op if current)
"""
import os
import sys
import subprocess
import sqlite3

from app import create_app, db

app = create_app()

LATEST_REVISION = 'd4e5f6a7b8c9'


def get_db_path():
    uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if uri.startswith('sqlite:///'):
        rel = uri[len('sqlite:///'):]
        return os.path.join('/app/instance', rel) if not os.path.isabs(rel) else rel
    return None


def users_table_exists(db_path):
    if not db_path or not os.path.exists(db_path):
        return False
    conn = sqlite3.connect(db_path)
    rows = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").fetchall()
    conn.close()
    return len(rows) > 0


def get_alembic_version(db_path):
    if not db_path or not os.path.exists(db_path):
        return None
    conn = sqlite3.connect(db_path)
    try:
        rows = conn.execute("SELECT version_num FROM alembic_version").fetchall()
        conn.close()
        return rows[0][0] if rows else ''   # '' means table exists but empty
    except Exception:
        conn.close()
        return None  # table doesn't exist


def run(cmd):
    print(f'[startup] Running: {cmd}')
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr, file=sys.stderr)
    return result.returncode


def ensure_schema():
    """Patch any missing columns that older DBs might not have."""
    from sqlalchemy import text, inspect
    inspector = inspect(db.engine)

    patches = {
        'users': [
            ('user_role',             'VARCHAR(20)'),
            ('role_selected_at',      'DATETIME'),
            ('avatar_url',            'VARCHAR(500)'),
            ('language',              'VARCHAR(10) DEFAULT "en" NOT NULL'),
            ('timezone',              'VARCHAR(50) DEFAULT "UTC" NOT NULL'),
            ('privacy_settings',      'JSON'),
            ('notification_settings', 'JSON'),
            ('updated_at',            'DATETIME'),
        ],
        'artworks': [
            ('status', 'VARCHAR(20) DEFAULT "completed" NOT NULL'),
        ],
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
        existing_tables = inspector.get_table_names()
        for table, cols in patches.items():
            if table not in existing_tables:
                continue
            existing_cols = [c['name'] for c in inspector.get_columns(table)]
            for col_name, col_def in cols:
                if col_name not in existing_cols:
                    try:
                        conn.execute(text(f'ALTER TABLE {table} ADD COLUMN {col_name} {col_def}'))
                        conn.commit()
                        print(f'[startup] Added column {table}.{col_name}')
                    except Exception as e:
                        print(f'[startup] Could not add {table}.{col_name}: {e}')


with app.app_context():
    db_path = get_db_path()
    alembic_ver = get_alembic_version(db_path)
    has_users = users_table_exists(db_path)

    print(f'[startup] DB path: {db_path}')
    print(f'[startup] Alembic version: {repr(alembic_ver)}')
    print(f'[startup] Users table exists: {has_users}')

    if not has_users:
        # Brand new DB — create all tables from models, then stamp
        print('[startup] Fresh DB detected — running db.create_all() + stamp')
        db.create_all()
        run(f'flask db stamp {LATEST_REVISION}')
    elif alembic_ver == '' or alembic_ver is None:
        # DB exists but Alembic has no record — stamp at latest then upgrade
        print('[startup] Existing DB with no Alembic stamp — stamping + upgrading')
        ensure_schema()
        run(f'flask db stamp {LATEST_REVISION}')
    else:
        # Normal case — just run pending migrations
        print(f'[startup] DB at revision {alembic_ver} — running flask db upgrade')
        run('flask db upgrade')

    # Always patch any missing columns as a safety net
    ensure_schema()

    print('[startup] DB ready.')

# Now start the actual app
from run import initialize_services
with app.app_context():
    initialize_services()

port = int(os.getenv('PORT', 3001))
debug = os.getenv('FLASK_ENV') == 'development'
app.run(host='0.0.0.0', port=port, debug=debug)
