# ARIA — Backend

> FastAPI backend powering the Autonomous Research & Intelligence Agent with a multi-agent LangGraph pipeline.

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | FastAPI + Uvicorn |
| **Language** | Python 3.12+ |
| **Agent Framework** | LangGraph + LangChain |
| **LLMs** | Azure AI Foundry (Llama 3.3 70B + Llama 4 Maverick 17B) |
| **Embeddings** | OpenRouter (nvidia/llama-nemotron-embed-vl-1b-v2, 2048-dim) |
| **Database** | Supabase PostgreSQL + pgvector |
| **ORM** | SQLAlchemy (async) + Alembic migrations |
| **Authentication** | Clerk JWT verification |
| **Payments** | Stripe (webhook lifecycle management) |
| **Rate Limiting** | Redis (sliding-window) |
| **Web Search** | Tavily (advanced depth) |
| **Web Scraping** | Firecrawl |
| **PDF Export** | ReportLab |
| **Observability** | LangSmith (tracing + evaluation) |
| **Settings** | Pydantic Settings (`.env` based) |

## Project Structure

```
backend/
├── main.py                    FastAPI app entry point, middleware setup, router mounting
├── config.py                  Pydantic Settings — all env vars in one place
├── models.py                  Dual-tier LLM factory (Azure AI Foundry)
├── requirements.txt           Python dependencies
│
├── agents/                    LangGraph Multi-Agent Pipeline
│   ├── graph.py               6-node StateGraph with conditional routing
│   ├── state.py               ResearchState TypedDict (shared agent state)
│   └── nodes/
│       ├── memory.py          Semantic cache lookup (pgvector, threshold 0.85)
│       ├── planner.py         Query decomposition into 3–5 search sub-tasks
│       ├── researcher.py      Tavily search + Firecrawl scraping per sub-task
│       ├── analyst.py         Corrective RAG — grade, rewrite, web fallback
│       ├── writer.py          Structured Markdown report generation
│       └── reviewer.py        Quality scoring & conditional routing back
│
├── api/                       REST API Layer
│   ├── routes.py              POST /research — SSE streaming endpoint
│   ├── reports.py             Report CRUD (list, get, soft-delete)
│   ├── sharing.py             Public share token generation & revocation
│   ├── export.py              PDF export (Markdown → styled PDF via ReportLab)
│   ├── billing.py             Stripe webhook handler (subscription lifecycle)
│   ├── users.py               Usage tracking, plan limits, user sync
│   ├── auth.py                Clerk JWT middleware (JWKS verification)
│   └── rate_limiter.py        Redis sliding-window rate limiter
│
├── db/                        Database Layer
│   ├── base.py                SQLAlchemy declarative base
│   ├── session.py             Async session factory (asyncpg driver)
│   └── models.py              ORM models: User, Report, ReportChunk, Subscription
│
├── tools/                     External Integrations
│   ├── search.py              Tavily web search (advanced depth, retry logic)
│   ├── scraper.py             Firecrawl page scraping (markdown output, 10K char limit)
│   └── vector.py              pgvector operations + OpenRouter embedding client
│
├── evals/                     Evaluation Framework
│   ├── dataset.json           Test cases (query, domain, expected facts)
│   ├── grader.py              LLM-as-a-Judge scoring (completeness, flow, citations)
│   ├── run_evals.py           Batch evaluation runner
│   └── runs/                  Saved evaluation results
│
└── alembic/                   Database Migrations
    ├── env.py                 Alembic environment configuration
    └── versions/              Migration scripts
```

## Agent Pipeline

The core of ARIA is a 6-node LangGraph `StateGraph` with conditional routing and bounded loops:

```
START → Memory ──(cache hit)──→ END
              │
         (cache miss)
              ▼
          Planner ──→ Researcher ──→ Analyst (CRAG) ──→ Writer ──→ Reviewer
              ▲                          │                           │
              │                    (need more data)                  │
              │                          ▼                           │
              │                     Researcher                      │
              │                                                     │
              └──────── reject (missing facts) ─────────────────────┘
                                                                    │
                                          Writer ◄── reject (formatting)
                                                                    │
                                             END ◄── approve ───────┘
```

### Node Details

| Node | Model Tier | Description |
|------|-----------|-------------|
| **Memory** | Embeddings | Embeds the query and checks pgvector for similar past reports (cosine similarity ≥ 0.85). Cache hit skips the entire pipeline. |
| **Planner** | Light (Maverick 17B) | Decomposes the user query into 3–5 specific, domain-aware search sub-tasks using structured output. |
| **Researcher** | Tools only | Executes each sub-task via Tavily search (advanced depth) and Firecrawl scraping. Collects results and sources. |
| **Analyst** | Heavy (Llama 3.3 70B) | Corrective RAG flow: retrieves relevant chunks from pgvector, grades them for relevance, rewrites queries if needed, and falls back to web search if context is insufficient. |
| **Writer** | Heavy (Llama 3.3 70B) | Synthesizes the analyst's output into a polished, structured Markdown report with citations and domain-specific formatting. |
| **Reviewer** | Heavy (Llama 3.3 70B) | Scores the report (1–5) on completeness, accuracy, and source attribution. Routes back to Writer (formatting issues) or Planner (missing facts) with max 2 iterations. |

### Dual-Tier LLM Strategy

| Tier | Model | Purpose |
|------|-------|---------|
| Light | Llama-4-Maverick-17B-128E-Instruct-FP8 | Fast, inexpensive reasoning for query decomposition |
| Heavy | Llama-3.3-70B-Instruct | High-quality synthesis, writing, and review |
| Embeddings | nvidia/llama-nemotron-embed-vl-1b-v2 | 2048-dim embeddings for semantic cache & RAG |

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/research` | ✅ | Start the agent pipeline; streams progress via SSE |
| `GET` | `/api/v1/reports` | ✅ | List the authenticated user's reports |
| `GET` | `/api/v1/reports/:id` | ✅ | Get a specific report by ID |
| `DELETE` | `/api/v1/reports/:id` | ✅ | Soft-delete a report |
| `POST` | `/api/v1/reports/:id/share` | ✅ | Generate a public share token |
| `DELETE` | `/api/v1/reports/:id/share` | ✅ | Revoke a share token |
| `GET` | `/api/v1/shared/:token` | ❌ | View a shared report (public, no auth) |
| `GET` | `/api/v1/reports/:id/export/pdf` | ✅ | Export report as styled PDF |
| `GET` | `/api/v1/user/usage` | ✅ | Get usage stats & plan info |
| `POST` | `/api/v1/user/sync` | ✅ | Sync user profile from Clerk |
| `POST` | `/api/v1/stripe/webhook` | ❌* | Stripe subscription webhook (* signature verified) |
| `GET` | `/api/health` | ❌ | Health check |

## Middleware Stack

Middleware executes in this order (outermost → innermost):

1. **CORS** — Allows configured origins with credentials
2. **Rate Limiter** — Redis sliding-window: 10 req/min (AI endpoints), 100 req/min (authenticated), 30 req/min (unauthenticated)
3. **Clerk Auth** — Validates JWT from `Authorization` header, populates `request.state.user`

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | Clerk-synced profiles, plan tier, monthly usage counter, Stripe customer ID |
| `reports` | Generated intelligence reports with query embedding, sources (JSONB), share token, soft-delete |
| `report_chunks` | pgvector-indexed chunks of reports for RAG retrieval (2048-dim embeddings) |
| `subscriptions` | Stripe subscription state (plan, status, billing period, cancellation) |

## Rate Limiting

Configurable via environment variables:

| Tier | Limit | Scope |
|------|-------|-------|
| AI endpoints | 10 req/min | Authenticated users hitting `/research` |
| General (authenticated) | 100 req/min | All other authenticated traffic |
| General (unauthenticated) | 30 req/min | Unauthenticated requests (by IP) |

## Evaluation Framework

Run automated evaluations using LLM-as-a-Judge:

```bash
python -m evals.run_evals
```

- **`dataset.json`** — Test cases with queries, domains, and lists of expected facts
- **`grader.py`** — Scores reports on completeness (1–5), narrative flow (1–5), and citation density (1–5); lists missing facts
- **`run_evals.py`** — Generates reports via the pipeline and grades them; results saved in `evals/runs/`

## Getting Started

### Prerequisites

- Python 3.12+
- Redis instance
- Supabase project with pgvector extension enabled
- API keys: Azure AI Foundry, OpenRouter, Tavily, Firecrawl, Clerk, Stripe

### Installation

```bash
python -m venv venv
venv\Scripts\activate          # Windows  (source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
```

### Configuration

```bash
cp .env.example .env           # Then fill in your API keys
```

| Variable | Description |
|----------|-------------|
| `AZURE_OPENAI_API_KEY` | Azure AI Foundry API key |
| `AZURE_OPENAI_ENDPOINT` | Azure AI Foundry endpoint URL |
| `AZURE_OPENAI_API_DEPLOYMENT_MODEL_1` | Heavy model deployment name (Llama 3.3 70B) |
| `AZURE_OPENAI_API_DEPLOYMENT_MODEL_2` | Light model deployment name (Llama 4 Maverick) |
| `OPENROUTER_API_KEY` | OpenRouter API key (for embeddings) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` | Supabase PostgreSQL credentials |
| `TAVILY_API_KEY` | Tavily search API key |
| `FIRECRAWL_API_KEY` | Firecrawl scraping API key |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Supabase client credentials |
| `CLERK_SECRET_KEY` / `CLERK_JWKS_URL` | Clerk authentication |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe billing |
| `LANGCHAIN_API_KEY` / `LANGCHAIN_PROJECT` | LangSmith observability |
| `REDIS_URL` | Redis connection string |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

### Database Migrations

```bash
alembic upgrade head
```

### Run

```bash
python main.py                 # Starts on http://localhost:8000
```

The API docs are available at `http://localhost:8000/docs` (Swagger UI) and `http://localhost:8000/redoc` (ReDoc).
