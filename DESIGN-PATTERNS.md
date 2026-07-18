# Design pattern library

Source of truth for the reusable UI patterns extracted from the imported
Claude Design file `Collector Identity.dc.html`. Classes live in
[`frontend/src/styles/patterns.css`](frontend/src/styles/patterns.css)
(imported globally via `main.jsx`). Pages should consume these classes
rather than re-deriving one-off styles.

If a fresh session picks this up: the full audit (per-page checklist of
what's missing/wrong vs. the design) and this pattern catalogue were
approved before any page implementation started. Implementation order:
Dashboard → Identity → Add Artwork → My Artwork → Reflections → Profile →
Settings → Compare → Timeline → Chat. Check `TaskList` / the conversation
for which pages are already done.

All tokens referenced below are defined in `frontend/src/redesign.css`
(`:root` and `[data-mode="dark"]`) — see that file for exact values.
Never hardcode a hex color; always read a token.

---

## 1. Section eyebrow — `.pattern-eyebrow`
Small-caps letterspaced label. The **only** place ALL CAPS is allowed —
everywhere else in the app is sentence case.
- Type: 11px, weight 700, `letter-spacing: .28em`, `text-transform: uppercase`
- Color: `--text-faint` (neutral) or `--accent-hover` via `.pattern-eyebrow--accent` (emphasis)
- Spacing: `margin-bottom: 8px` (compact) / `.pattern-eyebrow--hero` → 22px

## 2. Page title — `.pattern-title`
In-card titles. The route-level page title is already rendered by the
sidebar topbar (`Layout.jsx` → `PAGE_META`) — don't duplicate it inside
page content unless the design shows a second, card-scoped title.
- Type: Playfair Display, 26px, weight 600, `letter-spacing: -0.01em`
- Color: `--text-primary`

## 3. Pull-quote block — `.pattern-quote`
Large italic serif statement (Dashboard's identity statement, Identity's
"Through-Line" hero).
- Type: Playfair Display italic, weight 500, 34px / `line-height: 1.32`
- Hero variant `.pattern-quote--hero`: 44px, centered, `max-width: 900px`
- Inline emphasis: wrap the emphasized span in `.pattern-quote-emphasis` (→ `--accent-hover`)
- Color: `--text-primary`; `max-width: 780px` (non-hero)

## 4. Metric card — `.pattern-metric-card`
Stat tile (Dashboard's Works/Reflections/Dominant tone/This month row).
- Card: `--card-bg` bg, `--border-subtle` border, `border-radius: 14px`, `padding: 24px 26px`, `--shadow-sm`
- `.pattern-metric-label`: 11px uppercase weight 700, `--text-faint`
- `.pattern-metric-value`: Playfair 40px weight 600, `--text-primary`
- `.pattern-metric-note`: 12px, `--text-secondary`
- Layout: grid, `repeat(auto-fit, minmax(210px, 1fr))`, gap 20px

## 5. Donut ring — `.pattern-donut` (+ `-center` / `-value` / `-sub`)
**Proportion charts only** — traits/emotions distribution, similarity
score. Time-series data (Timeline's intensity chart) stays a line chart,
just recolored to tokens — do not convert it to rings.
- Ring: `conic-gradient()` or Chart.js `Doughnut` with a high `cutout` (thin ring), colored from `--seg-1` … `--seg-5`
- Center hole: `inset: 15%`, `--card-bg` background
- Center value: Playfair 32-42px weight 600; sub-label 11px `--text-secondary`
- Must re-render on light/dark toggle — see "Chart mode-sync" below

## 6. Selector chip — `.pattern-chip` (+ `--active` / `--outline`)
Trait chip lists, suggested-prompt chips, artwork tag pills.
- Base: `--card-bg` bg, `--border-subtle` border, `border-radius: 999px`, `padding: 7px 15px`, 12.5px weight 500, `--text-secondary`
- Active: `--accent-subtle` bg, `--accent-hover` text, weight 600
- Outline (`--outline`): transparent bg, dashed border — use where filled-vs-outlined must carry meaning without color (e.g. Compare's added/removed chips instead of green/red)
- `.pattern-chip-prefix`: bold `+`/`−` prefix, same purpose as outline variant

## 7. Trait card with score bar — `.pattern-trait-card`
Expandable trait card (Identity page). Replaces the old
`id2-trait-cell` toggle-grid and its green "ACTIVE" badge — no badge
at all in this pattern, just name + score + bar + expand.
- Card: same surface as metric card, `cursor: pointer`
- Open state (`--open`): border → `--accent`, shadow → `--shadow`
- `-name`: Playfair 19px weight 600 · `-score`: Playfair 15px weight 600 `--accent-hover`
- `-chevron`: rotates 90° open, color `--text-faint`
- `-bar-track`: 4px, `--border-subtle` · `-bar-fill`: `--accent`
- `-desc` (shown when open): 13.5px, `--text-secondary`

## 8. Nav item — `.side-nav-item` (existing, `Layout.jsx` / `redesign.css`)
Not duplicated in patterns.css. Active state: `--accent-subtle` bg,
dot indicator in `--accent`, text `--text-primary`; inactive text
`--text-secondary`.

## 9. Empty state — `.pattern-empty` (+ `-icon` / `-title` / `-desc`)
- Icon: 56px circle, `--accent-subtle` bg, `--accent-hover` icon color
- Title: Playfair 21px weight 500 · Desc: 14px `--text-secondary`, `max-width: 340px`

## 10. Form field — `.pattern-field` (+ `-label` / `-input` / `-input--title`)
- Label: 11px uppercase weight 700, `--text-secondary`, `margin-bottom: 9px`
- Input: `--bg-main` bg, `--border-subtle` border, `border-radius: 9px`, `padding: 12px 14px`; focus → border `--accent`
- Title-scale input (`--input--title`): Playfair 17px, for name/title fields

## 11. Button — `.btn` / `.btn-primary` / `.btn-secondary` (existing, `styles.css`)
Not duplicated. Primary: `--accent` bg, fixed `#1A1915` text (dark-on-gold
regardless of mode), `border-radius: 999px`. Secondary: `--card-bg` bg,
`--border-subtle` border.

## 12. Card (generic surface) — `.card` (existing, `styles.css`)
Not duplicated. `--card-bg` bg, `--border-subtle` border,
`border-radius: 16px`, `--shadow-sm`.

---

## Supporting pattern: segmented pill toggle — `.pattern-segmented`
Not one of the 12 core patterns, but needed for Settings' theme/on-off
toggles (replaces the iOS-style switch and any traffic-light coloring).
`.pattern-segmented` is the pill track; `.pattern-segmented-btn` /
`--active` are the options (active → `--accent` bg, `#1A1915` text).

---

## Global rules (apply to every page)
- **No color outside the token file.** In particular: no `--success`/
  `--error` green/red for status or trend signaling (badges, dots,
  trend chips) — use accent-intensity or filled/outline/prefix
  distinctions instead. `--success`/`--error` may still be used for
  literal form-validation alerts (`.alert-error`, password mismatch,
  etc.) since those are genuinely different in kind from identity data.
- **Sentence case everywhere**, except `.pattern-eyebrow` text.
- No emoji as UI chrome (Settings' section icons become typographic labels).

## Chart mode-sync (Chart.js doesn't read CSS vars reactively)
Use `frontend/src/utils/useThemeMode.js`:
- `useThemeMode()` — a hook that watches `document.documentElement`'s
  `data-mode` attribute via `MutationObserver` and returns a value that
  changes identity on toggle. Use it as a `key` or `useMemo` dependency
  so Chart.js actually redraws with the new token colors.
- `readToken(name)` / `readSegmentPalette()` — read `--seg-1..5` (or any
  token) via `getComputedStyle` at render time, rather than hardcoding a
  color array.
