from collections import Counter

# 🔥 ML imports (UNCHANGED)
from sklearn.cluster import KMeans
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


class PatternService:

    # ==========================================================
    # ✅ EXISTING LOGIC (UNCHANGED)
    # ==========================================================
    def detect_patterns(self, identities):
        trait_counter = Counter()
        emotion_counter = Counter()
        theme_counter = Counter()

        for identity in identities:
            for t in identity.get("traits", []):
                label = t.get("label", "")

                if not label:
                    continue

                label_lower = label.lower()

                if any(e in label_lower for e in ["sad", "happy", "fear", "anger", "joy", "love"]):
                    emotion_counter[label] += 1
                elif "theme" in label_lower:
                    theme_counter[label] += 1
                else:
                    trait_counter[label] += 1

        return {
            "traits": trait_counter.most_common(5),
            "emotions": emotion_counter.most_common(5),
            "themes": theme_counter.most_common(5)
        }

    # ==========================================================
    # ✅ EXISTING TREND (UNCHANGED)
    # ==========================================================
    def detect_trend(self, identities):
        if len(identities) < 2:
            return {"new_traits": [], "dropped_traits": []}

        last = identities[-1]
        prev = identities[-2]

        last_traits = set([
            t.get("label") for t in last.get("traits", []) if t.get("label")
        ])

        prev_traits = set([
            t.get("label") for t in prev.get("traits", []) if t.get("label")
        ])

        return {
            "new_traits": list(last_traits - prev_traits),
            "dropped_traits": list(prev_traits - last_traits)
        }

    # ==========================================================
    # 🔥 NEW: TRAIT DYNAMICS ACROSS THE WHOLE COLLECTION (Issue 6)
    # ==========================================================
    def classify_trait_dynamics(self, identities):
        """
        Look across ALL of the user's artwork identities (not just the last two)
        and classify trait labels as:
          - persistent : recurs across most artworks
          - one_off    : seen in only a single artwork
          - emerging   : shows up in the more recent half, not the older half
          - fading     : was in the older half, absent from the recent half

        This lets the app "begin showing patterns" instead of just re-listing the
        active artwork's traits (Round-1 brief, Issue 6). Additive — callers that
        don't use it are unaffected.
        """
        empty = {"persistent": [], "one_off": [], "emerging": [], "fading": []}

        ordered = sorted(identities, key=lambda i: i.get("created_at") or "")
        n = len(ordered)
        if n == 0:
            return empty

        # Per-artwork set of trait labels (skip the Core Identity summary label).
        seq = []
        for ident in ordered:
            labels = set()
            for t in ident.get("traits", []):
                lbl = (t.get("label") or "").strip()
                if lbl and lbl != "Core Identity":
                    labels.add(lbl)
            seq.append(labels)

        counts = Counter()
        for labels in seq:
            counts.update(labels)

        split = max(1, n // 2)
        older = set().union(*seq[:split]) if seq[:split] else set()
        recent = set().union(*seq[split:]) if seq[split:] else set()

        persistent_threshold = max(2, round(n * 0.6))

        persistent = sorted(l for l, c in counts.items() if c >= persistent_threshold)
        one_off = sorted(l for l, c in counts.items() if c == 1)
        emerging = sorted(recent - older)
        fading = sorted(older - recent)

        return {
            "persistent": persistent[:5],
            "one_off": one_off[:5],
            "emerging": emerging[:5],
            "fading": fading[:5],
        }

    # ==========================================================
    # 🔥 EXISTING: CLUSTER BY TRAITS (UNCHANGED)
    # ==========================================================
    def cluster_identities(self, identities):
        vectors = []

        for identity in identities:
            vec = []

            for t in identity.get("traits", []):
                val = t.get("value")

                try:
                    vec.append(float(val))
                except:
                    vec.append(0.0)

            if vec:
                vectors.append(vec)

        if len(vectors) < 2:
            return []

        try:
            kmeans = KMeans(n_clusters=2, random_state=42, n_init=10)
            labels = kmeans.fit_predict(vectors)
            return labels.tolist()
        except Exception:
            return []

    # ==========================================================
    # 🔥 NEW: CLUSTER USING EMBEDDINGS (REAL ML)
    # ==========================================================
    def cluster_embeddings(self, identities):
        embeddings = [
            i.get("embedding")
            for i in identities
            if i.get("embedding")
        ]

        if len(embeddings) < 2:
            return []

        try:
            X = np.array(embeddings)
            kmeans = KMeans(n_clusters=2, random_state=42, n_init=10)
            labels = kmeans.fit_predict(X)
            return labels.tolist()
        except Exception:
            return []

    # ==========================================================
    # 🔥 NEW: SIMILARITY MATRIX (REAL ML)
    # ==========================================================
    def similarity_matrix(self, identities):
        embeddings = [
            i.get("embedding")
            for i in identities
            if i.get("embedding")
        ]

        if len(embeddings) < 2:
            return []

        try:
            sims = cosine_similarity(embeddings)
            return sims.tolist()
        except Exception:
            return []

    # ==========================================================
    # 🔥 EXISTING: INSIGHTS (UNCHANGED)
    # ==========================================================
    def generate_insights(self, patterns, trend, dynamics=None):
        insights = []

        if patterns.get("traits"):
            top_trait = patterns["traits"][0][0]
            insights.append(f"You consistently show '{top_trait}' in your identity.")

        if patterns.get("emotions"):
            top_emotion = patterns["emotions"][0][0]
            insights.append(f"Your emotional pattern leans toward '{top_emotion}'.")

        # Prefer the whole-collection dynamics (Issue 6) when available; fall back
        # to the simple last-two-artwork trend otherwise.
        dynamics = dynamics or {}
        if dynamics.get("persistent"):
            insights.append(
                f"Recurring across your work: {', '.join(dynamics['persistent'])}"
            )
        if dynamics.get("emerging"):
            insights.append(f"Emerging themes: {', '.join(dynamics['emerging'])}")
        elif trend.get("new_traits"):
            insights.append(f"New emerging traits: {', '.join(trend['new_traits'])}")
        if dynamics.get("fading"):
            insights.append(f"Themes that are fading: {', '.join(dynamics['fading'])}")
        elif trend.get("dropped_traits"):
            insights.append(f"Traits you're moving away from: {', '.join(trend['dropped_traits'])}")
        if dynamics.get("one_off"):
            insights.append(f"Seen once so far: {', '.join(dynamics['one_off'])}")

        return insights


pattern_service = PatternService()