"""add activity_events table

Revision ID: a1b2c3d4e5f6
Revises: 29888ea16897
Create Date: 2025-11-14 01:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '29888ea16897'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'activity_events',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('module', sa.String(length=50), nullable=False),
        sa.Column('action', sa.String(length=50), nullable=False, server_default='import'),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('details', sa.dialects.postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('usuarios.id'), nullable=False),
    )
    op.create_index('idx_activity_events_at', 'activity_events', ['at'], unique=False)
    op.create_index('idx_activity_events_module', 'activity_events', ['module'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_activity_events_module', table_name='activity_events')
    op.drop_index('idx_activity_events_at', table_name='activity_events')
    op.drop_table('activity_events')

