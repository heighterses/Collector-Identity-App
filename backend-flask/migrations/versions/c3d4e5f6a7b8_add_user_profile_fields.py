"""Add user profile and role fields to users table

Revision ID: c3d4e5f6a7b8
Revises: b1c2d3e4f5a6
Create Date: 2026-04-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


revision = 'c3d4e5f6a7b8'
down_revision = 'b1c2d3e4f5a6'
branch_labels = None
depends_on = None


def _column_exists(table, column):
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    return column in [c['name'] for c in inspector.get_columns(table)]


def upgrade():
    # Use try/except per column so partial migrations don't break
    cols = [
        ('user_role',             sa.String(20),  True,  None),
        ('role_selected_at',      sa.DateTime(),  True,  None),
        ('avatar_url',            sa.String(500), True,  None),
        ('language',              sa.String(10),  False, 'en'),
        ('timezone',              sa.String(50),  False, 'UTC'),
        ('privacy_settings',      sa.JSON(),      True,  None),
        ('notification_settings', sa.JSON(),      True,  None),
        ('updated_at',            sa.DateTime(),  True,  None),
    ]
    for col_name, col_type, nullable, server_default in cols:
        if not _column_exists('users', col_name):
            op.add_column(
                'users',
                sa.Column(col_name, col_type, nullable=nullable,
                          server_default=server_default)
            )


def downgrade():
    for col in ['updated_at', 'notification_settings', 'privacy_settings',
                'timezone', 'language', 'avatar_url', 'role_selected_at', 'user_role']:
        if _column_exists('users', col):
            op.drop_column('users', col)
