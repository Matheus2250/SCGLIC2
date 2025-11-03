"""Add avatar_url to usuarios

Revision ID: 1a2b3c4d5e6f
Revises: 037613cbe1ac
Create Date: 2025-11-03 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = '037613cbe1ac'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('avatar_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('usuarios', 'avatar_url')

