import logging
import re

logger = logging.getLogger(__name__)

_OFF_TOPIC = [
    r'\b(weather|sports|politics|news|stocks|crypto|bitcoin|recipe|cook|gaming|movie|film)\b',
    r'\b(write me a|generate code|help me code|debug this|programming)\b',
    r'\b(who is|what is the capital|history of)\b',
]

_REDIRECT = (
    "I'm here to help you explore your creative identity through your artwork. "
    "Let's stay focused on what your art reveals about you. "
    "What would you like to understand about yourself today?"
)

_GENERIC_PHRASES = [
    "as an ai", "i cannot", "i don't have feelings",
    "i am a language model", "as a chatbot"
]


class ConversationGuardrails:
    """
    Pre-filters user input and post-filters LLM output to keep
    the chat focused on identity exploration.
    """

    def is_off_topic(self, text: str) -> bool:
        text_lower = text.lower()
        return any(re.search(p, text_lower) for p in _OFF_TOPIC)

    def enforce_focus(self, user_message: str) -> dict:
        if self.is_off_topic(user_message):
            return {"allowed": False, "redirect": _REDIRECT}
        return {"allowed": True, "redirect": None}

    def validate_response(self, response: str, identity_context: str = "") -> str:
        if not response or len(response.strip()) < 20:
            return (
                "I'm still thinking about that. Could you tell me more "
                "about what you felt when creating your artwork?"
            )

        response_lower = response.lower()
        for phrase in _GENERIC_PHRASES:
            if phrase in response_lower:
                return (
                    "Let me focus on what matters — your creative journey. "
                    "Based on what I know about you, what aspect of your identity "
                    "would you like to explore further?"
                )

        return response


conversation_guardrails = ConversationGuardrails()
