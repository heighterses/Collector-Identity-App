"""Add status column to artworks table

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-04-30 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def _column_exists(table, column):
    bind = op.get_bind()
    inspector = Inspector.from_engine(bind)
    return column in [c['name'] for c in inspector.get_columns(table)]


def upgrade():
    if not _column_exists('artworks', 'status'):
        op.add_column(
            'artworks',
            sa.Column('status', sa.String(20), nullable=False, server_default='completed')
        )


def downgrade():
    if _column_exists('artworks', 'status'):
        op.drop_column('artworks', 'status')
