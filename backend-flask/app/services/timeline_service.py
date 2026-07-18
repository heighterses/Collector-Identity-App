import logging
from collections import Counter

logger = logging.getLogger(__name__)


class TimelineService:
    """
    Generates an identity evolution timeline from a user's identity templates
    and their saved version snapshots.
    """

    def build_timeline(self, identity_templates: list, identity_versions: list = None) -> list:
        try:
            events = []

            for template in identity_templates:
                traits = template.get("traits", [])
                core = next(
                    (t["value"] for t in traits if t.get("trait_type") == "text" and t.get("value")),
                    "Identity captured"
                )
                chip_traits = [
                    t["label"] for t in traits
                    if t.get("trait_type") in ("chip", "slider") and t.get("is_confirmed", True)
                ][:5]

                events.append({
                    "date": template.get("created_at"),
                    "event_type": "artwork_analysis",
                    "title": f"Identity from artwork #{template.get('version', 1)}",
                    "summary": (core[:120] if core else "New identity traits captured."),
                    "traits_snapshot": chip_traits,
                    "version": template.get("version", 1),
                    "template_id": template.get("id"),
                    "artwork_id": template.get("artwork_id"),
                    "change_score": 0.0
                })

            for i in range(1, len(events)):
                prev = set(events[i - 1]["traits_snapshot"])
                curr = set(events[i]["traits_snapshot"])
                union = prev | curr
                intersection = prev & curr
                events[i]["change_score"] = round(
                    1.0 - (len(intersection) / len(union)) if union else 0.0, 2
                )

            if identity_versions:
                for v in identity_versions:
                    snapshot = v.get("snapshot_json", {})
                    traits = [t["label"] for t in snapshot.get("traits", [])][:5]
                    events.append({
                        "id": v.get("id"),  # M3-15: the actual IdentityVersion id — needed to attach notes
                        "date": v.get("created_at"),
                        "event_type": "saved_version",
                        "title": f"Saved Version {v.get('version_number', '?')}",
                        "summary": snapshot.get("core_identity") or "Version snapshot saved.",
                        "traits_snapshot": traits,
                        "version": v.get("version_number"),
                        "template_id": v.get("template_id"),
                        "artwork_id": None,
                        "change_score": 0.0
                    })

            events.sort(key=lambda e: e.get("date") or "")
            return events

        except Exception as e:
            logger.error(f"Timeline build failed: {str(e)}")
            return []

    def get_timeline_summary(self, events: list) -> dict:
        if not events:
            return {"total_events": 0, "identity_shifts": 0, "most_stable_trait": None}

        shifts = sum(1 for e in events if e.get("change_score", 0) > 0.4)

        all_traits = []
        for e in events:
            all_traits.extend(e.get("traits_snapshot", []))

        freq = Counter(all_traits)
        most_stable = freq.most_common(1)[0][0] if freq else None

        return {
            "total_events": len(events),
            "identity_shifts": shifts,
            "most_stable_trait": most_stable,
            "date_range": {
                "from": events[0].get("date"),
                "to": events[-1].get("date")
            }
        }


timeline_service = TimelineService()
