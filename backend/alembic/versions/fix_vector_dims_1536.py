"""Fix query_embedding vector dimensions: 2048 -> 1536 to match OpenRouter embeddings

Revision ID: fix_vector_dims_1536
Revises: 498e568dd067
Create Date: 2026-03-04
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'fix_vector_dims_1536'
down_revision = '498e568dd067'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # The reports table has query_embedding as vector(2048), but OpenRouter returns
    # 1536-dim embeddings (text-embedding-3-small). Mismatched dimensions silently
    # caused every report save to fail with a Postgres type error.
    #
    # We must drop and re-add the column because pgvector does not support
    # ALTER COLUMN ... TYPE for vector columns with different dimensions.
    op.execute("ALTER TABLE reports DROP COLUMN IF EXISTS query_embedding")
    op.execute("ALTER TABLE reports ADD COLUMN query_embedding vector(1536)")

    # Also fix report_chunks embedding column if it was created as vector(2048)
    op.execute("ALTER TABLE report_chunks DROP COLUMN IF EXISTS embedding")
    op.execute("ALTER TABLE report_chunks ADD COLUMN embedding vector(1536)")


def downgrade() -> None:
    op.execute("ALTER TABLE reports DROP COLUMN IF EXISTS query_embedding")
    op.execute("ALTER TABLE reports ADD COLUMN query_embedding vector(2048)")

    op.execute("ALTER TABLE report_chunks DROP COLUMN IF EXISTS embedding")
    op.execute("ALTER TABLE report_chunks ADD COLUMN embedding vector(2048)")
