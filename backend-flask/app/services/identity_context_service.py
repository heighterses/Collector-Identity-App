import logging

logger = logging.getLogger(__name__)


class IdentityContextService:
    """
    Builds a rich system context string from the user's identity versions
    so the LLM always responds with awareness of who this user is.
    """

    def build_system_context(self, identity_templates: list, identity_versions: list = None) -> str:
        try:
            if not identity_templates:
                return "The user has not yet established an identity profile."

            parts = []
            latest = identity_templates[-1]
            traits = latest.get("traits", [])

            core = next(
                (t["value"] for t in traits if t.get("trait_type") == "text" and t.get("value")),
                None
            )
            if core:
                parts.append(f"Core identity: {core}")

            trait_labels = [
                t["label"] for t in traits
                if t.get("trait_type") in ("chip", "slider") and t.get("is_confirmed", True)
            ][:8]
            if trait_labels:
                parts.append(f"Key traits: {', '.join(trait_labels)}")

            parts.append(f"Identity version: {latest.get('version', 1)}")
            parts.append(f"Total artworks analysed: {len(identity_templates)}")

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

            return "\n".join(parts)

        except Exception as e:
            logger.error(f"Identity context build failed: {str(e)}")
            return ""

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
            "- Keep responses concise: 3-5 sentences maximum\n"
        )
        if identity_context:
            base += f"\nWhat you know about this user:\n{identity_context}\n"
        return base


identity_context_service = IdentityContextService()
