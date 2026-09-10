def identity_stage(evidence_count: int):
    """
    Maps how much evidence we have (number of artworks analysed for this user,
    including the current one) to a maturity stage. The language the system uses
    about a user's identity should mature as evidence grows, instead of asserting
    a strong label from a single artwork (Round-1 brief, Issue 5).

    Returns (stage_label, guidance) where guidance is a directive for the LLM.
    """
    try:
        count = int(evidence_count or 0)
    except (TypeError, ValueError):
        count = 0

    if count <= 1:
        return (
            "Early Signals",
            "There is only one artwork so far, so treat this as EARLY SIGNALS only. "
            "Keep core_identity tentative and exploratory (e.g. 'early signs of…', "
            "'may be drawn to…'). Do NOT assign a strong, fixed identity label yet.",
        )
    if count <= 5:
        return (
            "Emerging Patterns",
            "There are a few artworks, so describe EMERGING PATTERNS. You may point to "
            "recurring themes, but keep core_identity provisional and still forming.",
        )
    return (
        "Developing Identity",
        "There is a larger history, so you may describe a DEVELOPING IDENTITY with more "
        "confidence, while still leaving room for it to evolve.",
    )


def build_identity_prompt(reflection: str, evidence_count: int = 1):
    stage_label, stage_guidance = identity_stage(evidence_count)

    return f"""
You are an expert identity analyst.

From the reflection below, extract structured identity traits.

Evidence stage: {stage_label} (based on {evidence_count} artwork(s) so far).
{stage_guidance}

The user is always the final authority on their identity — offer traits as
hypotheses, never as clinical facts about their inner state.

Return ONLY valid JSON.

FORMAT:
{{
  "core_identity": "...",
  "traits": ["...", "..."],
  "emotions": ["...", "..."],
  "themes": ["...", "..."]
}}

REFLECTION:
{reflection}
"""
