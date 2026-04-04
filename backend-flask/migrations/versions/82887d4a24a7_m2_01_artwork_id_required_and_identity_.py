"""M2-01 artwork_id required and identity relationship

Revision ID: 82887d4a24a7
Revises: cdbed24901bd
Create Date: 2026-04-05 02:12:15.292939

"""
from alembic import op
import sqlalchemy as sa


revision = '82887d4a24a7'
down_revision = 'cdbed24901bd'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('identity_templates', schema=None) as batch_op:
        batch_op.alter_column(
            'artwork_id',
            existing_type=sa.String(length=36),
            nullable=False
        )


def downgrade():
    with op.batch_alter_table('identity_templates', schema=None) as batch_op:
        batch_op.alter_column(
            'artwork_id',
            existing_type=sa.String(length=36),
            nullable=True
        )
