"""add avatar blob and mime to usuarios

Revision ID: b12c34d56e78
Revises: a12b34c56d78
Create Date: 2025-11-10 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b12c34d56e78'
down_revision = 'a12b34c56d78'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('usuarios', sa.Column('avatar_blob', sa.LargeBinary(), nullable=True))
    op.add_column('usuarios', sa.Column('avatar_mime', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('usuarios', 'avatar_mime')
    op.drop_column('usuarios', 'avatar_blob')

