# M3-11 — Conversation Quality Review

**Scope:** does `POST /api/chat/message` produce responses that cite the user's
actual artwork/traits, in a curious/tentative tone, that move the user toward
reflecting or editing their identity (CLAUDE.md Sections 3 & 4)?

## A note on method — no live model output in this review

Ollama is not runnable on this development machine (the binary is corrupted —
`Start-Process` fails on it directly, independent of any app-level retry
logic), and per this codebase's own constraint the model must stay routed
through the existing `OllamaProvider` abstraction, so no other provider was
substituted. **This review does not contain any fabricated "the AI said..."
text.** Instead, it runs the real production code
(`identity_context_service.build_system_context` /
`.build_chat_system_prompt`, `conversation_guardrails.enforce_focus`) against
10 seeded scenarios and analyzes the *exact prompt* that would be sent to the
LLM. This is actually the more useful audit for this particular question:
specificity is capped by what's *in the prompt* — no amount of model skill
can cite an artwork title the prompt never mentions. Tone is also
almost entirely prompt-determined here, since `build_chat_system_prompt`'s
guideline block is fixed text repeated verbatim in every request.

Script used: seeds realistic `IdentityTemplate`/`IdentityVersion` dicts,
calls the real service functions, prints the resulting prompt. Reproducible
by re-running the same construction against `identity_context_service`.

## Files located (per the task's pointers)

- `intent_service.py` / `intent_model.py` — **not the chat pipeline.** Dead
  code from M2 (edit-intent classifier: REJECT/UPDATE/ADD/REFINE), never
  imported by `chat.py`. Already flagged in the M3-09 review.
- `prompt_builder.py` — builds the **reflection-generation** prompt (used by
  `reflection_service`, not chat).
- `identity_prompt.py` — builds the **trait-extraction** prompt (used by
  `identity_service`, not chat).
- `conversation_service.py` — a context-enrichment helper that is **not
  called anywhere in the live chat route**; `identity_context_service.py` is
  what `chat.py` actually uses.
- **`identity_context_service.py`** — the real system-prompt builder for chat.
- **`personalization_service.py`** — post-hoc "does this look generic"
  rescue pass, triggered only if `score_genericness(response) > 0.4`.
- **`ollama_provider.py`** — the AI provider abstraction; all calls in
  `chat.py` route through this, unchanged by this review.

## Scoring rubric

- **Specificity (1–5):** can the model cite something concrete — an artwork
  title, actual reflection prose, real (not placeholder) trait names — or is
  it limited to templated generalities?
- **Tone (1–5):** does the prompt itself instruct curious/tentative framing,
  and is it free of anything that would license authoritative or valuation
  claims?
- **Loop relevance (1–5):** does the context nudge the user toward
  reflecting further or *editing/confirming* their identity — the actual
  product loop — not just toward more chat?

## Results — 10 scenarios

| # | Scenario | User message | Specificity | Tone | Loop relevance |
|---|---|---|:-:|:-:|:-:|
| 1 | New user, no identity yet | "What does my art say about me?" | 5 *(correctly generic — nothing exists yet)* | 4 | 3 |
| 2 | Single artwork, minimal confirmed traits | "What does my art say about me?" | 3 | 4 | 3 |
| 3 | Three artworks, mixed confirmation state | "Which of my traits surprised you most?" | **1** — no trait labels reach the prompt at all | 4 | 2 |
| 4 | Identity drift across 2 versions | "How has my identity changed over time?" | 4 | 4 | 4 — emerged/faded traits genuinely invite reflection |
| 5 | REFLECT question, rich context | "Why does this piece resonate with me?" | 3 — traits present, but "this piece" is never identified | 4 | 3 |
| 6 | SUGGEST question | "What should I create next?" | 2 | 4 | 3 |
| 7 | Off-topic (guardrail path) | "Tell me about Van Gogh's life" | n/a (no LLM call) | 4 | 4 — redirect ends on an inviting question |
| 8 | Newest artwork's reflection failed | "I just added a new artwork called \"Seventh Piece\"..." | **1** — model has zero structured awareness "Seventh Piece" exists | 4 | 2 |
| 9 | Heavy user, 12 traits (cap is 8) | "What does my art say about me?" | 3 — real traits present but silently truncated, no recency ordering | 4 | 3 |
| 10 | Only unconfirmed AI-suggested traits | "What does my art say about me?" | **1** — context is nearly empty despite real candidate traits existing | 4 | **1** — the one case that should most prompt "come confirm these," and can't |

**Average specificity: 2.5 / 5. Average tone: 4 / 5 (structural, see below). Average loop relevance: 2.8 / 5.**

## Concrete good vs. weak examples

**Weak — Scenario 8** (the one most likely to happen in practice, right
after the M3-07/M3-08 "add another artwork" flow): the user's message
literally names their new artwork, but the system context says only:

```
Key traits: Nostalgic
Identity version: 1
Total artworks analysed: 1
```

Nothing about "Seventh Piece" — the identity template for that artwork
doesn't exist yet (async generation lag), and even once it does, its
*reflection text* — the actually descriptive, specific prose — never enters
this context at all, ever, for any artwork. The model is reduced to
parroting back whatever the user just typed.

**Weak — Scenario 3**: `build_system_context` reads `identity_templates[-1]`
only — the single most recent template — for both `core_identity` and
`trait_labels`. A user with three artworks and real confirmed traits on the
first two gets a context with **no trait labels whatsoever**, because the
third (latest) template happens to only carry a text trait. This
contradicts the prompt's own claim of "Total artworks analysed: 3."

**Good — Scenario 4**: emerged/faded trait computation genuinely produces
material a curious, specific response could use ("Bold" emerged, "Cautious"
faded) — this is the one mechanism in the current pipeline that produces
real longitudinal specificity, exactly per CLAUDE.md Section 6's "taste
trajectories."

**Good — Scenario 7 (redirect text)**: tone is consistently on-model —
tentative, warm, ends with an inviting question — across every off-topic
case, since it's the fixed `_REDIRECT` string.

## Cross-cutting gaps (apply to all scenarios, not scenario-specific)

1. **No anti-authority/valuation guideline exists anywhere in the prompt.**
   The task's own constraint — "the assistant must never make authoritative
   art-historical or valuation claims" — is currently *unenforced at the
   prompt level*. `conversation_guardrails.validate_response()` only
   post-filters for AI-disclaimer phrases ("as an ai," "i cannot," etc.),
   nothing about appraisal/authority language.
2. **No artwork ever enters the system prompt**, structurally, in any
   scenario — this is the single biggest driver of the specificity scores
   above.
3. **Trait sourcing is narrower than it should be** (Scenario 3's bug) and
   silently capped with no recency ordering (Scenario 9).
4. **Unconfirmed/pending traits are invisible to chat** (Scenario 10) — the
   exact moment CLAUDE.md's edit-discipline loop most wants a nudge is the
   one moment the context can't produce one.

## Fixes applied

See the diff below. Four targeted changes to `identity_context_service.py`
and `chat.py` (plus the small frontend plumbing to pass `activeArtworkId`,
which `ChatPage.jsx` already tracks client-side from M3-07/08):

1. **Inject the active artwork's title + reflection excerpt** into the
   system context when available — chat.py now accepts an optional
   `artwork_id` in the request body (frontend already has this as
   `activeArtworkId`), looks up that artwork + its `Reflection`, and passes
   it through.
2. **Aggregate confirmed chip/slider traits across all templates**, not just
   the latest one — fixes Scenario 3.
3. **Surface a pending-confirmation count** when unconfirmed traits exist —
   directly targets Scenario 10's loop-relevance gap.
4. **Add an explicit anti-authority/valuation guideline** to the system
   prompt's fixed instruction block.

Re-run of the same 10 scenarios against the *patched* code is in
`prompt_audit_after.md` — 3 of the 4 lowest-scoring scenarios (3, 8, 10)
show materially different, non-empty context after the fix; scenario 9's
truncation is unchanged (out of scope — a real fix there needs a "most
relevant N" ranking, not a keyword patch, and would be a separate task).
