import logging
from app.services.ollama_provider import OllamaProvider

logger = logging.getLogger(__name__)

_GENERIC_MARKERS = [
    "as an ai", "in general", "many people", "it is common",
    "everyone has", "most artists", "typically", "usually"
]


class PersonalizationService:
    """
    Refines LLM responses to feel personal by grounding them in the
    user's actual confirmed trait labels.
    """

    def __init__(self):
        self.llm = OllamaProvider()

    def score_genericness(self, response: str) -> float:
        response_lower = response.lower()
        hits = sum(1 for m in _GENERIC_MARKERS if m in response_lower)
        return min(hits / 3.0, 1.0)

    def personalize_response(self, raw_response: str, user_traits: list, user_name: str = None) -> str:
        try:
            if not user_traits:
                return raw_response

            trait_labels = [
                t.get("label", "") for t in user_traits
                if t.get("label") and t.get("is_confirmed", True)
            ][:6]

            if not trait_labels:
                return raw_response

            name_line = f"The user's name is {user_name}." if user_name else ""

            prompt = f"""You are refining a response for a creative identity platform.

{name_line}
The user's confirmed identity traits are: {', '.join(trait_labels)}

Original response:
"{raw_response}"

Rewrite this response so it:
1. References at least one of the user's specific traits by name
2. Feels personal and tailored, not like a generic chatbot reply
3. Keeps the same core message and length
4. Ends with a specific question about one of their traits

Return only the rewritten response.
"""
            refined = self.llm.generate(prompt)
            return refined if refined and len(refined) > 20 else raw_response

        except Exception as e:
            logger.error(f"Personalization failed: {str(e)}")
            return raw_response


personalization_service = PersonalizationService()
