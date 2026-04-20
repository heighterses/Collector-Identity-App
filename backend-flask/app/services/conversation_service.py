import logging

logger = logging.getLogger(__name__)


class ConversationService:
    """
    Lightweight context builder for AI interactions.
    This does NOT replace your LLM — it enhances prompts.
    """

    def build_context(self, identity=None, reflection=None, patterns=None):
        try:
            context_parts = []

            if identity:
                context_parts.append(f"Current Identity:\n{identity}")

            if reflection:
                context_parts.append(f"Latest Reflection:\n{reflection}")

            if patterns:
                traits = patterns.get("traits", [])
                emotions = patterns.get("emotions", [])
                themes = patterns.get("themes", [])

                context_parts.append(
                    f"Patterns:\nTraits: {traits}\nEmotions: {emotions}\nThemes: {themes}"
                )

            return "\n\n".join(context_parts)

        except Exception as e:
            logger.error(f"Context build failed: {str(e)}")
            return ""

    def enrich_prompt(self, base_prompt, context):
        """
        Inject context into prompt before sending to LLM
        """
        if not context:
            return base_prompt

        return f"""
        Use the following context to improve the response:

        {context}

        Task:
        {base_prompt}
        """


conversation_service = ConversationService()