import os
import requests


class OllamaProvider:
    """
    LLM provider backed by a local Ollama server.

    generate() stays backward-compatible with the original text-only signature
    (`generate(prompt)`), and now also accepts:
      - images:  list of base64 strings — when present, the configured vision
                 model is used so the model can actually see them.
      - options: passed through to Ollama (e.g. {"num_predict": 400}).
      - timeout: per-call override of the default request timeout.

    This keeps every caller provider-agnostic: they just pass images or not.
    Raises RuntimeError on failure (unchanged contract for existing callers).
    """

    def __init__(self, model=None):
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
        self.text_model = model or os.getenv("OLLAMA_MODEL", "gemma:2b")
        self.vision_model = os.getenv("OLLAMA_VISION_MODEL", "gemma3:4b")
        self.default_timeout = int(os.getenv("OLLAMA_TIMEOUT", "300"))
        # How long Ollama keeps the model loaded in memory between requests —
        # keeps it warm so subsequent calls skip the reload cost.
        self.keep_alive = os.getenv("OLLAMA_KEEP_ALIVE", "5m")
        # Back-compat: some callers referenced `.model`
        self.model = self.text_model

    def generate(self, prompt: str, images=None, options=None, timeout=None) -> str:
        model = self.vision_model if images else self.text_model
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "keep_alive": self.keep_alive,
        }
        if images:
            payload["images"] = images
        if options:
            payload["options"] = options

        try:
            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=timeout or self.default_timeout,
            )
            response.raise_for_status()
            return response.json().get("response", "").strip()
        except Exception as e:
            raise RuntimeError(f"Ollama error: {str(e)}")
