"""Merge heads: avatar_url and access_requests

Revision ID: 7b9c2d1a4f00
Revises: 1a2b3c4d5e6f, e0b8a4e563ad
Create Date: 2025-11-05 18:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7b9c2d1a4f00'
down_revision = ('1a2b3c4d5e6f', 'e0b8a4e563ad')
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Merge migration; no schema changes required here.
    pass


def downgrade() -> None:
    # This merge has no schema operations to reverse.
    pass

