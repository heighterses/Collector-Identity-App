import logging
from app.services.ollama_provider import OllamaProvider

logger = logging.getLogger(__name__)


class ReflectionPipeline:
    def __init__(self):
        self.provider = OllamaProvider()
        logger.info("ReflectionPipeline initialized")

    # ==========================================================
    # INITIAL PROMPT BUILDER
    # ==========================================================
    def build_initial_prompt(self, artwork):
        """
        Build prompt depending on artwork type.
        """

        if artwork.artwork_type == "image":
            return self._build_image_prompt(artwork)

        elif artwork.artwork_type == "text":
            return self._build_text_prompt(artwork)

        else:
            raise ValueError(f"Unsupported artwork_type: {artwork.artwork_type}")

    # ==========================================================
    # IMAGE REFLECTION PROMPT
    # ==========================================================
    def _build_image_prompt(self, artwork):
        return f"""
You are an art reflection assistant.

An artist has uploaded an image artwork.

Title: {artwork.title}
Description: {artwork.description or "No description provided."}

Write a thoughtful reflection about what this artwork could represent,
the emotions it might evoke, and possible interpretations.

Keep it insightful but concise.
"""

    # ==========================================================
    # TEXT REFLECTION PROMPT
    # ==========================================================
    def _build_text_prompt(self, artwork):
        return f"""
You are an art reflection assistant.

An artist has written the following text-based artwork.

Title: {artwork.title}

Content:
{artwork.description or "No text provided."}

Write a thoughtful reflection on this piece.
Discuss themes, emotions, and interpretation.

Keep it insightful but concise.
"""

    # ==========================================================
    # GENERATE USING LLM
    # ==========================================================
    def generate(self, prompt):
        """
        Send prompt to Ollama and return generated text.
        """
        try:
            response = self.provider.generate(prompt)
            return response

        except Exception as e:
            logger.error(f"LLM generation failed: {str(e)}")
            return None
