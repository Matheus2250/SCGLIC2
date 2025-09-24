"""remove_unique_constraint_from_username

Revision ID: e813b39d4393
Revises: 61261242b3db
Create Date: 2025-09-24 16:13:00.693666

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e813b39d4393'
down_revision = '98ce7061a9d7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove unique constraint from username column
    op.drop_index('ix_usuarios_username', table_name='usuarios')


def downgrade() -> None:
    # Add unique constraint back to username column
    op.create_index('ix_usuarios_username', 'usuarios', ['username'], unique=True)