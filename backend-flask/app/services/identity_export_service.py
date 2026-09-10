import logging
from datetime import datetime
from app.services.llm_provider import llm_provider

logger = logging.getLogger(__name__)

# M3-19: facilitative narrative prompt. Per CLAUDE.md Section 3, the AI is
# never an authority — tentative language only, no art-historical or
# valuation claims, and it must not invent anything beyond the confirmed
# traits actually passed in.
_NARRATIVE_PROMPT = """You are a facilitative identity companion, not an authority. Write a short (3-5 sentence) narrative summary of this person's creative identity, based only on the confirmed traits listed below.

Rules:
- Use tentative, curious language ("seems to," "tends toward," "often drawn to") — never authoritative claims ("this proves," "you are").
- No art-historical claims, no valuation, no academic framing.
- Do not invent traits, artworks, or details that aren't listed below.
- Plain text only — no headers, no bullet points, no markdown.

Core identity: {core_identity}
Confirmed traits: {traits}

Write the narrative summary now:"""


class IdentityExportService:
    """
    M3-19: assembles a stable, documented JSON export of a user's current
    identity. Exports only confirmed traits — per CLAUDE.md Section 2 (edit
    discipline), unconfirmed AI suggestions are not the user's authorized
    meaning and must never appear in something they might keep or share.

    JSON shape (export_version "v1" — keep stable; bump the version string
    if this shape ever changes, for anyone building a PDF export off it):
    {
      "export_version": "v1",
      "exported_at": "<ISO 8601 UTC>",
      "user": { "name": str },
      "identity": {
        "core_identity": str | null,
        "traits": [ { "label": str, "type": "chip"|"slider", "value": str } ],
        "identity_version": int | null,   // latest IdentityTemplate.version
        "total_artworks_analysed": int
      },
      "artworks": [
        { "id": str, "title": str, "created_at": "<ISO 8601 UTC>" | null,
          "reflection_excerpt": str | null }
      ],
      "narrative_summary": str | null,
      "narrative_status": "generated" | "unavailable" | "not_requested"
    }
    """

    def build_export(self, user, templates, artworks, include_narrative=True):
        confirmed_traits = self._aggregate_confirmed_traits(templates)
        core_identity = self._latest_core_identity(templates)

        narrative_summary, narrative_status = (
            self._generate_narrative(core_identity, confirmed_traits)
            if include_narrative else (None, "not_requested")
        )

        return {
            "export_version": "v1",
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "user": {"name": user.name},
            "identity": {
                "core_identity": core_identity,
                "traits": confirmed_traits,
                "identity_version": templates[-1].version if templates else None,
                "total_artworks_analysed": len(templates),
            },
            "artworks": [
                {
                    "id": a.id,
                    "title": a.title,
                    "created_at": a.created_at.isoformat() + "Z" if a.created_at else None,
                    "reflection_excerpt": (
                        a.reflection.content[:280] if a.reflection and a.reflection.content else None
                    ),
                }
                for a in artworks
            ],
            "narrative_summary": narrative_summary,
            "narrative_status": narrative_status,
        }

    def _aggregate_confirmed_traits(self, templates):
        """Confirmed chip/slider traits across all templates, de-duplicated
        by label — same aggregation the chat context uses, so the export
        matches what the user actually sees as "their" identity."""
        seen = set()
        traits = []
        for tmpl in templates:
            for t in tmpl.traits:
                if t.is_confirmed and t.trait_type in ("chip", "slider") and t.label not in seen:
                    seen.add(t.label)
                    traits.append({"label": t.label, "type": t.trait_type, "value": t.value})
        return traits

    def _latest_core_identity(self, templates):
        if not templates:
            return None
        for t in templates[-1].traits:
            if t.trait_type == "text" and t.is_confirmed and t.value:
                return t.value
        return None

    def _generate_narrative(self, core_identity, traits):
        if not traits and not core_identity:
            return None, "unavailable"

        trait_text = ", ".join(f"{t['label']} ({t['value']})" for t in traits) if traits else "none recorded"
        prompt = _NARRATIVE_PROMPT.format(
            core_identity=core_identity or "not yet described",
            traits=trait_text,
        )

        try:
            text = (llm_provider.generate(prompt) or "").strip()
            if len(text) < 10:
                return None, "unavailable"
            return text, "generated"
        except Exception as e:
            logger.warning(f"Identity export narrative generation failed: {e}")
            return None, "unavailable"


identity_export_service = IdentityExportService()
