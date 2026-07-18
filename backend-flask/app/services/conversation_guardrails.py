import logging
import re

logger = logging.getLogger(__name__)

_OFF_TOPIC = [
    r'\b(weather|sports|politics|news|stocks|crypto|bitcoin|recipe|cook|gaming|movie|film)\b',
    r'\b(write me|make me|create me|build me|generate code|help me code|debug this|programming)\b',
    r'\b(who is|what is the capital|history of)\b',
    # Art-history / biographical trivia — named artists and movements, plus
    # "tell me about" only when paired with biography framing. A bare "tell
    # me about" is deliberately NOT matched: users legitimately say "tell me
    # about my patterns" / "tell me about my taste" and that's on-mission.
    r'\b(van gogh|picasso|monet|da vinci|leonardo da vinci|rembrandt|dali|warhol|matisse|cezanne|renoir)\b',
    r'\b(impressionism|impressionist|cubism|cubist|renaissance|baroque|surrealism|surrealist|art movement|art history)\b',
    r"\btell me about\b.*\b(life|biography|born|died|movement)\b",
    # Personal advice-seeking — off-mission, the system doesn't give life
    # advice. Anchored to life-domain words rather than bare "should i" /
    # "can you help me with": those bare phrases broke the app's own
    # "What should I create next?" suggested prompt and "Can you help me
    # with understanding my identity?", both legitimately on-mission.
    r"\b(should i|what should i do|can you help me with|any advice)\b.*\b(job|career|relationship|breakup|break up|marry|marriage|divorce|move (out|to)|resign|quit|money|finances)\b",
    r'\bwhat would you do if\b',
    # Small talk / greetings — full-phrase only. Bare "hello"/"hi" is
    # deliberately excluded: those commonly open genuine on-topic messages
    # (e.g. "Hi, I added a new piece today") and redirecting on the greeting
    # alone would derail real engagement.
    r"\b(how are you|what'?s up|nice to meet you|good morning|good afternoon|good evening)\b",
    # Factual / time lookups
    r"\b(what time|what'?s the date|what'?s today'?s date|who won|what year is it)\b",
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
