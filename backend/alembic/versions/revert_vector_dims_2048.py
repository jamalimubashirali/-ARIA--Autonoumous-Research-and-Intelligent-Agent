"""Revert vector columns from 1536 back to 2048 — nvidia/llama-nemotron-embed outputs 2048 dims

Revision ID: revert_vector_dims_2048
Revises: fix_vector_dims_1536
Create Date: 2026-03-04
"""
from alembic import op

revision = 'revert_vector_dims_2048'
down_revision = 'fix_vector_dims_1536'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Revert back to 2048 dimensions (correct for nvidia/llama-nemotron-embed-vl)."""
    op.execute("ALTER TABLE reports DROP COLUMN IF EXISTS query_embedding")
    op.execute("ALTER TABLE reports ADD COLUMN query_embedding vector(2048)")

    op.execute("ALTER TABLE report_chunks DROP COLUMN IF EXISTS embedding")
    op.execute("ALTER TABLE report_chunks ADD COLUMN embedding vector(2048)")
    print("[Migration] Vector columns restored to 2048 dims for nvidia/llama-nemotron-embed-vl")


def downgrade() -> None:
    op.execute("ALTER TABLE reports DROP COLUMN IF EXISTS query_embedding")
    op.execute("ALTER TABLE reports ADD COLUMN query_embedding vector(1536)")

    op.execute("ALTER TABLE report_chunks DROP COLUMN IF EXISTS embedding")
    op.execute("ALTER TABLE report_chunks ADD COLUMN embedding vector(1536)")
