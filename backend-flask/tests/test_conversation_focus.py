"""
M3-09: Prove the conversation stays on-mission — off-topic input should be
classified as REDIRECT (this codebase's equivalent, per CLAUDE.md Section 4)
and steered back toward identity/taste/artwork reflection, not answered like
a general chatbot.

Where the routing actually happens: `intent_service.py` / `intent_model.py`
are NOT it — those are the M2 edit-intent classifier (REJECT/UPDATE/ADD/
REFINE, for identity-trait edits) and are never called from the chat route.
The real pre-filter is `conversation_guardrails.enforce_focus()`
(app/services/conversation_guardrails.py), which `POST /api/chat/message`
calls before the LLM is touched at all (see app/routes/chat.py). That's a
pure function — no Flask app context, DB, or LLM needed to test it — so
these tests call it directly rather than hitting the HTTP endpoint.
"""
import pytest
from app.services.conversation_guardrails import conversation_guardrails


# One case per category required by the task.
OFF_TOPIC_CASES = [
    ("What's the weather?", "general knowledge"),
    ("Tell me about Van Gogh's life", "art-history trivia"),
    ("Should I quit my job?", "personal advice"),
    ("How are you?", "small talk"),
    ("Write me an email", "task request"),
    ("What time is it?", "factual"),
]

# Legitimate reflection questions — these must NOT be redirected. Without
# this control group, a router that redirects everything would pass the
# off-topic assertions trivially without actually being "on-mission."
ON_TOPIC_CASES = [
    "Why does this piece resonate with me?",
    "What does my collection say about my taste?",
    "I feel like my identity is shifting toward something bolder.",
]


@pytest.mark.parametrize(
    "message,category", OFF_TOPIC_CASES, ids=[c for _, c in OFF_TOPIC_CASES]
)
def test_off_topic_input_is_redirected(message, category):
    result = conversation_guardrails.enforce_focus(message)

    assert result["allowed"] is False, (
        f"[{category}] {message!r} was NOT classified as off-topic — "
        f"the router let it through as if it were an on-mission reflection question."
    )

    redirect_text = (result["redirect"] or "").lower()
    steers_back = any(
        kw in redirect_text for kw in ("artwork", "identity", "creative", "yourself")
    )
    assert steers_back, (
        f"[{category}] redirect message did not steer back toward "
        f"artwork/identity: {result['redirect']!r}"
    )


@pytest.mark.parametrize("message", ON_TOPIC_CASES)
def test_on_topic_input_is_not_redirected(message):
    result = conversation_guardrails.enforce_focus(message)
    assert result["allowed"] is True, (
        f"{message!r} is a legitimate reflection question but was incorrectly redirected."
    )
