from app.services.reflection_pipeline import ReflectionPipeline


class ReflectionService:
    """
    High-level service that orchestrates reflection generation.
    This acts as the boundary between routes and ML/LLM logic.
    """

    def __init__(self):
        # Initialize the pipeline once (safe for Flask app lifetime)
        self.pipeline = ReflectionPipeline()

    def generate_reflection(
        self,
        artwork_text: str | None = None,
        image_url: str | None = None
    ) -> dict:
        """
        Generate a reflection for an artwork.

        Either artwork_text OR image_url can be provided.
        Both together are also supported.

        Returns:
            dict: reflection result
        """

        if not artwork_text and not image_url:
            raise ValueError("Either artwork_text or image_url must be provided")

        return self.pipeline.run(
            artwork_text=artwork_text,
            image_url=image_url
        )


# ✅ Singleton instance used across the app
reflection_service = ReflectionService()
