import logging
from datetime import datetime
from app.services.reflection_pipeline import ReflectionPipeline
from app.models.reflection import Reflection
from app import db

logger = logging.getLogger(__name__)


class ReflectionService:
    def __init__(self):
        self.pipeline = ReflectionPipeline()

    # ==========================================================
    # ✅ GENERATE / REGENERATE
    # ==========================================================
    def generate_for_artwork(self, artwork):
        try:
            prompt = self.pipeline.build_initial_prompt(artwork)
            result = self.pipeline.generate(prompt)

            if not result:
                raise ValueError("Empty response")

            reflection = Reflection.query.filter_by(artwork_id=artwork.id).first()

            if reflection:
                reflection.content = result
                reflection.type = "regenerated"
                reflection.updated_at = datetime.utcnow()
            else:
                reflection = Reflection(
                    artwork_id=artwork.id,
                    content=result,
                    type="initial"
                )
                db.session.add(reflection)

            db.session.commit()
            return reflection

        except Exception as e:
            logger.error(f"Reflection generation failed: {str(e)}")
            return None

    # ==========================================================
    # 🔥 FIXED: REFINE REFLECTION
    # ==========================================================
    def refine_reflection(self, artwork, reflection, user_input):
        try:
            prompt = self.pipeline.build_refinement_prompt(
                artwork=artwork,
                previous_reflection=reflection.content,
                user_input=user_input
            )

            result = self.pipeline.generate(prompt)

            if not result:
                raise ValueError("Empty response")

            # ✅ UPDATE EXISTING REFLECTION
            reflection.content = result
            reflection.type = "refined"
            reflection.updated_at = datetime.utcnow()

            db.session.commit()

            return reflection

        except Exception as e:
            logger.error(f"Refinement failed: {str(e)}")
            return None


reflection_service = ReflectionService()