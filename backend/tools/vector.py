"""
Vector operations for ARIA — embedding, search, and chunk storage.

Uses OpenRouter embeddings via LangChain interface
and async SQLAlchemy for pgvector operations.

IMPORTANT: asyncpg uses positional params ($1, $2), so PostgreSQL's
``::vector`` cast syntax CANNOT be used (it conflicts with ``:param``
named bindings). Always use ``CAST(... AS vector)`` instead.
"""
import uuid
from typing import Optional

from langchain_core.embeddings import Embeddings
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
import asyncio

from config import settings
from db.session import AsyncSessionLocal
from db.models import ReportChunk


# ---------------------------------------------------------------------------
# Embedding model (singleton-ish, created once on first call)
# ---------------------------------------------------------------------------
class OpenRouterEmbeddings(Embeddings):
    def __init__(self, api_key: str, model: str, base_url: str):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url
    
    def _get_embedding(self, text: str) -> list[float]:
        url = self.base_url.rstrip("/") + "/embeddings"
        try:
            response = httpx.post(
                url,
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    # Plain string input works and natively returns 2048 dims from OpenRouter for this model
                    "input": text[:8192],
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            if "data" in data and len(data["data"]) > 0:
                return data["data"][0]["embedding"]
            return []
        except Exception as e:
            print(f"[Vector] embed sync failed: {e}")
            return []
            
    async def _aget_embedding(self, text: str) -> list[float]:
        url = self.base_url.rstrip("/") + "/embeddings"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={
                        "model": self.model,
                        # Plain string input works and natively returns 2048 dims from OpenRouter for this model
                        "input": text[:8192],
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                if "data" in data and len(data["data"]) > 0:
                    return data["data"][0]["embedding"]
                return []
        except Exception as e:
            print(f"[Vector] embed async failed: {e}")
            return []

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._get_embedding(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._get_embedding(text)
        
    async def aembed_documents(self, texts: list[str]) -> list[list[float]]:
        return [await self._aget_embedding(text) for text in texts]

    async def aembed_query(self, text: str) -> list[float]:
        return await self._aget_embedding(text)

_embeddings_model: Embeddings | None = None


def get_embeddings_model() -> Embeddings | None:
    """Return a LangChain Embeddings instance configured for OpenRouter."""
    global _embeddings_model

    if _embeddings_model is not None:
        return _embeddings_model

    if not settings.openrouter_api_key:
        print("[Vector] OpenRouter API key not configured — skipping vector ops")
        return None

    _embeddings_model = OpenRouterEmbeddings(
        model=settings.openrouter_embedding_model,
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_embedding_base_url,
    )
    return _embeddings_model


# ---------------------------------------------------------------------------
# Embedding helpers
# ---------------------------------------------------------------------------
async def embed_text(text_input: str) -> list[float] | None:
    """Generate an embedding for a document chunk."""
    model = get_embeddings_model()
    if model is None:
        return None
    try:
        vectors = await model.aembed_documents([text_input[:8192]])
        return vectors[0] if vectors else None
    except Exception as e:
        print(f"[Vector] embed_text failed: {e}")
        return None


async def embed_query(query: str) -> list[float] | None:
    """Embed a search query."""
    model = get_embeddings_model()
    if model is None:
        return None
    try:
        result = await model.aembed_query(query[:8192])
        if not result:
            print("[Vector] embed_query failed: No embedding data received")
            return None
        return result
    except Exception as e:
        print(f"[Vector] embed_query failed: {e}")
        return None


# ---------------------------------------------------------------------------
# Vector Search (direct SQL with pgvector cosine distance)
# ---------------------------------------------------------------------------
async def vector_search(
    query: str,
    domain: str, # We keep domain in signature for compatibility, but don't strictly filter by it
    user_id: uuid.UUID | None = None,
    limit: int = 5,
) -> list[dict]:
    """Retrieve relevant report chunks using pgvector cosine similarity.

    Uses CAST(... AS vector) instead of ::vector to avoid asyncpg syntax conflicts.
    """
    query_embedding = await embed_query(query)
    if query_embedding is None:
        print("[Vector] search skipped: could not embed query")
        return []

    # Build the embedding literal for pgvector: '[0.1, 0.2, ...]'
    embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

    async with AsyncSessionLocal() as db:
        try:
            # We remove the strict 'domain = :domain' filter because semantic search
            # already retrieves the most relevant chunks contextually. 
            result = await db.execute(
                text("""
                    SELECT
                        id,
                        report_id,
                        content,
                        domain,
                        1 - (embedding <=> CAST(:qvec AS vector)) AS similarity
                    FROM report_chunks
                    WHERE embedding IS NOT NULL
                    ORDER BY embedding <=> CAST(:qvec AS vector)
                    LIMIT :lim
                """),
                {
                    "qvec": embedding_str,
                    "lim": limit,
                },
            )
            rows = result.fetchall()
            print(f"[Vector] search returned {len(rows)} chunks for domain={domain}")
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
    """Split report into chunks, embed each, and store in report_chunks table."""
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

    if not chunks:
        print("[Vector] No chunks to save — report was empty")
        return 0

    print(f"[Vector] Chunked report into {len(chunks)} pieces, embedding now...")

    # Embed all chunks one by one
    model = get_embeddings_model()
    embeddings: list[list[float] | None] = []

    if model is not None:
        for i, chunk_text in enumerate(chunks):
            try:
                # Add delay to respect Azure Open AI API Rate limits
                if i > 0:
                    await asyncio.sleep(0.5)
                vec = await model.aembed_query(chunk_text[:8192])
                if vec and len(vec) > 0:
                    embeddings.append(vec)
                    print(f"[Vector] Chunk {i}: embedded OK ({len(vec)} dims)")
                else:
                    embeddings.append(None)
                    print(f"[Vector] Chunk {i}: empty embedding returned")
            except Exception as e:
                embeddings.append(None)
                print(f"[Vector] Chunk {i}: embedding failed: {e}")
    else:
        print("[Vector] No embedding model available")
        embeddings = [None] * len(chunks)

    # Store in DB using raw SQL with CAST() to avoid asyncpg ::vector conflicts
    saved = 0
    async with AsyncSessionLocal() as db:
        for idx, chunk_text in enumerate(chunks):
            emb = embeddings[idx] if idx < len(embeddings) else None

            if emb is not None:
                embedding_str = "[" + ",".join(str(v) for v in emb) + "]"
                await db.execute(
                    text("""
                        INSERT INTO report_chunks
                            (id, report_id, user_id, domain, content, embedding, chunk_index)
                        VALUES
                            (:id, :report_id, :user_id, :domain, :content,
                             CAST(:embedding AS vector), :chunk_index)
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "report_id": str(report_id),
                        "user_id": str(user_id),
                        "domain": domain,
                        "content": chunk_text,
                        "embedding": embedding_str,
                        "chunk_index": idx,
                    },
                )
            else:
                await db.execute(
                    text("""
                        INSERT INTO report_chunks
                            (id, report_id, user_id, domain, content, chunk_index)
                        VALUES
                            (:id, :report_id, :user_id, :domain, :content, :chunk_index)
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "report_id": str(report_id),
                        "user_id": str(user_id),
                        "domain": domain,
                        "content": chunk_text,
                        "chunk_index": idx,
                    },
                )
            saved += 1

        await db.commit()
        print(f"[Vector] Committed {saved} chunks to database")

    return saved


async def search_cached_reports(query_embedding: list[float], domain: str, similarity_threshold: float = 0.85) -> dict | None:
    """
    Search strictly the 'reports' table for a highly similar, recent report.
    Implements TTL. Previously domain-specific, now a flat 30 days for all dynamic topics.
    """
    from datetime import datetime, timedelta, timezone

    # Flat 30-day TTL for dynamic topics
    ttl_days = 30
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=ttl_days)

    async with AsyncSessionLocal() as session:
        # We find the most similar report that is newer than cutoff_date
        # Removing domain exact match since topics are dynamically generated now
        query = text("""
            SELECT id, title, content, created_at, 
                   1 - (query_embedding <=> CAST(:embedding AS vector)) AS similarity
            FROM reports
            WHERE query_embedding IS NOT NULL
              AND created_at >= :cutoff
              AND (1 - (query_embedding <=> CAST(:embedding AS vector))) > :threshold
            ORDER BY similarity DESC
            LIMIT 1
        """)
        
        # Need to format the embedding string exactly as a postgres vector literal
        embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

        result = await session.execute(query, {
            "embedding": embedding_str,
            "cutoff": cutoff_date,
            "threshold": similarity_threshold
        })
        
        row = result.fetchone()
        if row:
            return {
                "id": str(row.id),
                "title": row.title,
                "content": row.content,
                "created_at": row.created_at,
                "similarity": row.similarity
            }
        return None
