import requests
from app.services.identity_parser import parse_identity_response

class IdentityRefinementService:

    def __init__(self):
        self.ollama_url = "http://host.docker.internal:11434/api/generate"

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
            response = requests.post(
                self.ollama_url,
                json={
                    "model": "gemma:2b",
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30
            )

            data = response.json()
            return parse_identity_response(data.get("response", ""))

        except Exception as e:
            return {"error": str(e)}


identity_refinement_service = IdentityRefinementService()