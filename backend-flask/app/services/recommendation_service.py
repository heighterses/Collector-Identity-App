import logging
from app.services.llm_provider import llm_provider
from app.services.pattern_service import pattern_service

logger = logging.getLogger(__name__)


class RecommendationService:
    def __init__(self):
        self.llm = llm_provider

    def recommend_next_artwork(self, identities: list) -> dict:
        try:
            if not identities:
                return {
                    "recommendations": [],
                    "reasoning": "No identity data available yet."
                }

            patterns = pattern_service.detect_patterns(identities)
            trend = pattern_service.detect_trend(identities)

            top_traits = [t[0] for t in patterns.get("traits", [])[:3]]
            top_emotions = [e[0] for e in patterns.get("emotions", [])[:3]]
            new_traits = trend.get("new_traits", [])
            dropped_traits = trend.get("dropped_traits", [])

            prompt = f"""You are a creative art advisor for an identity-exploration platform.

Based on a user's identity analysis across their past artworks:

Core traits: {', '.join(top_traits) if top_traits else 'not yet established'}
Emotional patterns: {', '.join(top_emotions) if top_emotions else 'none detected'}
Emerging new traits: {', '.join(new_traits) if new_traits else 'none'}
Traits moving away from: {', '.join(dropped_traits) if dropped_traits else 'none'}

Suggest 3 specific artwork ideas that would:
1. Help the user explore their emerging traits
2. Challenge their comfort zone based on dropped traits
3. Express their core emotional identity

Format your response as three numbered suggestions. Each should be 1-2 sentences
describing the artwork type, medium, and what identity theme it would explore.
"""
            raw = self.llm.generate(prompt)

            lines = [l.strip() for l in raw.split('\n') if l.strip()]
            suggestions = [l for l in lines if l and l[0].isdigit()][:3]

            return {
                "recommendations": suggestions if suggestions else [raw],
                "based_on": {
                    "top_traits": top_traits,
                    "top_emotions": top_emotions,
                    "new_traits": new_traits
                }
            }

        except Exception as e:
            logger.error(f"Recommendation failed: {str(e)}")
            return {"recommendations": [], "reasoning": str(e)}


recommendation_service = RecommendationService()
