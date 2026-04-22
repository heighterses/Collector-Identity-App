# app/services/trait_extraction_service.py

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# predefined trait anchors (UNCHANGED)
TRAIT_BANK = {
    "calm": "peaceful composed balanced",
    "anxious": "fear tension stress worry",
    "creative": "imaginative expressive original",
    "analytical": "logical structured reasoning",
    "emotional": "deep feeling sensitivity introspection"
}


class TraitExtractionService:

    def extract_traits(self, reflection_embedding, embedding_service):
        traits = []

        try:
            for label, text in TRAIT_BANK.items():
                anchor_emb = embedding_service.embed(text)

                sim = cosine_similarity(
                    [reflection_embedding],
                    [anchor_emb]
                )[0][0]

                # 🔥 ALWAYS STORE (no threshold filtering)
                traits.append((label, float(sim)))

            # 🔥 SORT BY SIMILARITY (CORE FIX)
            traits = sorted(traits, key=lambda x: x[1], reverse=True)

            # 🔥 TAKE TOP-K (stable ML output)
            TOP_K = 3
            return traits[:TOP_K]

        except Exception as e:
            print("Trait extraction error:", str(e))
            return []


trait_extraction_service = TraitExtractionService()