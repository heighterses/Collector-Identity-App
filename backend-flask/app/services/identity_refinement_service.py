from app.services.identity_parser import parse_identity_response
from app.services.llm_provider import llm_provider

class IdentityRefinementService:

    def __init__(self):
        import os
        self.ollama_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434") + "/api/generate"
        self.model = os.getenv("OLLAMA_MODEL", "gemma:2b")

    def refine_identity(self, identity: dict, user_input: str):
        prompt = f"""
You are refining a user's identity.

CURRENT IDENTITY:
{identity}

USER INPUT:
{user_input}

Update the identity accordingly.

Return ONLY JSON in same format:
{{
  "core_identity": "...",
  "traits": ["..."],
  "emotions": ["..."],
  "themes": ["..."]
}}
"""

        try:
            return parse_identity_response(llm_provider.generate(prompt))

        except Exception as e:
            return {"error": str(e)}


identity_refinement_service = IdentityRefinementService()