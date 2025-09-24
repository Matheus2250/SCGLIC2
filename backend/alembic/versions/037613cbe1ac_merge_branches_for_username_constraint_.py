"""merge branches for username constraint removal

Revision ID: 037613cbe1ac
Revises: 61261242b3db, e813b39d4393
Create Date: 2025-09-24 16:52:05.154953

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '037613cbe1ac'
down_revision = ('61261242b3db', 'e813b39d4393')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass