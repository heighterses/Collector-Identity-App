import logging
from app.services.llm_provider import llm_provider

logger = logging.getLogger(__name__)

DEFAULT_PROMPTS = [
    "What does my art say about me?",
    "Which of my traits surprised you most?",
    "How has my identity changed over time?",
    "What should I create next?"
]


class SuggestedPromptsService:
    def __init__(self):
        self.llm = llm_provider

    def generate_prompts(self, last_assistant_message: str, identity_summary: str, count: int = 4) -> list:
        try:
            prompt = f"""You are helping a user explore their creative identity through conversation.

The assistant just said:
"{last_assistant_message}"

The user's identity summary:
"{identity_summary}"

Generate exactly {count} short follow-up questions the user might want to ask next.
Rules:
- Each must be under 10 words
- Must relate to identity, artwork, or creative self-exploration
- Must feel natural and conversational, not robotic
- Return only the questions, one per line, no numbering or bullets
"""
            raw = self.llm.generate(prompt)
            lines = [l.strip().lstrip('•-0123456789. ') for l in raw.split('\n') if l.strip()]
            prompts = [l for l in lines if len(l) > 5][:count]

            return prompts if len(prompts) >= 2 else DEFAULT_PROMPTS[:count]

        except Exception as e:
            logger.error(f"Suggested prompts generation failed: {str(e)}")
            return DEFAULT_PROMPTS[:count]


suggested_prompts_service = SuggestedPromptsService()
