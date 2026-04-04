"""
Dual-tier LLM factory for ARIA agent nodes.

- "light"  → Llama-4-Maverick-17B (fast, cheap — used for Planner)
- "heavy"  → Llama-3.3-70B-Instruct (powerful — used for Analyst, Writer)

Includes a TokenTracker for per-request token accounting.
"""
import threading

from langchain_openai import ChatOpenAI
from config import settings

# Valid tiers
TIER_LIGHT = "light"
TIER_HEAVY = "heavy"

_MODEL_MAP = {
    TIER_LIGHT: settings.openrouter_light_model,
    TIER_HEAVY: settings.openrouter_heavy_model,
}

def get_llm(tier: str = TIER_HEAVY, temperature: float = 0.0) -> ChatOpenAI:
    if tier not in _MODEL_MAP:
        raise ValueError(f"Invalid model tier '{tier}'. Use '{TIER_LIGHT}' or '{TIER_HEAVY}'.")

    model_name = _MODEL_MAP[tier]

    try:
        return ChatOpenAI(
            model=model_name,
            base_url=settings.openrouter_embedding_base_url, # OpenAI compatible
            api_key=settings.openrouter_api_key,
            temperature=temperature,
            max_retries=2,
            # For OpenRouter, it's good to pass some extra headers if needed, 
            # but standard ChatOpenAI works.
            default_headers={
                "HTTP-Referer": "https://github.com/jamalimubashirali/-ARIA--Autonoumous-Research-and-Intelligent-Agent",
                "X-Title": "ARIA Research Agent"
            }
        )
    except Exception as e:
        # Fallback to TIER_HEAVY if TIER_LIGHT setup fails directly
        if tier == TIER_LIGHT:
            return ChatOpenAI(
                model=_MODEL_MAP[TIER_HEAVY],
                base_url=settings.openrouter_embedding_base_url,
                api_key=settings.openrouter_api_key,
                temperature=temperature,
                max_retries=2
            )
        raise e


# ---------------------------------------------------------------------------
# Token Tracker — thread-safe accumulator for per-request token counting
# ---------------------------------------------------------------------------
class TokenTracker:
    """Accumulates prompt + completion tokens across all LLM calls in a request."""

    def __init__(self):
        self._lock = threading.Lock()
        self.prompt_tokens = 0
        self.completion_tokens = 0

    def add(self, prompt: int, completion: int):
        with self._lock:
            self.prompt_tokens += prompt
            self.completion_tokens += completion

    @property
    def total(self) -> int:
        return self.prompt_tokens + self.completion_tokens

    def reset(self):
        with self._lock:
            self.prompt_tokens = 0
            self.completion_tokens = 0

    def __repr__(self):
        return f"TokenTracker(prompt={self.prompt_tokens}, completion={self.completion_tokens}, total={self.total})"


# Singleton tracker — reset at the start of each request
_tracker = TokenTracker()


def get_token_tracker() -> TokenTracker:
    return _tracker


def extract_tokens(response) -> tuple[int, int]:
    """Extract token counts from a LangChain response object.

    Works with both AIMessage and structured output (BaseModel) responses.
    Returns (prompt_tokens, completion_tokens).
    """
    # AIMessage has response_metadata
    meta = getattr(response, "response_metadata", None)
    if meta and "token_usage" in meta:
        usage = meta["token_usage"]
        return usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)
    if meta and "usage" in meta:
        usage = meta["usage"]
        return usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)
    return 0, 0
