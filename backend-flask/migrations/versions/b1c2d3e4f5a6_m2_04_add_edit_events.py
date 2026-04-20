"""M2-04 add edit_events table

Revision ID: b1c2d3e4f5a6
Revises: a42b70029408
Create Date: 2026-04-21 03:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'b1c2d3e4f5a6'
down_revision = 'a42b70029408'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('edit_events',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('template_id', sa.String(length=36), nullable=False),
        sa.Column('trait_id', sa.String(length=36), nullable=True),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('event_type', sa.String(length=20), nullable=False),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint("event_type IN ('create_trait', 'update_value', 'delete_trait')", name='valid_event_type'),
        sa.ForeignKeyConstraint(['template_id'], ['identity_templates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['trait_id'], ['identity_traits.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_edit_events_template_id', 'edit_events', ['template_id'])
    op.create_index('ix_edit_events_trait_id', 'edit_events', ['trait_id'])


def downgrade():
    op.drop_index('ix_edit_events_trait_id', table_name='edit_events')
    op.drop_index('ix_edit_events_template_id', table_name='edit_events')
    op.drop_table('edit_events')
