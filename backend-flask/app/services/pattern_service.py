from collections import Counter


class PatternService:

    def detect_patterns(self, identities):
        trait_counter = Counter()
        emotion_counter = Counter()
        theme_counter = Counter()

        for identity in identities:
            for t in identity.get("traits", []):
                label = t.get("label", "").lower()

                if not label:
                    continue

                if any(e in label for e in ["sad", "happy", "fear", "anger", "joy", "love"]):
                    emotion_counter[label] += 1
                elif "theme" in label:
                    theme_counter[label] += 1
                else:
                    trait_counter[label] += 1

        return {
            "traits": trait_counter.most_common(5),
            "emotions": emotion_counter.most_common(5),
            "themes": theme_counter.most_common(5)
        }

    def detect_trend(self, identities):
        if len(identities) < 2:
            return {"new_traits": [], "dropped_traits": []}

        last = identities[-1]
        prev = identities[-2]

        last_traits = set([t["label"] for t in last.get("traits", [])])
        prev_traits = set([t["label"] for t in prev.get("traits", [])])

        return {
            "new_traits": list(last_traits - prev_traits),
            "dropped_traits": list(prev_traits - last_traits)
        }


pattern_service = PatternService()