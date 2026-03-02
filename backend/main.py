from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import routes
from api.billing import router as billing_router
from api.reports import router as reports_router
from api.users import router as users_router
from api.sharing import router as sharing_router
from api.export import router as export_router
from api.rate_limiter import RateLimitMiddleware
from api.auth import setup_auth
import uvicorn

app = FastAPI(
    title="ARIA API",
    description="Autonomous Research & Intelligence Agent Backend",
    version="1.0.0"
)

# Middleware (execution order: from bottom to top, i.e., last added is outermost)

# 3. Innermost: Authentication
setup_auth(app)

# 2. Middle: Rate Limiting
app.add_middleware(RateLimitMiddleware)

# 1. Outermost: CORS (must run before anything else to add headers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "ARIA backend"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
