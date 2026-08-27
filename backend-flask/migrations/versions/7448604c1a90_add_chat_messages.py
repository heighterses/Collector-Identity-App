"""P1 fix: add chat_messages table for persisted chat history

Revision ID: 7448604c1a90
Revises: f6a7b8c9d0e1
Create Date: 2026-08-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '7448604c1a90'
down_revision = 'f6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('chat_messages',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('artwork_id', sa.String(length=36), nullable=True),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['artwork_id'], ['artworks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        'ix_chat_messages_user_artwork_created',
        'chat_messages',
        ['user_id', 'artwork_id', 'created_at']
    )


def downgrade():
    op.drop_index('ix_chat_messages_user_artwork_created', table_name='chat_messages')
    op.drop_table('chat_messages')
