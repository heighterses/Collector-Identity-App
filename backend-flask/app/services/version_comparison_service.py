import logging
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class VersionComparisonService:
    """
    Compares two identity version snapshots side by side:
    trait diff, embedding similarity, and a plain-language summary.
    """

    def compare(self, version_a: dict, version_b: dict, embedding_service=None) -> dict:
        try:
            snap_a = version_a.get("snapshot_json", {})
            snap_b = version_b.get("snapshot_json", {})

            traits_a = {t["label"]: t for t in snap_a.get("traits", []) if t.get("label")}
            traits_b = {t["label"]: t for t in snap_b.get("traits", []) if t.get("label")}

            labels_a = set(traits_a)
            labels_b = set(traits_b)

            shared = labels_a & labels_b
            added = labels_b - labels_a
            removed = labels_a - labels_b

            value_changes = [
                {"trait": label, "from": traits_a[label].get("value"), "to": traits_b[label].get("value")}
                for label in shared
                if traits_a[label].get("value") != traits_b[label].get("value")
            ]

            similarity = self._compute_similarity(snap_a, snap_b, embedding_service)

            return {
                "version_a": {
                    "id": version_a.get("id"),
                    "version_number": version_a.get("version_number"),
                    "created_at": version_a.get("created_at"),
                    "core_identity": snap_a.get("core_identity")
                },
                "version_b": {
                    "id": version_b.get("id"),
                    "version_number": version_b.get("version_number"),
                    "created_at": version_b.get("created_at"),
                    "core_identity": snap_b.get("core_identity")
                },
                "shared_traits": sorted(shared),
                "added_traits": sorted(added),
                "removed_traits": sorted(removed),
                "value_changes": value_changes,
                "similarity_score": similarity,
                "change_magnitude": round(1.0 - similarity, 2),
                "summary": self._summarise(added, removed, value_changes, similarity)
            }

        except Exception as e:
            logger.error(f"Version comparison failed: {str(e)}")
            return {"error": str(e)}

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _compute_similarity(self, snap_a: dict, snap_b: dict, embedding_service) -> float:
        try:
            if embedding_service:
                text_a = self._snapshot_to_text(snap_a)
                text_b = self._snapshot_to_text(snap_b)
                if text_a and text_b:
                    score = cosine_similarity(
                        [embedding_service.embed(text_a)],
                        [embedding_service.embed(text_b)]
                    )[0][0]
                    return round(float(score), 3)
        except Exception:
            pass

        # Jaccard fallback
        labels_a = {t["label"] for t in snap_a.get("traits", []) if t.get("label")}
        labels_b = {t["label"] for t in snap_b.get("traits", []) if t.get("label")}
        union = labels_a | labels_b
        return round(len(labels_a & labels_b) / len(union), 3) if union else 1.0

    def _snapshot_to_text(self, snapshot: dict) -> str:
        parts = []
        core = snapshot.get("core_identity")
        if core:
            parts.append(core)
        for t in snapshot.get("traits", []):
            label = t.get("label", "")
            value = t.get("value", "")
            if label:
                parts.append(f"{label}: {value}")
        return " ".join(parts)

    def _summarise(self, added: set, removed: set, value_changes: list, similarity: float) -> str:
        parts = []
        if added:
            parts.append(f"New traits: {', '.join(sorted(added)[:3])}")
        if removed:
            parts.append(f"Lost traits: {', '.join(sorted(removed)[:3])}")
        if value_changes:
            parts.append(f"{len(value_changes)} trait(s) changed in intensity")
        if similarity > 0.85:
            parts.append("Overall identity is very similar between versions.")
        elif similarity < 0.5:
            parts.append("Significant identity shift between these versions.")
        else:
            parts.append("Moderate evolution between versions.")
        return " | ".join(parts) if parts else "No notable changes detected."


version_comparison_service = VersionComparisonService()
