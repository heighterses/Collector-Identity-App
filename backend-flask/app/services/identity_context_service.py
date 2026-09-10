import logging

from app.services.identity_prompt import identity_stage

logger = logging.getLogger(__name__)


class IdentityContextService:
    """
    Builds a rich system context string from the user's identity versions
    so the LLM always responds with awareness of who this user is.
    """

    def build_system_context(
        self,
        identity_templates: list,
        identity_versions: list = None,
        active_artwork: dict = None,
    ) -> str:
        try:
            parts = []

            if not identity_templates:
                parts.append("The user has not yet established an identity profile.")
                if active_artwork:
                    parts.append(self._format_active_artwork(active_artwork))
                return "\n".join(parts)

            latest = identity_templates[-1]
            latest_traits = latest.get("traits", [])

            core = next(
                (t["value"] for t in latest_traits if t.get("trait_type") == "text" and t.get("value")),
                None
            )
            if core:
                parts.append(f"Core identity: {core}")

            # Aggregate confirmed chip/slider traits across ALL templates, not just
            # the latest one — a user's earlier confirmed traits shouldn't vanish
            # just because their most recent artwork's template happens to only
            # carry a text trait (M3-11 audit).
            seen = set()
            trait_labels = []
            for tpl in identity_templates:
                for t in tpl.get("traits", []):
                    if t.get("trait_type") in ("chip", "slider") and t.get("is_confirmed", True):
                        label = t.get("label")
                        if label and label not in seen:
                            seen.add(label)
                            trait_labels.append(label)
            if trait_labels:
                parts.append(f"Key traits: {', '.join(trait_labels[:8])}")

            # Traits the AI has suggested but the user hasn't confirmed yet — a
            # direct nudge toward the edit-discipline loop instead of silence
            # (M3-11 audit: this was previously the one moment chat had nothing
            # to work with, right when a confirmation nudge mattered most).
            pending_seen = set()
            pending_labels = []
            for tpl in identity_templates:
                for t in tpl.get("traits", []):
                    if t.get("trait_type") in ("chip", "slider") and not t.get("is_confirmed", True):
                        label = t.get("label")
                        if label and label not in pending_seen:
                            pending_seen.add(label)
                            pending_labels.append(label)
            if pending_labels:
                parts.append(
                    "Traits the AI has suggested but the user hasn't confirmed yet "
                    f"(gently invite them to review, don't assume these are settled): {', '.join(pending_labels[:5])}"
                )

            parts.append(f"Identity version: {latest.get('version', 1)}")
            parts.append(f"Total artworks analysed: {len(identity_templates)}")

            # Round-1 brief, Issue 5: the confidence of the language should match
            # how much evidence exists. Tell the model the stage so it doesn't
            # over-claim a fixed identity from very few artworks.
            stage_label, stage_guidance = identity_stage(len(identity_templates))
            parts.append(f"Identity maturity stage: {stage_label}. {stage_guidance}")

            if identity_versions and len(identity_versions) >= 2:
                first_v = identity_versions[0]
                last_v = identity_versions[-1]

                first_traits = {t["label"] for t in first_v.get("snapshot_json", {}).get("traits", [])}
                last_traits = {t["label"] for t in last_v.get("snapshot_json", {}).get("traits", [])}

                emerged = list(last_traits - first_traits)[:3]
                faded = list(first_traits - last_traits)[:3]

                if emerged:
                    parts.append(f"Traits that have emerged: {', '.join(emerged)}")
                if faded:
                    parts.append(f"Traits that have faded: {', '.join(faded)}")

            if active_artwork:
                parts.append(self._format_active_artwork(active_artwork))

            return "\n".join(parts)

        except Exception as e:
            logger.error(f"Identity context build failed: {str(e)}")
            return ""

    def _format_active_artwork(self, active_artwork: dict) -> str:
        title = active_artwork.get("title") or "Untitled"
        excerpt = (active_artwork.get("reflection_excerpt") or "").strip()
        if excerpt:
            return f'Currently discussing artwork: "{title}" — their reflection said: "{excerpt}"'
        return f'Currently discussing artwork: "{title}" (no reflection generated yet)'

    def build_chat_system_prompt(self, identity_context: str) -> str:
        base = (
            "You are a deeply empathetic identity companion for a creative platform "
            "called Collector Identity. Your role is to help users understand themselves "
            "through their artwork.\n\n"
            "Guidelines:\n"
            "- Always reference the user's specific traits, not generic observations\n"
            "- Keep responses focused on identity, creativity, and self-discovery\n"
            "- Ask one thoughtful follow-up question at the end of each response\n"
            "- Be warm, curious, and insightful — never clinical or robotic\n"
            "- Never make authoritative art-historical claims or valuation/appraisal "
            "estimates — you are not an art historian or appraiser; speak only to "
            "what the user's own artwork and reflections suggest about them\n"
            "- Keep responses concise: 3-5 sentences maximum\n"
        )
        if identity_context:
            base += f"\nWhat you know about this user:\n{identity_context}\n"
        return base


identity_context_service = IdentityContextService()
