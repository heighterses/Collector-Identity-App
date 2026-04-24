import requests


class OllamaProvider:
    def __init__(self, model="gemma:2b"):
        import os
        self.model = os.getenv("OLLAMA_MODEL", model)
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    def generate(self, prompt: str) -> str:
        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                },
                timeout=120
            )

            response.raise_for_status()
            return response.json().get("response", "").strip()

        except Exception as e:
            raise RuntimeError(f"Ollama error: {str(e)}")
