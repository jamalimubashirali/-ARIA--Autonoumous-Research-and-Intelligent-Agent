"""add_title_to_reports

Revision ID: 498e568dd067
Revises: 706405861e01
Create Date: 2026-03-03 13:49:42.875658

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '498e568dd067'
down_revision: Union[str, None] = '706405861e01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Increase statement timeout for Supabase free tier
    op.execute("SET statement_timeout = '60s'")
    op.add_column('reports', sa.Column('title', sa.String(length=300), nullable=True))

    # Also fix the embedding column dimension and clean bad chunks
    op.execute("DELETE FROM report_chunks WHERE embedding IS NULL")
    op.execute("SET statement_timeout = '0'")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('reports', 'title')
