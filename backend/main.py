"""
ARIA Backend — FastAPI Application

Sets up LangSmith tracing BEFORE any LangChain imports, then configures
middleware and mounts routers.
"""
import os

# ---------------------------------------------------------------------------
# LangSmith tracing — must be set in os.environ BEFORE langchain imports
# ---------------------------------------------------------------------------
from config import settings

if settings.langchain_api_key:
    os.environ["LANGCHAIN_TRACING_V2"] = "true"
    os.environ["LANGCHAIN_API_KEY"] = settings.langchain_api_key
    os.environ["LANGCHAIN_PROJECT"] = settings.langchain_project or "ARIA_Agent"
    os.environ["LANGCHAIN_ENDPOINT"] = "https://eu.api.smith.langchain.com"
    print(f"[LangSmith] Tracing enabled -> project: {os.environ['LANGCHAIN_PROJECT']}")
else:
    print("[LangSmith] No API key configured — tracing disabled")

# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import routes
from api.billing import router as billing_router
from api.reports import router as reports_router
from api.users import router as users_router
from api.sharing import router as sharing_router
from api.export import router as export_router
from api.rate_limiter import RateLimitMiddleware
import uvicorn

app = FastAPI(
    title="ARIA API",
    description="Autonomous Research & Intelligence Agent Backend",
    version="1.0.0"
)

# Middleware (execution order: from bottom to top, i.e., last added is outermost)

from starlette.middleware.base import BaseHTTPMiddleware
from api.auth import clerk_auth_middleware

# 3. Innermost: Authentication
app.add_middleware(BaseHTTPMiddleware, dispatch=clerk_auth_middleware)

# 2. Middle: Rate Limiting
app.add_middleware(RateLimitMiddleware)

# 1. Outermost: CORS (must run before anything else to add headers)
allowed_origins_list = [origin.strip() for origin in settings.allowed_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(routes.router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(billing_router, prefix="/api/v1")
app.include_router(sharing_router, prefix="/api/v1")
app.include_router(export_router, prefix="/api/v1")

@app.get("/api/health", tags=["system"])
async def health_check():
    return {"status": "healthy", "service": "ARIA backend"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
