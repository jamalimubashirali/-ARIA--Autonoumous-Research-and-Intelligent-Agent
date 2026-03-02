from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    anthropic_api_key: str = ""
    tavily_api_key: str = ""
    firecrawl_api_key: str = ""
    
    supabase_url: str = ""
    supabase_service_key: str = ""
    
    clerk_secret_key: str = ""
    clerk_jwks_url: str = ""
    
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    
    langchain_tracing_v2: str = "false"
    langchain_api_key: str = ""
    langchain_project: str = "ARIA_Agent"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
