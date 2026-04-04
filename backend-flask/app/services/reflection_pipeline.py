import logging
import requests
import os

logger = logging.getLogger(__name__)


class ReflectionPipeline:
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
        self.model = os.getenv("OLLAMA_MODEL", "gemma:2b")
        logger.info("ReflectionPipeline initialized")

    # =========================
    # INITIAL PROMPT
    # =========================
    def build_initial_prompt(self, artwork):
        return f"""
You are an AI assistant helping a user reflect on their artwork.

Artwork Title: {artwork.title}
Artwork Description: {artwork.description or "N/A"}
Artwork Type: {artwork.artwork_type}

Write a thoughtful, personal reflection about this artwork.
Keep it emotional, introspective, and meaningful.
"""

    # =========================
    # REFINEMENT PROMPT (NEW)
    # =========================
    def build_refinement_prompt(self, artwork, previous_reflection, user_input):
        return f"""
You are refining an existing reflection based on user feedback.

Artwork Title: {artwork.title}
Artwork Description: {artwork.description or "N/A"}
Artwork Type: {artwork.artwork_type}

Previous Reflection:
{previous_reflection}

User Feedback:
{user_input}

Rewrite the reflection by improving it using the user's feedback.

Rules:
- Keep meaning from previous reflection
- Apply user's feedback clearly
- Make it natural and human

Return ONLY the improved reflection.
"""

    # =========================
    # LLM CALL
    # =========================
    def generate(self, prompt):
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                }
            )

            data = response.json()
            return data.get("response", "")

        except Exception as e:
            logger.error(f"LLM call failed: {str(e)}")
            return None