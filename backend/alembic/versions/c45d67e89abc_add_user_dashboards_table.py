"""add user_dashboards table

Revision ID: c45d67e89abc
Revises: b12c34d56e78
Create Date: 2025-11-10 00:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'c45d67e89abc'
down_revision = 'b12c34d56e78'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'user_dashboards',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('scope', sa.String(length=50), nullable=False),
        sa.Column('widgets_json', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column('layouts_json', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{\"lg\":[]}'::jsonb")),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_unique_constraint('uq_user_dashboards_user_scope', 'user_dashboards', ['user_id', 'scope'])


def downgrade() -> None:
    op.drop_constraint('uq_user_dashboards_user_scope', 'user_dashboards', type_='unique')
    op.drop_table('user_dashboards')
