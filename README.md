# ARIA — Autonomous Research & Intelligence Agent

> AI-powered SaaS platform that transforms unstructured research requests into structured, domain-specific intelligence reports in under 60 seconds.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Agent Pipeline](#agent-pipeline)
- [Models](#models)
- [Supported Domains](#supported-domains)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Evaluation Framework](#evaluation-framework)
- [License](#license)

## Overview

ARIA is a full-stack, production-grade SaaS application that leverages a multi-agent LangGraph pipeline to autonomously research any topic and produce polished, domain-aware intelligence reports. Users submit a natural-language query, and ARIA decomposes it, searches the web, scrapes relevant pages, retrieves context from a vector store, synthesizes an analysis, writes a structured report, and self-reviews — all streamed to the frontend in real time via SSE.

## Key Features

- **Multi-Agent Pipeline** — 6-node LangGraph graph with conditional routing, bounded loops, and self-correction
- **Corrective RAG (CRAG)** — Analyst node grades retrieved chunks, rewrites queries, and falls back to web search when vector store context is insufficient
- **Semantic Memory Cache** — Memory node embeds the query and checks pgvector for similar past reports to short-circuit redundant research (similarity threshold: 0.85)
- **Dual-Tier LLM Strategy** — Lightweight model for planning, heavy model for synthesis and writing, both served via Azure AI Foundry
- **Real-Time SSE Streaming** — Progress events streamed to the frontend as each agent node completes
- **Self-Review Loop** — Reviewer node scores reports on completeness, accuracy, and source attribution; conditionally loops back to Writer or Planner (max 2 iterations)
- **PDF Export** — Server-side Markdown-to-PDF conversion using ReportLab with professional styling
- **Report Sharing** — Tokenized public share links with owner-controlled revocation
- **Stripe Billing** — Subscription lifecycle management with tiered plans (Free / Starter / Pro / Enterprise)
- **Redis Rate Limiting** — Sliding-window rate limiter per user/IP with configurable tiers
- **Clerk Authentication** — JWT-based auth with protected routes on both frontend and backend
- **LLM-as-a-Judge Evaluation** — Automated grading of generated reports against expected-fact datasets

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 16)                    │
│   Tailwind v4 · shadcn/ui · Clerk Auth · Framer Motion · GSAP  │
│   Three.js Background · React Markdown · Stripe Checkout        │
└────────────────────────────┬────────────────────────────────────┘
                             │  SSE / REST
┌────────────────────────────▼────────────────────────────────────┐
│                     Backend (FastAPI)                            │
│                                                                 │
│  api/                                                           │
│  ├── routes.py       POST /research — SSE streaming endpoint    │
│  ├── reports.py      CRUD for saved reports                     │
│  ├── sharing.py      Public share token management              │
│  ├── export.py       PDF export (ReportLab)                     │
│  ├── billing.py      Stripe webhook handler                     │
│  ├── users.py        Usage tracking & plan management           │
│  ├── auth.py         Clerk JWT middleware                       │
│  └── rate_limiter.py Redis sliding-window rate limiter          │
│                                                                 │
│  agents/             LangGraph Multi-Agent Pipeline             │
│  ├── graph.py        6-node graph with conditional routing      │
│  ├── state.py        Shared ResearchState TypedDict             │
│  └── nodes/          Memory · Planner · Researcher · Analyst    │
│                      Writer · Reviewer                          │
│                                                                 │
│  tools/              External integrations                      │
│  ├── search.py       Tavily web search (advanced depth)         │
│  ├── scraper.py      Firecrawl page scraping                    │
│  └── vector.py       pgvector RAG + OpenRouter embeddings       │
│                                                                 │
│  db/                 SQLAlchemy async ORM + Alembic migrations  │
│  evals/              LLM-as-a-Judge evaluation framework        │
│  models.py           Dual-tier LLM factory (Azure AI Foundry)   │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   Supabase            Azure AI Foundry       Redis
   PostgreSQL +        Llama 3.3 70B          Rate Limiting
   pgvector            Llama 4 Maverick 17B
```

## Agent Pipeline

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

| Node | Model Tier | Responsibility |
|------|-----------|----------------|
| **Memory** | Embeddings | Semantic cache lookup via pgvector (threshold 0.85) |
| **Planner** | Light | Decomposes query into 3–5 targeted search sub-tasks |
| **Researcher** | Tools | Executes Tavily search + Firecrawl scraping per sub-task |
| **Analyst** | Heavy | Corrective RAG — grades chunks, rewrites queries, web fallback |
| **Writer** | Heavy | Synthesizes analysis into structured Markdown report |
| **Reviewer** | Heavy | Scores report (1–5) on completeness, accuracy, citations; routes back if needed |

## Models

| Tier | Model | Used By | Purpose |
|------|-------|---------|---------|
| Light | Llama-4-Maverick-17B-128E-Instruct-FP8 | Planner | Query decomposition |
| Heavy | Llama-3.3-70B-Instruct | Analyst, Writer, Reviewer | Synthesis, report generation & review |
| Embeddings | nvidia/llama-nemotron-embed-vl-1b-v2 | Memory, Vector Store | 2048-dim embeddings via OpenRouter |

All LLMs are served via **Azure AI Foundry** serverless endpoints. Embeddings are served via **OpenRouter**.

## Supported Domains

Sales · Finance · Healthcare · Legal · Sports · General

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **LLMs** | Azure AI Foundry (Llama 3.3 70B + Llama 4 Maverick 17B) |
| **Embeddings** | OpenRouter (nvidia/llama-nemotron-embed-vl-1b-v2) |
| **Agent Framework** | LangGraph (Python) |
| **Backend** | FastAPI, Uvicorn, SSE streaming |
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, shadcn/ui |
| **Animations** | Framer Motion, GSAP, Three.js |
| **Auth** | Clerk (frontend middleware + backend JWT verification) |
| **Payments** | Stripe (subscriptions + webhook lifecycle) |
| **Database** | Supabase (PostgreSQL + pgvector), SQLAlchemy async, Alembic |
| **Caching / Rate Limiting** | Redis (sliding-window) |
| **Observability** | LangSmith (tracing + evaluation) |
| **PDF Export** | ReportLab |

## Project Structure

```
ARIA/
├── README.md                  ← You are here
├── backend/
│   ├── main.py                FastAPI app entry point
│   ├── config.py              Pydantic settings (env vars)
│   ├── models.py              Dual-tier LLM factory
│   ├── requirements.txt       Python dependencies
│   ├── agents/
│   │   ├── graph.py           LangGraph workflow definition
│   │   ├── state.py           ResearchState TypedDict
│   │   └── nodes/
│   │       ├── memory.py      Semantic cache lookup
│   │       ├── planner.py     Query decomposition
│   │       ├── researcher.py  Web search + scraping
│   │       ├── analyst.py     Corrective RAG synthesis
│   │       ├── writer.py      Report generation
│   │       └── reviewer.py    Quality review & routing
│   ├── api/
│   │   ├── routes.py          POST /research (SSE streaming)
│   │   ├── reports.py         Report CRUD endpoints
│   │   ├── sharing.py         Share token management
│   │   ├── export.py          PDF export
│   │   ├── billing.py         Stripe webhook handler
│   │   ├── users.py           Usage tracking & plans
│   │   ├── auth.py            Clerk JWT middleware
│   │   └── rate_limiter.py    Redis rate limiting
│   ├── db/
│   │   ├── models.py          ORM models (User, Report, ReportChunk, Subscription)
│   │   ├── session.py         Async SQLAlchemy session
│   │   └── base.py            Declarative base
│   ├── tools/
│   │   ├── search.py          Tavily search integration
│   │   ├── scraper.py         Firecrawl scraping integration
│   │   └── vector.py          pgvector operations + OpenRouter embeddings
│   ├── evals/
│   │   ├── dataset.json       Evaluation test cases
│   │   ├── grader.py          LLM-as-a-Judge scoring
│   │   └── run_evals.py       Evaluation runner
│   └── alembic/               Database migration scripts
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── src/
│   │   ├── middleware.ts      Clerk auth route protection
│   │   ├── app/
│   │   │   ├── page.tsx       Landing page
│   │   │   ├── layout.tsx     Root layout
│   │   │   ├── dashboard/     Report history, settings
│   │   │   ├── research/      Research interface
│   │   │   ├── shared/        Public shared report view
│   │   │   ├── sign-in/       Clerk sign-in
│   │   │   └── sign-up/       Clerk sign-up
│   │   ├── components/
│   │   │   ├── landing/       Hero, Features, Pricing, Testimonials, HowItWorks, Footer
│   │   │   ├── ui/            shadcn/ui components
│   │   │   ├── AppHeader.tsx
│   │   │   └── AppSidebar.tsx
│   │   └── lib/               Utilities
│   └── public/                Static assets
```

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- Redis instance
- Supabase project (PostgreSQL with pgvector extension)
- API keys: Azure AI Foundry, OpenRouter, Tavily, Firecrawl, Clerk, Stripe

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows  (source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
cp .env.example .env           # Fill in your API keys
python main.py                 # Starts on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local     # Fill in your keys
npm run dev                    # Starts on http://localhost:3000
```

### Database Migrations

```bash
cd backend
alembic upgrade head
```

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `AZURE_OPENAI_API_KEY` | Azure AI Foundry API key |
| `AZURE_OPENAI_ENDPOINT` | Azure AI Foundry endpoint URL |
| `AZURE_OPENAI_API_DEPLOYMENT_MODEL_1` | Heavy model deployment name |
| `AZURE_OPENAI_API_DEPLOYMENT_MODEL_2` | Light model deployment name |
| `OPENROUTER_API_KEY` | OpenRouter API key (embeddings) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` | Supabase PostgreSQL credentials |
| `TAVILY_API_KEY` | Tavily search API key |
| `FIRECRAWL_API_KEY` | Firecrawl scraping API key |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Supabase client credentials |
| `CLERK_SECRET_KEY` / `CLERK_JWKS_URL` | Clerk authentication |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe billing |
| `LANGCHAIN_API_KEY` / `LANGCHAIN_PROJECT` | LangSmith observability |
| `REDIS_URL` | Redis connection string |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/research` | Start research pipeline (SSE streaming) |
| `GET` | `/api/v1/reports` | List user's reports |
| `GET` | `/api/v1/reports/:id` | Get a specific report |
| `DELETE` | `/api/v1/reports/:id` | Soft-delete a report |
| `POST` | `/api/v1/reports/:id/share` | Generate a public share link |
| `DELETE` | `/api/v1/reports/:id/share` | Revoke a share link |
| `GET` | `/api/v1/shared/:token` | View a shared report (no auth) |
| `GET` | `/api/v1/reports/:id/export/pdf` | Export report as PDF |
| `GET` | `/api/v1/user/usage` | Get usage stats & plan info |
| `POST` | `/api/v1/user/sync` | Sync user from Clerk |
| `POST` | `/api/v1/stripe/webhook` | Stripe subscription webhook |
| `GET` | `/api/health` | Health check |

## Evaluation Framework

ARIA includes an LLM-as-a-Judge evaluation pipeline in `backend/evals/`:

- **`dataset.json`** — Test cases with queries, domains, and expected facts
- **`grader.py`** — Uses the heavy LLM to score reports on completeness, narrative flow, and citation density (1–5 scale)
- **`run_evals.py`** — Batch runner that generates reports and grades them, saving results to `evals/runs/`

```bash
cd backend
python -m evals.run_evals
```

## License

Confidential — Not for redistribution.
