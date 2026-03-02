from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import routes
import uvicorn

app = FastAPI(
    title="ARIA API",
    description="Autonomous Research & Intelligence Agent Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api/v1")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "ARIA backend"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
