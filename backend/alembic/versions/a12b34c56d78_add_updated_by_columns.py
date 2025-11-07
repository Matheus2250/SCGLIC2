"""add updated_by columns to pca, qualificacoes, licitacoes

Revision ID: a12b34c56d78
Revises: f231055befc0
Create Date: 2025-11-07 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'a12b34c56d78'
down_revision = 'f231055befc0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('pca', sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(None, 'pca', 'usuarios', ['updated_by'], ['id'])

    op.add_column('qualificacoes', sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(None, 'qualificacoes', 'usuarios', ['updated_by'], ['id'])

    op.add_column('licitacoes', sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(None, 'licitacoes', 'usuarios', ['updated_by'], ['id'])


def downgrade() -> None:
    op.drop_constraint(None, 'licitacoes', type_='foreignkey')
    op.drop_column('licitacoes', 'updated_by')

    op.drop_constraint(None, 'qualificacoes', type_='foreignkey')
    op.drop_column('qualificacoes', 'updated_by')

    op.drop_constraint(None, 'pca', type_='foreignkey')
    op.drop_column('pca', 'updated_by')

