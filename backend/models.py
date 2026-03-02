"""
Dual-tier LLM factory for ARIA agent nodes.

- "light"  → Llama-4-Maverick-17B (fast, cheap — used for Planner)
- "heavy"  → Llama-3.3-70B-Instruct (powerful — used for Analyst, Writer)
"""

from langchain_openai import ChatOpenAI
from config import settings

# Valid tiers
TIER_LIGHT = "light"
TIER_HEAVY = "heavy"

_MODEL_MAP = {
    TIER_LIGHT: settings.azure_openai_api_deployment_model_2,  # Maverick 17B
    TIER_HEAVY: settings.azure_openai_api_deployment_model_1,  # Llama 70B
}

def get_llm(tier: str = TIER_HEAVY, temperature: float = 0.0) -> ChatOpenAI:
    if tier not in _MODEL_MAP:
        raise ValueError(f"Invalid model tier '{tier}'. Use '{TIER_LIGHT}' or '{TIER_HEAVY}'.")

    deployment = _MODEL_MAP[tier]

    try:
        return ChatOpenAI(
            model=deployment,
            base_url=settings.azure_openai_endpoint,
            api_key=settings.azure_openai_api_key,
            temperature=temperature,
            max_retries=2
        )
    except Exception as e:
        # Fallback to TIER_HEAVY if TIER_LIGHT setup fails directly
        if tier == TIER_LIGHT:
            return ChatOpenAI(
                model=_MODEL_MAP[TIER_HEAVY],
                base_url=settings.azure_openai_endpoint,
                api_key=settings.azure_openai_api_key,
                temperature=temperature,
                max_retries=2
            )
        raise e
