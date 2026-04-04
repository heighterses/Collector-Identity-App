import logging
from datetime import datetime
from app.services.reflection_pipeline import ReflectionPipeline

logger = logging.getLogger(__name__)


class ReflectionService:
    def __init__(self):
        self.pipeline = ReflectionPipeline()
        logger.info("ReflectionService initialized")

    # =========================
    # INITIAL REFLECTION
    # =========================
    def generate_initial_reflection_sync(self, artwork):
        try:
            logger.info(f"Generating reflection for artwork {artwork.id}")

            prompt = self.pipeline.build_initial_prompt(artwork)
            result = self.pipeline.generate(prompt)

            if not result:
                raise ValueError("Empty response")

            return {
                "content": result,
                "type": "initial",
                "generated_at": datetime.utcnow()
            }

        except Exception as e:
            logger.error(f"Reflection generation failed: {str(e)}")
            return None

    # =========================
    # REFINE REFLECTION (NEW)
    # =========================
    def refine_reflection(self, artwork, previous_reflection, user_input):
        try:
            logger.info(f"Refining reflection for artwork {artwork.id}")

            prompt = self.pipeline.build_refinement_prompt(
                artwork,
                previous_reflection,
                user_input
            )

            result = self.pipeline.generate(prompt)

            if not result:
                raise ValueError("Empty response")

            return {
                "content": result,
                "type": "refined"
            }

        except Exception as e:
            logger.error(f"Refinement failed: {str(e)}")
            return None


# GLOBAL INSTANCE
reflection_service = ReflectionService()