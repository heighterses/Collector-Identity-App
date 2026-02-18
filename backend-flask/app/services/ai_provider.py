import os
import requests


class AIProvider:
    """
    AI Provider using local Ollama server.
    Works with models like: gemma:2b, llama3.2:1b, mistral, etc.
    """

    def __init__(self):
        # Default Ollama URL
        # If running backend in Docker on Windows:
        # use host.docker.internal
        self.base_url = os.getenv(
            "OLLAMA_BASE_URL",
            "http://host.docker.internal:11434"
        )

        # Model name (set this in .env if needed)
        self.model = os.getenv("OLLAMA_MODEL", "gemma:2b")

    def generate(self, prompt: str) -> str:
        """
        Send prompt to Ollama and return generated text.
        """

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
            data = response.json()

            return data.get("response", "").strip()

        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Ollama request failed: {str(e)}")
