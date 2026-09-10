import os


class OpenAIProvider:
    """
    LLM provider backed by the OpenAI API. Dormant unless AI_PROVIDER=openai.

    The `openai` package is imported lazily inside the call, so this module never
    breaks imports when the dependency isn't installed or the provider isn't in
    use. It mirrors OllamaProvider.generate(prompt, images=None, options=None,
    timeout=None): `images` are base64 strings (same as the Ollama path) sent as
    data-URL image parts on a vision-capable model.

    To switch the whole app to OpenAI later:
      1) pip install openai
      2) set AI_PROVIDER=openai and OPENAI_API_KEY (and optionally OPENAI_MODEL /
         OPENAI_VISION_MODEL) in the environment.
    Nothing else changes.
    """

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.text_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self.vision_model = os.getenv("OPENAI_VISION_MODEL", "gpt-4o")
        self.default_timeout = int(os.getenv("OPENAI_TIMEOUT", "120"))

    def _client(self):
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")
        try:
            from openai import OpenAI
        except ImportError as e:
            raise RuntimeError("openai package not installed (pip install openai)") from e
        return OpenAI(api_key=self.api_key, timeout=self.default_timeout)

    def generate(self, prompt: str, images=None, options=None, timeout=None) -> str:
        client = self._client()
        model = self.vision_model if images else self.text_model

        # Multimodal message: the prompt text plus any images as data URLs.
        content = [{"type": "text", "text": prompt}]
        for b64 in (images or []):
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
            })

        kwargs = {}
        if options and "num_predict" in options:
            # Map Ollama's option name to the OpenAI equivalent.
            kwargs["max_tokens"] = options["num_predict"]

        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": content}],
                **kwargs,
            )
            return (resp.choices[0].message.content or "").strip()
        except Exception as e:
            raise RuntimeError(f"OpenAI error: {str(e)}")
