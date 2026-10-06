# OrigoVero · Digital Product Passport (mobile), Cards style

A static page for the **OrigoEV 75kWh Traction Battery** passport (`SCT-BAT-006`), built 1:1 from the final Cards frames in the Figma file
*OrigoVero Digital Product Passport — mobile*: `Passport / Battery — Cards (tabs + language)` plus its states
(scrolled with tabs, language list, FAQ expanded, Journey step expanded). No build step, no dependencies.

The Swiss (black and white) version of the same page lives in the sibling repo `OrigoVero-`.

```
index.html   semantic markup, icon sprite, language sheet (<dialog>)
styles.css   tokens and all component styles
app.js       section tabs that follow the scroll, language sheet, report-form states
assets/      origovero-wordmark.svg (exported from Figma)
```

## Run

```bash
python -m http.server 8771
```

Open `http://localhost:8771` and use a 402 px wide viewport (the Figma frame width).

## What maps to what

| Figma | Code |
|---|---|
| Frame `Passport / Battery — Cards (tabs + language)` (402 px) | `.page` (max-width 402 px, centred), cards sit on a 12 px edge with 12 px gaps |
| `Header` (top bar 64 + `Section tabs` 48) | `.header` (sticky), `.topbar`, `.tabs` |
| `Language button` (white disc, "EN") | `.lang-btn` opens `#lang-sheet` |
| `Section tabs`: active tab = SemiBold + 3 px gold rule over a 3 px track | `.tab[aria-current="true"]`, `.tabs::after` |
| `Hero card` (ink) with `Meta` rows (icon + text pairs) | `.hero`, `.meta` |
| `State of health` (soft gold card) | `.fact` |
| `Timeline` card with `Step / …` rows (rail, date, stage, place, panel) | `.timeline`, `.step` with a `<details>` per step; the current step has the gold dot with halo |
| `Stat / Carbon footprint` (ink card) | `.carbon` |
| Recycled-lithium row with its two parts | `.kv__row--parts` |
| `Key-value` cards | `.kv` (128 px label column) |
| `Note`, FAQ cards, `Form` | `.note`, `.faq`, `.form` |
| `Language sheet` (640 px, rounded top, list of 11 languages, scrim 45 %) | `<dialog class="lang-sheet">` |
| Interaction states sheet | `:active` (pressed: gold 50 tint, button darkens), `.btn[aria-busy]` (loading), `.is-invalid` (error), `:focus` on fields (editing) |

Heights were checked against Figma: header 112, hero card 462, state of health 208, Journey 960, carbon card 140,
Care 244, Good to know 384, Report 592, footer 40. Impact and Specifications measure 1–2 px short in browsers that draw 1 px borders thinner than 1 px.

## Behaviour

- **Tabs** scroll sideways; the active tab changes as you scroll and the strip keeps it in view. An anchor jump leaves 24 px between the header and the section title.
- **Language** is UI only: choosing a language updates the button (`EN` → `DE`), remembers it in `localStorage` and closes the sheet. The copy itself is not translated and `<html lang>` is left as is.

## Colour

Logo colours only: ink `#1B1B19` and gold `#D4AF37`, plus tints of the gold (`#EEDFAF`, `#F4EBC9`, `#FAF7EB`) on warm neutrals.
Saturated gold marks actions and markers (button, tab rule, timeline dot); the soft tints mark state (state-of-health card, current language, pressed rows).

## Differences from the Figma file (deliberate)

- **Keyboard focus ring** (2 px ink) is kept for accessibility, although the Figma state sheet does not draw it.
- **Header is sticky**; Figma frames are static.
- **Carbon footprint study** is drawn as a link with an arrow (↗), as in Figma, but there is no URL for it in the data: the link does nothing until the brand supplies one (`data-todo="carbon-study-url"` in `index.html`).
- **Link arrows** are SVG icons instead of the ↗ text glyph, so they look the same in every browser.
- **Photo** is hot-linked from origovero.com; replace it with a local asset.
- **Report form** has no backend. Submit simulates the loading state, then shows a confirmation.
- **Language list** (English, Svenska, Nederlands, Deutsch, Français, Español, Italiano, Polski, Dansk, Suomi, Українська) is a placeholder set from the mockup.
