from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL
import os

class Settings(BaseSettings):
    # ==== Azure AI Foundry (LLM) — Optional if using OpenRouter ====
    azure_openai_api_key: str = ""
    azure_openai_endpoint: str = ""
    azure_openai_api_deployment_model_1: str = "Llama-3.3-70B-Instruct"        # Heavy (analyst, writer)
    azure_openai_api_deployment_model_2: str = "Llama-4-Maverick-17B-128E-Instruct-FP8"  # Light (planner)

    # ==== Embedding Model (OpenRouter) ====
    openrouter_embedding_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_api_key: str      # Your OpenRouter API Key
    openrouter_embedding_model: str = "nvidia/llama-nemotron-embed-vl-1b-v2:free"
    openrouter_heavy_model: str = "qwen/qwen3.6-plus:free"   # Default free model
    openrouter_light_model: str = "qwen/qwen3-next-80b-a3b-instruct:free"   # Default free model
    embedding_dimensions: int = 2048   # Native output with content-array input format

    # ==== Database (Supabase PostgreSQL) ====
    db_host: str
    db_port: int = 6543
    db_name: str = "postgres"
    db_user: str
    db_password: str

    # ==== Web Search & Scraping ====
    tavily_api_key: str
    firecrawl_api_key: str

    # ==== Supabase (legacy client — kept for compatibility) ====
    supabase_url: str
    supabase_service_key: str

    # ==== Authentication (Clerk) ====
    clerk_secret_key: str
    clerk_jwks_url: str

    # ==== Billing (Stripe) ====
    stripe_secret_key: str
    stripe_webhook_secret: str

    # ==== Observability (LangSmith) ====
    langchain_tracing_v2: str = "false"
    langchain_endpoint: str = "https://eu.api.smith.langchain.com"
    langchain_api_key: str = ""
    langchain_project: str = "ARIA-Autonomous-Research-Intelligent-Agent"

    # ==== Server / Security ====
    allowed_origins: str
    redis_url: str

    # ==== Rate Limiting ====
    RATE_LIMIT_AI: int = 10               # requests per minute for expensive AI endpoints
    RATE_LIMIT_GENERAL_AUTH: int = 100    # requests per minute for general authenticated traffic
    RATE_LIMIT_GENERAL_UNAUTH: int = 30   # requests per minute for unauthenticated
    WINDOW_SECONDS: int = 60

    def _make_url(self, drivername: str) -> URL:
        """Build a SQLAlchemy URL object with proper escaping."""
        return URL.create(
            drivername=drivername,
            username=self.db_user,
            password=self.db_password,
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
        )

    @property
    def async_database_url(self) -> URL:
        return self._make_url("postgresql+asyncpg")

    @property
    def sync_database_url(self) -> URL:
        return self._make_url("postgresql+psycopg2")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
