class IntentService:

    def detect_intent(self, text: str):
        text = text.lower()

        if any(w in text for w in ["remove", "delete", "don't like", "reject"]):
            return "REJECT"

        if any(w in text for w in ["change", "edit", "adjust"]):
            return "UPDATE"

        if any(w in text for w in ["add", "include", "also"]):
            return "ADD"

        return "REFINE"


intent_service = IntentService()