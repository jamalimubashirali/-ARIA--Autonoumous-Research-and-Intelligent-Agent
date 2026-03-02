"""
Vector operations for ARIA — embedding, search, and chunk storage.

Uses LangChain AzureOpenAIEmbeddings for embeddings
and async SQLAlchemy for pgvector operations.
"""
import uuid
from typing import Optional

from langchain_openai import OpenAIEmbeddings
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db.session import AsyncSessionLocal
from db.models import ReportChunk


# ---------------------------------------------------------------------------
# Embedding model (singleton-ish, created once on first call)
# ---------------------------------------------------------------------------
_embeddings_model: OpenAIEmbeddings | None = None


def get_embeddings_model() -> OpenAIEmbeddings | None:
    """Return a LangChain OpenAIEmbeddings instance configured for OpenRouter (or None if not configured)."""
    global _embeddings_model

    if _embeddings_model is not None:
        return _embeddings_model

    if not settings.openrouter_api_key:
        print("[Vector] OpenRouter API key not configured — skipping vector ops")
        return None

    _embeddings_model = OpenAIEmbeddings(
        model=settings.openrouter_embedding_model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_embedding_base_url,
    )
    return _embeddings_model


# ---------------------------------------------------------------------------
# Embedding helpers
# ---------------------------------------------------------------------------
async def embed_text(text_input: str) -> list[float] | None:
    """Generate an embedding for a document chunk.

    Returns a list of floats (e.g. 1024 dims for Cohere v3) or None on failure.
    """
    model = get_embeddings_model()
    if model is None:
        return None

    try:
        vectors = model.embed_documents([text_input[:8192]])
        return vectors[0]
    except Exception as e:
        print(f"[Vector] embed_text failed: {e}")
        return None


async def embed_query(query: str) -> list[float] | None:
    """Embed a search query (uses asymmetric embedding if model supports it)."""
    model = get_embeddings_model()
    if model is None:
        return None

    try:
        return model.embed_query(query[:8192])
    except Exception as e:
        print(f"[Vector] embed_query failed: {e}")
        return None


# ---------------------------------------------------------------------------
# Vector Search (pgvector via match_report_chunks RPC)
# ---------------------------------------------------------------------------
async def vector_search(
    query: str,
    domain: str,
    user_id: uuid.UUID | None = None,
    limit: int = 5,
) -> list[dict]:
    """Retrieve relevant report chunks from pgvector using cosine similarity.

    Returns list of {id, report_id, content, domain, similarity}.
    """
    query_embedding = await embed_query(query)
    if query_embedding is None:
        return []

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                text("""
                    SELECT id, report_id, content, domain, similarity
                    FROM match_report_chunks(
                        :query_embedding::vector,
                        :match_count,
                        :filter_domain,
                        :filter_user_id
                    )
                """),
                {
                    "query_embedding": str(query_embedding),
                    "match_count": limit,
                    "filter_domain": domain,
                    "filter_user_id": str(user_id) if user_id else None,
                },
            )
            rows = result.fetchall()
            return [
                {
                    "id": str(row[0]),
                    "report_id": str(row[1]),
                    "content": row[2],
                    "domain": row[3],
                    "similarity": float(row[4]),
                }
                for row in rows
            ]
        except Exception as e:
            print(f"[Vector] search failed: {e}")
            return []


# ---------------------------------------------------------------------------
# Save Report Chunks (embed + store after report generation)
# ---------------------------------------------------------------------------
async def save_report_chunks(
    report_id: uuid.UUID,
    user_id: uuid.UUID,
    domain: str,
    report_content: str,
    chunk_size: int = 1500,
) -> int:
    """Split report into chunks, embed each, and store in report_chunks table.

    Returns the number of chunks saved.
    """
    # Simple paragraph-aware chunking
    paragraphs = report_content.split("\n\n")
    chunks: list[str] = []
    current_chunk = ""

    for para in paragraphs:
        if len(current_chunk) + len(para) > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = para
        else:
            current_chunk += "\n\n" + para if current_chunk else para

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    # Batch embed all chunks at once (much more efficient than one-by-one)
    model = get_embeddings_model()
    embeddings: list[list[float] | None] = []

    if model is not None and chunks:
        try:
            embeddings = model.embed_documents(chunks)
        except Exception as e:
            print(f"[Vector] Batch embedding failed: {e}")
            embeddings = [None] * len(chunks)
    else:
        embeddings = [None] * len(chunks)

    # Store in DB
    saved = 0
    async with AsyncSessionLocal() as db:
        for idx, chunk_text in enumerate(chunks):
            chunk = ReportChunk(
                report_id=report_id,
                user_id=user_id,
                domain=domain,
                content=chunk_text,
                embedding=embeddings[idx] if idx < len(embeddings) else None,
                chunk_index=idx,
            )
            db.add(chunk)
            saved += 1

        await db.commit()

    return saved
