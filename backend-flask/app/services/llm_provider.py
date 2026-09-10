import os
import logging

from app.services.ollama_provider import OllamaProvider
from app.services.openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)


def get_llm_provider():
    """
    Returns the configured LLM provider. Selected by the AI_PROVIDER env var so
    switching the entire app between local Ollama and a paid API is a single
    config change (default: ollama).
    """
    name = (os.getenv("AI_PROVIDER") or "ollama").strip().lower()
    if name == "openai":
        logger.info("LLM provider: OpenAI")
        return OpenAIProvider()
    logger.info("LLM provider: Ollama")
    return OllamaProvider()


# Shared singleton used across the whole app. Every LLM call goes through this,
# so provider selection lives in exactly one place.
llm_provider = get_llm_provider()
