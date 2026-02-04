from typing import Dict
from app.services.ai_provider import OpenAIProvider
from app.services.prompt_builder import (
    ArtworkContext,
    build_system_prompt,
    build_user_prompt,
)


class ReflectionPipeline:
    def __init__(self):
        self.provider = OpenAIProvider()

    def run(self, context: ArtworkContext) -> Dict:
        messages = [
            {"role": "system", "content": build_system_prompt()},
            {"role": "user", "content": build_user_prompt(context)},
        ]

        reflection_text = self.provider.generate_reflection(messages)

        return {
            "reflection": reflection_text,
            "model": "gpt-4o-mini",
        }
