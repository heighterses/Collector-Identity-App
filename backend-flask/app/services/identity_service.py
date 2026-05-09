import requests
import logging

from app.services.identity_prompt import build_identity_prompt
from app.services.identity_parser import parse_identity_response
from app.services.conversation_service import conversation_service

# 🔥 NEW ML SERVICES (ADDED ONLY)
from app.services.embedding_service import embedding_service
from app.services.trait_extraction_service import trait_extraction_service

from app.models.identity import IdentityTemplate, IdentityTrait
from app.models.edit_event import EditEvent

from app import db

logger = logging.getLogger(__name__)


class IdentityService:

    def __init__(self):
        import os
        self.ollama_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434") + "/api/generate"
        self.model = os.getenv("OLLAMA_MODEL", "gemma:2b")

    # ==========================================================
    # ✅ CORE GENERATION (UNCHANGED)
    # ==========================================================
    def _generate_identity_data(self, reflection: str):
        base_prompt = build_identity_prompt(reflection)

        context = conversation_service.build_context(
            reflection=reflection
        )

        prompt = conversation_service.enrich_prompt(base_prompt, context)

        response = requests.post(
            self.ollama_url,
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )

        data = response.json()
        raw_output = data.get("response", "")

        return parse_identity_response(raw_output)

    # ==========================================================
    # 🔥 NEW: USER PREFERENCE SCORING (ADDED)
    # ==========================================================
    def _get_user_preferences(self, user_id):
        events = EditEvent.query.filter_by(user_id=user_id).all()

        scores = {}

        for e in events:
            label = e.trait_label.lower()

            if label not in scores:
                scores[label] = 0

            if e.action == "reject":
                scores[label] -= 1
            elif e.action == "add":
                scores[label] += 1
            elif e.action == "update":
                scores[label] += 0.5

        return scores

    # ==========================================================
    # 🔥 APPLY USER EDIT (UNCHANGED + TRACKING ADDED)
    # ==========================================================
    def apply_user_edit(self, identity_data, user_input, intent, user_id):
        try:
            traits = identity_data.get("traits", [])

            # 🔥 ONLY ADDITION (tracking)
            db.session.add(EditEvent(
                user_id=user_id,
                trait_label=user_input,
                action=intent.lower()
            ))

            if intent == "REJECT":
                traits = [t for t in traits if user_input.lower() not in t.lower()]

            elif intent == "ADD":
                traits.append(user_input)

            elif intent == "UPDATE":
                traits = [
                    user_input if user_input.split()[0] in t else t
                    for t in traits
                ]

            db.session.commit()

            return {
                **identity_data,
                "traits": traits
            }

        except Exception as e:
            logger.error(f"Edit application failed: {str(e)}")
            return identity_data

    # ==========================================================
    # 🔥 ML TRAIT EXTRACTION (EXTENDED, NOT REPLACED)
    # ==========================================================
    def _extract_ml_traits(self, reflection_text, user_id):
        try:
            embedding = embedding_service.embed(reflection_text)

            ml_traits = trait_extraction_service.extract_traits(
                embedding,
                embedding_service
            )

            # 🔥 ADDITIVE (NOT REPLACING YOUR LOGIC)
            preferences = self._get_user_preferences(user_id)

            adjusted = []
            for label, score in ml_traits:
                pref = preferences.get(label.lower(), 0)
                adjusted_score = score + (0.1 * pref)

                if adjusted_score > 0.3:
                    adjusted.append((label, adjusted_score))

            return adjusted

        except Exception as e:
            logger.error(f"ML trait extraction failed: {str(e)}")
            return []

    # ==========================================================
    # 🔥 MAIN GENERATION (ONLY EXTENDED)
    # ==========================================================
    def generate_for_reflection(self, user_id: str, artwork_id: str, reflection_text: str, user_role: str = None):
        try:
            # 🔹 EXISTING
            identity_data = self._generate_identity_data(reflection_text)

            # 🔹 ML (ADDED)
            ml_traits = self._extract_ml_traits(reflection_text, user_id)

            # 🔥 NEW: EMBEDDING (ADDED ONLY)
            combined_text = reflection_text + " " + (identity_data.get("core_identity") or "")
            if user_role:
                combined_text += f" role:{user_role}"
            embedding = embedding_service.embed(combined_text)

            # 🔹 EXISTING VERSIONING
            last = IdentityTemplate.query.filter_by(user_id=user_id)\
                .order_by(IdentityTemplate.created_at.desc())\
                .first()

            version = (last.version + 1) if hasattr(last, 'version') and last else 1

            # 🔹 EXISTING DELETE
            old_template = IdentityTemplate.query.filter_by(artwork_id=artwork_id).first()
            if old_template:
                db.session.delete(old_template)
                db.session.commit()

            # 🔥 ONLY CHANGE: added embedding field
            template = IdentityTemplate(
                user_id=user_id,
                artwork_id=artwork_id,
                version=version,
                embedding=embedding
            )

            db.session.add(template)
            db.session.flush()

            position = 0

            # 🔹 CORE (SANITIZED)
            core_val = identity_data.get("core_identity")
            if core_val and str(core_val).strip().lower() not in ("none", "", "null", "n/a"):
                db.session.add(IdentityTrait(
                    template_id=template.id,
                    label="Core Identity",
                    value=str(core_val).strip(),
                    trait_type="text",
                    position=position
                ))
                position += 1

            # 🔹 LLM TRAITS (SANITIZED)
            for t in identity_data.get("traits", []):
                if not t or str(t).strip().lower() in ("none", "", "null"):
                    continue
                db.session.add(IdentityTrait(
                    template_id=template.id,
                    label=str(t).strip(),
                    value="1.0",
                    trait_type="chip",
                    position=position
                ))
                position += 1

            # 🔥 ML TRAITS (ADDED BLOCK ONLY)
            for label, score in ml_traits:
                db.session.add(IdentityTrait(
                    template_id=template.id,
                    label=f"{label} (ML)",
                    value=str(round(score, 2)),
                    trait_type="slider",
                    position=position
                ))
                position += 1

            # 🔹 EMOTIONS (SANITIZED)
            for e in identity_data.get("emotions", []):
                if not e or str(e).strip().lower() in ("none", "", "null"):
                    continue
                db.session.add(IdentityTrait(
                    template_id=template.id,
                    label=str(e).strip(),
                    value="1.0",
                    trait_type="chip",
                    position=position
                ))
                position += 1

            # 🔹 THEMES (SANITIZED)
            for th in identity_data.get("themes", []):
                if not th or str(th).strip().lower() in ("none", "", "null"):
                    continue
                db.session.add(IdentityTrait(
                    template_id=template.id,
                    label=str(th).strip(),
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
    # BACKWARD SAFE (UNCHANGED)
    # ==========================================================
    def generate_identity(self, reflection: str, user_id: str = None, artwork_id: str = None):
        return self.generate_for_reflection(user_id, artwork_id, reflection)

    # ==========================================================
    # FETCH (UNCHANGED)
    # ==========================================================
    def get_user_identities(self, user_id: str):
        templates = IdentityTemplate.query.filter_by(user_id=user_id).all()
        return [t.to_dict() for t in templates]


identity_service = IdentityService()