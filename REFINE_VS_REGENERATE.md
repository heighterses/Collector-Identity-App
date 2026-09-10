# Refine vs Regenerate — current behavior

Documentation requested by the Round‑1 testing brief (Issue 10). This describes
exactly what each action does today, after the Round‑1 fixes.

## Refine (`POST /api/reflection/refine`)

Body: `{ reflection_id, input }`

- **Is the user's refinement stored?** Yes — the reflection row is updated in
  place (`content` replaced, `type = "refined"`, `updated_at` bumped).
- **Does it create a new reflection version?** No. There is currently no
  reflection‑version table; the refined text overwrites the existing reflection.
  *(Follow‑up option, deliberately not done in this round to avoid a schema
  change: add a `reflection_versions` table to preserve prior text.)*
- **Is the original preserved?** No — see above. The previous text is replaced.
- **Does it change identity traits?** Yes — after refining, the identity for that
  artwork is regenerated from the new reflection text.
- **Can future Chat / Identity analysis use it?** Yes — the refined reflection is
  the one Chat cites and the one identity generation reads from.

## Regenerate (`POST /api/reflection/regenerate`)

Body: `{ artwork_id? }` (optional)

- **Which artwork?** The artwork given by `artwork_id` (ownership‑checked). If
  omitted, it falls back to the user's most recent artwork. *(Round‑1 fix:
  previously it always targeted the latest artwork regardless of what the user
  was viewing.)*
- **Does it replace the existing reflection?** Yes — regenerates from the
  artwork's title/description and overwrites the reflection (`type = "regenerated"`).
- **Does it create a new version?** No (same reasoning as Refine).
- **Does it use previous user feedback?** No — regenerate produces a fresh
  reflection from the artwork metadata and does not incorporate prior refine
  input. Use **Refine** when you want feedback applied.
- **Does it affect identity analysis?** Yes — *(Round‑1 fix)* it now refreshes the
  derived identity, matching Refine. Confirmed/rejected trait decisions are
  preserved across this regeneration (see Issue 8 handling in
  `identity_service.generate_for_reflection`).

## Summary

| | Refine | Regenerate |
|---|---|---|
| Uses user feedback | ✅ yes | ❌ no |
| Overwrites reflection | ✅ yes | ✅ yes |
| Preserves original text | ❌ no | ❌ no |
| Refreshes identity | ✅ yes | ✅ yes (fixed) |
| Targets a specific artwork | ✅ (by reflection) | ✅ (by `artwork_id`, else latest) |
