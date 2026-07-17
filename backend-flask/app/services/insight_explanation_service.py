import logging
from app.services.ollama_provider import OllamaProvider

logger = logging.getLogger(__name__)


class InsightExplanationService:
    def __init__(self):
        self.llm = OllamaProvider()

    def explain_insight(self, insight: str, traits: list, artwork_description: str = None) -> str:
        try:
            traits_text = "\n".join(
                f"- {t.get('label', '')}: {t.get('value', '')}"
                for t in traits
                if t.get('label')
            )
            artwork_context = f"\nArtwork context: {artwork_description}" if artwork_description else ""

            prompt = f"""You are an identity insight analyst for a creative art platform.

A user's artwork has produced the following identity insight:
"{insight}"

The user's identity traits are:
{traits_text}{artwork_context}

In 2-3 sentences, explain specifically WHY this insight connects to the patterns found
in their artwork and traits. Be personal, specific, and grounded in the data above.
Do not be generic.
"""
            return self.llm.generate(prompt)

        except Exception as e:
            logger.error(f"Insight explanation failed: {str(e)}")
            return insight

    def explain_all_insights(self, insights: list, traits: list, artwork_description: str = None) -> list:
        results = []
        for insight in insights:
            explanation = self.explain_insight(insight, traits, artwork_description)
            results.append({"insight": insight, "explanation": explanation})
        return results


insight_explanation_service = InsightExplanationService()
