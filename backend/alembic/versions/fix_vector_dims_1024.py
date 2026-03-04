"""Fix vector columns to 1024 dims — nvidia/llama-nemotron-embed-vl-1b-v2 native output

The model ignores the `dimensions` API parameter and always outputs 1024-dim vectors.

Revision ID: fix_vector_dims_1024
Revises: revert_vector_dims_2048
Create Date: 2026-03-04
"""
from alembic import op

revision = 'fix_vector_dims_1024'
down_revision = 'revert_vector_dims_2048'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Set vector columns to 1024 — the actual output size of llama-nemotron-embed-vl-1b-v2."""
    op.execute("ALTER TABLE reports DROP COLUMN IF EXISTS query_embedding")
    op.execute("ALTER TABLE reports ADD COLUMN query_embedding vector(1024)")

    op.execute("ALTER TABLE report_chunks DROP COLUMN IF EXISTS embedding")
    op.execute("ALTER TABLE report_chunks ADD COLUMN embedding vector(1024)")
    print("[Migration] Vector columns set to 1024 dims (llama-nemotron-embed-vl-1b-v2 native)")


def downgrade() -> None:
    op.execute("ALTER TABLE reports DROP COLUMN IF EXISTS query_embedding")
    op.execute("ALTER TABLE reports ADD COLUMN query_embedding vector(2048)")

    op.execute("ALTER TABLE report_chunks DROP COLUMN IF EXISTS embedding")
    op.execute("ALTER TABLE report_chunks ADD COLUMN embedding vector(2048)")
