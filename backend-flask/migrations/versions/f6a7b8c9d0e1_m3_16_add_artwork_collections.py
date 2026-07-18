"""M3-16 add artwork_collections table and artwork_collection_link

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-07-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'f6a7b8c9d0e1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('artwork_collections',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_artwork_collections_user_id', 'artwork_collections', ['user_id'])

    op.create_table('artwork_collection_link',
        sa.Column('artwork_id', sa.String(length=36), nullable=False),
        sa.Column('collection_id', sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(['artwork_id'], ['artworks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['collection_id'], ['artwork_collections.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('artwork_id', 'collection_id')
    )


def downgrade():
    op.drop_table('artwork_collection_link')
    op.drop_index('ix_artwork_collections_user_id', table_name='artwork_collections')
    op.drop_table('artwork_collections')
