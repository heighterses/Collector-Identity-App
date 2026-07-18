import logging

logger = logging.getLogger(__name__)


class IdentityChangeDetector:
    """
    Analyses identity templates over time to detect stable traits,
    emerging traits, fading traits, and slider intensity trends.
    """

    def detect_changes(self, identity_templates: list) -> dict:
        try:
            if not identity_templates:
                return self._empty_result()

            if len(identity_templates) == 1:
                traits = identity_templates[0].get("traits", [])
                labels = [t["label"] for t in traits if t.get("label")]
                return {
                    "stable_traits": labels[:5],
                    "emerging_traits": [],
                    "fading_traits": [],
                    "intensity_trends": [],
                    "intensity_series": {"versions": [], "series": []},
                    "volatility_score": 0.0,
                    "summary": "Only one artwork analysed so far — upload more to track changes."
                }

            return {
                "stable_traits": self._find_stable_traits(identity_templates),
                "emerging_traits": self._find_emerging_traits(identity_templates),
                "fading_traits": self._find_fading_traits(identity_templates),
                "intensity_trends": self._find_intensity_trends(identity_templates),
                "intensity_series": self._find_intensity_series(identity_templates),
                "volatility_score": self._compute_volatility(identity_templates),
                "summary": self._generate_summary(identity_templates)
            }

        except Exception as e:
            logger.error(f"Change detection failed: {str(e)}")
            return self._empty_result()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _get_trait_sets(self, templates: list) -> list:
        return [
            {t["label"] for t in tmpl.get("traits", []) if t.get("label")}
            for tmpl in templates
        ]

    def _find_stable_traits(self, templates: list) -> list:
        sets = self._get_trait_sets(templates)
        return sorted(set.intersection(*sets))[:10] if sets else []

    def _find_emerging_traits(self, templates: list) -> list:
        if len(templates) < 2:
            return []
        mid = len(templates) // 2
        recent = set().union(*self._get_trait_sets(templates[mid:]))
        early = set().union(*self._get_trait_sets(templates[:mid]))
        return sorted(recent - early)[:8]

    def _find_fading_traits(self, templates: list) -> list:
        if len(templates) < 2:
            return []
        mid = len(templates) // 2
        recent = set().union(*self._get_trait_sets(templates[mid:]))
        early = set().union(*self._get_trait_sets(templates[:mid]))
        return sorted(early - recent)[:8]

    def _find_intensity_trends(self, templates: list) -> list:
        label_values = {}
        for tmpl in templates:
            for t in tmpl.get("traits", []):
                if t.get("trait_type") == "slider" and t.get("label") and t.get("value"):
                    try:
                        label_values.setdefault(t["label"], []).append(float(t["value"]))
                    except (ValueError, TypeError):
                        continue

        trends = []
        for label, values in label_values.items():
            if len(values) < 2:
                continue
            delta = round(values[-1] - values[0], 2)
            trends.append({
                "trait": label,
                "direction": "increasing" if delta > 0 else "decreasing",
                "delta": delta,
                "avg": round(sum(values) / len(values), 2)
            })

        return sorted(trends, key=lambda x: abs(x["delta"]), reverse=True)[:5]

    def _find_intensity_series(self, templates: list) -> dict:
        """
        M3-18: per-version values for slider traits, for charting intensity
        over time. `_find_intensity_trends` above only keeps the start->end
        delta and an overall average — this keeps the full series so the
        frontend can plot it without recomputing anything itself.
        """
        n = len(templates)
        label_values = {}
        for idx, tmpl in enumerate(templates):
            for t in tmpl.get("traits", []):
                if t.get("trait_type") == "slider" and t.get("label") and t.get("value") is not None:
                    try:
                        val = float(t["value"])
                    except (ValueError, TypeError):
                        continue
                    label_values.setdefault(t["label"], [None] * n)[idx] = val

        def spread(values):
            nums = [v for v in values if v is not None]
            return (max(nums) - min(nums)) if nums else 0

        series = [
            {"trait": label, "values": values}
            for label, values in label_values.items()
            if sum(v is not None for v in values) >= 2
        ]
        series.sort(key=lambda s: spread(s["values"]), reverse=True)

        return {
            "versions": [tmpl.get("version", i + 1) for i, tmpl in enumerate(templates)],
            "series": series[:6],
        }

    def _compute_volatility(self, templates: list) -> float:
        sets = self._get_trait_sets(templates)
        if len(sets) < 2:
            return 0.0
        scores = []
        for i in range(1, len(sets)):
            union = sets[i - 1] | sets[i]
            inter = sets[i - 1] & sets[i]
            if union:
                scores.append(1.0 - len(inter) / len(union))
        return round(sum(scores) / len(scores), 2) if scores else 0.0

    def _generate_summary(self, templates: list) -> str:
        stable = self._find_stable_traits(templates)
        emerging = self._find_emerging_traits(templates)
        volatility = self._compute_volatility(templates)

        parts = []
        if stable:
            parts.append(f"Consistently present: {', '.join(stable[:3])}")
        if emerging:
            parts.append(f"Newly emerging: {', '.join(emerging[:3])}")
        if volatility > 0.6:
            parts.append("Your identity is evolving rapidly across artworks.")
        elif volatility < 0.2:
            parts.append("Your identity has been very consistent across artworks.")
        else:
            parts.append("Your identity shows gradual, steady evolution.")

        return " | ".join(parts) if parts else "Identity analysis in progress."

    def _empty_result(self) -> dict:
        return {
            "stable_traits": [],
            "emerging_traits": [],
            "fading_traits": [],
            "intensity_trends": [],
            "intensity_series": {"versions": [], "series": []},
            "volatility_score": 0.0,
            "summary": "Not enough data to detect changes yet."
        }


identity_change_detector = IdentityChangeDetector()
