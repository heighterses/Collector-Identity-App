import logging
from datetime import datetime
from app.services.reflection_pipeline import ReflectionPipeline

logger = logging.getLogger(__name__)


class ReflectionService:
    def __init__(self):
        self.pipeline = ReflectionPipeline()
        logger.info("ReflectionService initialized")

    # ==========================================================
    # PRIMARY METHOD USED WHEN ARTWORK IS CREATED
    # ==========================================================
    def generate_initial_reflection_sync(self, artwork):
        """
        Generate a reflection synchronously when artwork is created.
        This is the method your artwork route expects.
        """

        try:
            logger.info(f"Generating reflection for artwork {artwork.id}")

            # Build prompt
            prompt = self.pipeline.build_initial_prompt(artwork)

            # Call LLM
            reflection_text = self.pipeline.generate(prompt)

            if not reflection_text:
                raise ValueError("Empty reflection returned from model")

            logger.info("Reflection generated successfully")

            return {
                "content": reflection_text,
                "status": "completed",
                "generated_at": datetime.utcnow()
            }

        except Exception as e:
            logger.error(f"Reflection generation failed: {str(e)}")
            return None

    # ==========================================================
    # OPTIONAL: Manual regeneration (if you add button later)
    # ==========================================================
    def regenerate_reflection_sync(self, artwork, previous_reflection=None):
        """
        Regenerate reflection (if you later support retry button).
        """

        try:
            logger.info(f"Regenerating reflection for artwork {artwork.id}")

            prompt = self.pipeline.build_regeneration_prompt(
                artwork,
                previous_reflection
            )

            reflection_text = self.pipeline.generate(prompt)

            if not reflection_text:
                raise ValueError("Empty reflection returned from model")

            return {
                "content": reflection_text,
                "status": "completed",
                "generated_at": datetime.utcnow()
            }

        except Exception as e:
            logger.error(f"Reflection regeneration failed: {str(e)}")
            return None


# Global instance (important — your routes import this)
reflection_service = ReflectionService()
