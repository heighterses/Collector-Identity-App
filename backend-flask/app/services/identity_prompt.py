def build_identity_prompt(reflection: str):
    return f"""
You are an expert identity analyst.

From the reflection below, extract structured identity traits.

Return ONLY valid JSON.

FORMAT:
{{
  "core_identity": "...",
  "traits": ["...", "..."],
  "emotions": ["...", "..."],
  "themes": ["...", "..."]
}}

REFLECTION:
{reflection}
"""