"""
Dual-tier LLM factory for ARIA agent nodes.

- "light"  → Llama-4-Maverick-17B (fast, cheap — used for Planner)
- "heavy"  → Llama-3.3-70B-Instruct (powerful — used for Analyst, Writer)
"""

from langchain_openai import AzureChatOpenAI
from config import settings

# Valid tiers
TIER_LIGHT = "light"
TIER_HEAVY = "heavy"

_MODEL_MAP = {
    TIER_LIGHT: settings.azure_openai_api_deployment_model_2,  # Maverick 17B
    TIER_HEAVY: settings.azure_openai_api_deployment_model_1,  # Llama 70B
}


def get_llm(tier: str = TIER_HEAVY, temperature: float = 0.0) -> AzureChatOpenAI:
    """
    Return a LangChain chat model backed by Azure AI Foundry.

    Args:
        tier: "light" for Planner tasks, "heavy" for Analyst/Writer tasks.
        temperature: Sampling temperature (0.0 = deterministic).
    """
    if tier not in _MODEL_MAP:
        raise ValueError(f"Invalid model tier '{tier}'. Use '{TIER_LIGHT}' or '{TIER_HEAVY}'.")

    deployment = _MODEL_MAP[tier]

    return AzureChatOpenAI(
        azure_deployment=deployment,
        azure_endpoint=settings.azure_openai_endpoint,
        api_key=settings.azure_openai_api_key,
        api_version="2024-12-01-preview",
        temperature=temperature,
    )
