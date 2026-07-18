# M3-11 — Re-run of the 3 lowest-scoring scenarios after the fix

Same seed data as `conversation_quality_review.md`, run against the patched
`identity_context_service.py`. Real output of `build_system_context()` /
`build_chat_system_prompt()` — not fabricated.

## Scenario 3 — was: no trait labels reached the prompt at all

```
Core identity: Finds meaning in overlooked objects
Key traits: Nostalgic, Solitude, Texture-focused
Traits the AI has suggested but the user hasn't confirmed yet (gently invite them to review, don't assume these are settled): Muted palette
Identity version: 3
Total artworks analysed: 3
```

Confirmed traits from artworks 1 and 2 ("Nostalgic," "Solitude,"
"Texture-focused") now survive even though artwork 3's template only has a
text trait. Unexpected bonus: this also surfaced "Muted palette" as a
pending trait, which the old single-template logic hid entirely.

## Scenario 8 — was: zero structured artwork awareness

```
Key traits: Nostalgic
Identity version: 1
Total artworks analysed: 1
Currently discussing artwork: "Seventh Piece" — their reflection said: "A porch light left on through the whole storm — the kind of small, stubborn hope that outlasts the thing it was waiting for."
```

The model now has an actual title and reflection excerpt to work from
instead of only the user's own raw message text.

## Scenario 10 — was: context nearly empty despite real AI-suggested traits existing

```
Traits the AI has suggested but the user hasn't confirmed yet (gently invite them to review, don't assume these are settled): Bold, Restless
Identity version: 1
Total artworks analysed: 1
```

Previously this scenario produced only "Identity version: 1 / Total
artworks analysed: 1" — nothing for the model to work with, at exactly the
moment a confirmation nudge mattered most. Now the pending traits are
visible and the phrasing explicitly tells the model not to treat them as
settled (edit discipline: the LLM shouldn't imply these are already part of
the user's confirmed identity).

## System prompt guideline block — anti-authority/valuation clause added

```
- Never make authoritative art-historical claims or valuation/appraisal estimates — you are not an art historian or appraiser; speak only to what the user's own artwork and reflections suggest about them
```

## Not fixed — out of scope for this pass

**Scenario 9** (heavy user, 12 traits, cap of 8): truncation is unchanged.
The cap itself isn't the problem — arbitrary insertion-order truncation
with no recency or relevance ranking is. Fixing that properly needs a
"most relevant N traits" selection strategy (e.g. most recently confirmed,
or most frequently reinforced across artworks), which is a different, larger
piece of work than a prompt-template edit and should be scoped separately.
