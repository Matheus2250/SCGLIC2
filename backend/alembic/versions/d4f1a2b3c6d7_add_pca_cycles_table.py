"""add pca_cycles table

Revision ID: d4f1a2b3c6d7
Revises: c45d67e89abc
Create Date: 2025-11-10 00:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'd4f1a2b3c6d7'
down_revision = 'c45d67e89abc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'pca_cycles',
        sa.Column('ano', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='ABERTO'),
        sa.Column('closed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('closed_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['closed_by'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('ano'),
    )
    op.create_index('ix_pca_cycles_status', 'pca_cycles', ['status'])


def downgrade() -> None:
    op.drop_index('ix_pca_cycles_status', table_name='pca_cycles')
    op.drop_table('pca_cycles')

