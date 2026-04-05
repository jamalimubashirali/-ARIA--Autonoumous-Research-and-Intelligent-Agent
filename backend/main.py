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
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from api import routes
from api.billing import router as billing_router
from api.reports import router as reports_router
from api.users import router as users_router
from api.sharing import router as sharing_router
from api.export import router as export_router
from api.rate_limiter import RateLimitMiddleware
import uvicorn
import os

app = FastAPI(
    title="ARIA API",
    description="Autonomous Research & Intelligence Agent Backend",
    version="1.0.0"
)

@app.on_event("startup")
async def log_startup_config():
    # Safe diagnostics (no secrets)
    raw = os.getenv("ALLOWED_ORIGINS", "")
    print(f"[CORS] ALLOWED_ORIGINS raw: {repr(raw)}")
    print(f"[CORS] ALLOWED_ORIGINS parsed: {settings.allowed_origins_list}")

    required_env = [
        "OPENROUTER_API_KEY",
        "DB_HOST",
        "DB_PORT",
        "DB_NAME",
        "DB_USER",
        "DB_PASSWORD",
        "TAVILY_API_KEY",
        "FIRECRAWL_API_KEY",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_KEY",
        "CLERK_SECRET_KEY",
        "CLERK_JWKS_URL",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "REDIS_URL",
        "ALLOWED_ORIGINS",
    ]
    for key in required_env:
        status = "SET" if os.getenv(key) else "MISSING"
        print(f"[EnvCheck] {key}: {status}")

# ---------------------------------------------------------------------------
# Middlewares
# ---------------------------------------------------------------------------

from starlette.middleware.base import BaseHTTPMiddleware
from api.auth import clerk_auth_middleware
from fastapi.responses import JSONResponse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 4. Request Logging (for debugging production traffic)
async def log_request_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    method = request.method
    path = request.url.path
    logger.info(f"Incoming request: {method} {path} | Origin: {origin}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

app.add_middleware(BaseHTTPMiddleware, dispatch=log_request_middleware)

# 3. Innermost: Authentication
app.add_middleware(BaseHTTPMiddleware, dispatch=clerk_auth_middleware)

# 2. Middle: Rate Limiting
app.add_middleware(RateLimitMiddleware)

# 1. Outermost: CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Global Exception Handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"GLOBAL ERROR: {str(exc)}", exc_info=True)
    origin = request.headers.get("origin")
    headers = {}
    if origin and origin in settings.allowed_origins_list:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
        headers=headers,
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
