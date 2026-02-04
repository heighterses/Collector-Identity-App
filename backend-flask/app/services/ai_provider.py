import os
from openai import OpenAI
from typing import List, Dict


class OpenAIProvider:
    def __init__(self):
        api_key = os.getenv("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")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")

        self.client = OpenAI(api_key=api_key)

    def generate_reflection(
        self,
        messages: List[Dict],
        model: str = "gpt-4o-mini",
        temperature: float = 0.7,
        max_tokens: int = 300
    ) -> str:
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return response.choices[0].message.content.strip()
