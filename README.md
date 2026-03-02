# ARIA — Autonomous Research & Intelligence Agent

> AI-powered SaaS platform that transforms unstructured research requests into structured, domain-specific intelligence reports in under 60 seconds.

## Architecture

```
frontend/          Next.js 16 + Tailwind v4 + shadcn/ui + Clerk
backend/           FastAPI + LangGraph multi-agent pipeline
  ├── agents/      4-node graph: Planner → Researcher → Analyst → Writer
  ├── api/         REST endpoints + SSE streaming + auth + billing
  ├── tools/       Tavily search, Firecrawl scraper, pgvector RAG
  └── models.py    Dual-tier LLM factory (Azure AI Foundry)
```

## Models

| Tier  | Model                                  | Used By         | Purpose                       |
| ----- | -------------------------------------- | --------------- | ----------------------------- |
| Light | Llama-4-Maverick-17B-128E-Instruct-FP8 | Planner         | Query decomposition           |
| Heavy | Llama-3.3-70B-Instruct                 | Analyst, Writer | Synthesis & report generation |

Both models are served via **Azure AI Foundry** serverless endpoints.

## Supported Domains

Sales · Finance · Healthcare · Legal · Sports

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # Fill in your API keys
python main.py
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local    # Fill in your keys
npm run dev
```

## Tech Stack

- **LLM**: Azure AI Foundry (Llama 3.3 + Llama 4 Maverick)
- **Agent Framework**: LangGraph (Python)
- **Backend**: FastAPI, SSE streaming
- **Frontend**: Next.js 16, Tailwind CSS v4, shadcn/ui
- **Auth**: Clerk
- **Payments**: Stripe
- **Database**: Supabase (PostgreSQL + pgvector)
- **Observability**: LangSmith

## License

Confidential — Not for redistribution.
