import requests
import logging

from app.services.identity_prompt import build_identity_prompt
from app.services.identity_parser import parse_identity_response
from app.services.conversation_service import conversation_service  # 🔥 NEW

from app.models.identity import IdentityTemplate, IdentityTrait
from app import db

logger = logging.getLogger(__name__)


class IdentityService:

    def __init__(self):
        self.ollama_url = "http://host.docker.internal:11434/api/generate"

    # ==========================================================
    # ✅ CORE GENERATION (NOW CONTEXT-AWARE)
    # ==========================================================
    def _generate_identity_data(self, reflection: str):
        # 🔥 STEP 1: Build base prompt
        base_prompt = build_identity_prompt(reflection)

        # 🔥 STEP 2: Build context
        context = conversation_service.build_context(
            reflection=reflection
        )

        # 🔥 STEP 3: Enrich prompt
        prompt = conversation_service.enrich_prompt(base_prompt, context)

        response = requests.post(
            self.ollama_url,
            json={
                "model": "gemma:2b",
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )

        data = response.json()
        raw_output = data.get("response", "")

        return parse_identity_response(raw_output)

    # ==========================================================
    # 🔥 APPLY USER EDIT (AI LOGIC)
    # ==========================================================
    def apply_user_edit(self, identity_data, user_input, intent):
        try:
            traits = identity_data.get("traits", [])

            if intent == "REJECT":
                traits = [t for t in traits if user_input.lower() not in t.lower()]

            elif intent == "ADD":
                traits.append(user_input)

            elif intent == "UPDATE":
                traits = [
                    user_input if user_input.split()[0] in t else t
                    for t in traits
                ]

            return {
                **identity_data,
                "traits": traits
            }

        except Exception as e:
            logger.error(f"Edit application failed: {str(e)}")
            return identity_data

    # ==========================================================
    # 🔥 MAIN GENERATION (WITH VERSIONING)
    # ==========================================================
    def generate_for_reflection(self, user_id: str, artwork_id: str, reflection_text: str):
        try:
            identity_data = self._generate_identity_data(reflection_text)

            # 🔥 VERSIONING
            last = IdentityTemplate.query.filter_by(user_id=user_id)\
                .order_by(IdentityTemplate.created_at.desc())\
                .first()

            version = (last.version + 1) if hasattr(last, 'version') and last else 1

            # 🔥 REMOVE OLD (ENSURE ONE PER ARTWORK)
            old_template = IdentityTemplate.query.filter_by(artwork_id=artwork_id).first()
            if old_template:
                db.session.delete(old_template)
                db.session.commit()

            template = IdentityTemplate(
                user_id=user_id,
                artwork_id=artwork_id,
                version=version
            )

            db.session.add(template)
            db.session.flush()

            position = 0

            # 🔹 CORE IDENTITY
            if identity_data.get("core_identity"):
                db.session.add(IdentityTrait(
                    template_id=template.id,
                    label="Core Identity",
                    value=identity_data["core_identity"],
                    trait_type="text",
                    position=position
                ))
                position += 1

            # 🔹 TRAITS
            for t in identity_data.get("traits", []):
                db.session.add(IdentityTrait(
                    template_id=template.id,
                    label=t,
                    value="1.0",
                    trait_type="chip",
                    position=position
                ))
                position += 1

            # 🔹 EMOTIONS
            for e in identity_data.get("emotions", []):
                db.session.add(IdentityTrait(
                    template_id=template.id,
                    label=e,
                    value="1.0",
                    trait_type="chip",
                    position=position
                ))
                position += 1

            # 🔹 THEMES
            for th in identity_data.get("themes", []):
                db.session.add(IdentityTrait(
                    template_id=template.id,
                    label=th,
                    value="1.0",
                    trait_type="chip",
                    position=position
                ))
                position += 1

            db.session.commit()

            return template

        except Exception as e:
            logger.error(f"Identity generation failed: {str(e)}")

            return {
                "error": str(e),
                "core_identity": "Unavailable",
                "traits": [],
                "emotions": [],
                "themes": []
            }

    # ==========================================================
    # BACKWARD SAFE
    # ==========================================================
    def generate_identity(self, reflection: str, user_id: str = None, artwork_id: str = None):
        return self.generate_for_reflection(user_id, artwork_id, reflection)

    # ==========================================================
    # FETCH
    # ==========================================================
    def get_user_identities(self, user_id: str):
        templates = IdentityTemplate.query.filter_by(user_id=user_id).all()
        return [t.to_dict() for t in templates]


identity_service = IdentityService()