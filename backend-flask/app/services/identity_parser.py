import json

REQUIRED_KEYS = ["core_identity", "traits", "emotions", "themes"]

def parse_identity_response(response_text: str):
    try:
        data = json.loads(response_text)

        for key in REQUIRED_KEYS:
            if key not in data:
                data[key] = [] if key != "core_identity" else "Unknown"

        return data

    except Exception:
        return {
            "core_identity": "Unknown",
            "traits": [],
            "emotions": [],
            "themes": []
        }