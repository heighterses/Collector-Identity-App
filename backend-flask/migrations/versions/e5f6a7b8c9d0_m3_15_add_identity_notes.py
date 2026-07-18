"""M3-15 add identity_notes table

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-07-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('identity_notes',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('identity_version_id', sa.String(length=36), nullable=False),
        sa.Column('note_text', sa.String(length=280), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['identity_version_id'], ['identity_versions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_identity_notes_identity_version_id', 'identity_notes', ['identity_version_id'])


def downgrade():
    op.drop_index('ix_identity_notes_identity_version_id', table_name='identity_notes')
    op.drop_table('identity_notes')
