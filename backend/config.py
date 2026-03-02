from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL

class Settings(BaseSettings):
    # ==== Azure AI Foundry (LLM) ====
    azure_openai_api_key: str = ""
    azure_openai_endpoint: str = ""
    azure_openai_api_deployment_model_1: str = "Llama-3.3-70B-Instruct"        # Heavy (analyst, writer)
    azure_openai_api_deployment_model_2: str = "Llama-4-Maverick-17B-128E-Instruct-FP8"  # Light (planner)

    # ==== Embedding Model (OpenRouter) ====
    openrouter_embedding_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_api_key: str = ""      # Your OpenRouter API Key
    openrouter_embedding_model: str = "nvidia/llama-nemotron-embed-vl-1b-v2:free"
    embedding_dimensions: int = 1024

    # ==== Database (Supabase PostgreSQL) ====
    db_host: str = "aws-1-ap-south-1.pooler.supabase.com"
    db_port: int = 6543
    db_name: str = "postgres"
    db_user: str = ""
    db_password: str = ""

    # ==== Web Search & Scraping ====
    tavily_api_key: str = ""
    firecrawl_api_key: str = ""

    # ==== Supabase (legacy client — kept for compatibility) ====
    supabase_url: str = ""
    supabase_service_key: str = ""

    # ==== Authentication (Clerk) ====
    clerk_secret_key: str = ""
    clerk_jwks_url: str = ""

    # ==== Billing (Stripe) ====
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # ==== Observability (LangSmith) ====
    langchain_tracing_v2: str = "false"
    langchain_api_key: str = ""
    langchain_project: str = "ARIA_Agent"

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
