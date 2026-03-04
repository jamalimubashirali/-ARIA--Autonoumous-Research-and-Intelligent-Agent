"""Restore vector columns to 2048 dims — correct with content-array input format

Using content array input [{"type":"text","text":"..."}] makes nvidia/llama-nemotron-embed-vl-1b-v2
return its native 2048-dim output. Plain string input was causing the model to return 1024 dims
(a degraded/fallback mode).

Revision ID: restore_vector_dims_2048_final
Revises: fix_vector_dims_1024
Create Date: 2026-03-04
"""
from alembic import op

revision = 'restore_vector_dims_2048_final'
down_revision = 'fix_vector_dims_1024'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE reports DROP COLUMN IF EXISTS query_embedding")
    op.execute("ALTER TABLE reports ADD COLUMN query_embedding vector(2048)")

    op.execute("ALTER TABLE report_chunks DROP COLUMN IF EXISTS embedding")
    op.execute("ALTER TABLE report_chunks ADD COLUMN embedding vector(2048)")
    print("[Migration] Vector columns restored to 2048 dims (content-array input format)")


def downgrade() -> None:
    op.execute("ALTER TABLE reports DROP COLUMN IF EXISTS query_embedding")
    op.execute("ALTER TABLE reports ADD COLUMN query_embedding vector(1024)")

    op.execute("ALTER TABLE report_chunks DROP COLUMN IF EXISTS embedding")
    op.execute("ALTER TABLE report_chunks ADD COLUMN embedding vector(1024)")
