from app.services.intent_model import intent_model


class IntentService:
    """
    Hybrid Intent Service:
    - Primary → ML classifier (TF-IDF + Logistic Regression)
    - Fallback → rule-based (your original logic, preserved)
    """

    def detect_intent(self, text: str):
        try:
            # 🔥 STEP 1: ML prediction
            intent = intent_model.predict(text)

            # Safety fallback if model fails or returns None
            if intent:
                return intent

        except Exception:
            pass  # fallback below

        # ======================================================
        # 🔻 FALLBACK (YOUR ORIGINAL LOGIC — UNCHANGED)
        # ======================================================
        text = text.lower()

        if any(w in text for w in ["remove", "delete", "don't like", "reject"]):
            return "REJECT"

        if any(w in text for w in ["change", "edit", "adjust"]):
            return "UPDATE"

        if any(w in text for w in ["add", "include", "also"]):
            return "ADD"

        return "REFINE"


intent_service = IntentService()