# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

F1 BOYZA is a Norwegian-language static website for tracking an F1 fantasy league among friends. It displays race calendars, driver/team standings with charts, penalty points, a "spin the wheel" feature for selecting the next race, and various fun/stats features.

**Players (nicknames used throughout):** Frenzy, Gorba, Antonio, Dave

## Commands

```bash
npm start          # Start dev server with hot reload (opens browser automatically)
npm run build      # Production build to dist/ folder
```

No test suite is configured.

## Architecture

### JS Module System
`js/app.js` is the webpack entry point. It imports all page modules and calls their `init*()` functions on `DOMContentLoaded`. Each module guards against running on the wrong page by checking for required DOM elements, so all modules are safely initialized on every page load.

**All modules:**
- `js/modules/api.js` — shared `fetchData(url)` wrapper
- `js/modules/navigation.js` — sticky nav + active link highlight
- `js/modules/countdown.js` — live countdown on `index.html` hero, fetches `data/datoer.json`. Renders individual flip-animated digit elements (`.flip-digit`). Adds `body.race-weekend` class when countdown reaches 0 (triggers pulsing red border site-wide)
- `js/modules/slider.js` — fade image carousel on `index.html`
- `js/modules/homepage.js` — index.html-only: trash talk generator (weighted: Dave 50%, Gorba 30%, Frenzy 10%, Antonio 10%). Large pool of lines per player.
- `js/modules/calendar.js` — race calendar on `kalender.html`, fetches `data/kalender.json`. Shows country flags, race numbers, sprint badges, next-race highlight, staggered fade-in animation
- `js/modules/dates.js` — race dates table on `kalender.html`, fetches `data/datoer.json`
- `js/modules/results.js` — Chart.js line charts (straight lines, gradient fill) + standings tables (with player avatars + gap column) + fun stats + dominance meter on `resultater.html`. Fetches both `data/resultater.json` and `data/kalender.json`. Driver rows are clickable (opens modal)
- `js/modules/headtohead.js` — head-to-head comparison chart on `resultater.html`, fetches `data/resultater.json`
- `js/modules/modal.js` — driver profile modal (injected into DOM). Called by `results.js` on driver row click. Shows points, wins, poles, best/worst round
- `js/modules/penalties.js` — horizontal bar chart + penalty table on `straff.html`, fetches `data/straff.json`. Worst offender gets a pulsing 🚨 SKAM badge
- `js/modules/wheel.js` — canvas spin wheel on `Spinthatshit.html`, fetches `data/kalender.json`. Fires confetti (`canvas-confetti`) and Web Audio tick sounds on spin
- `js/modules/sound.js` — Web Audio API tick sound generator used by wheel. No audio files required

### Data Files (`data/`)
JSON files fetched client-side at runtime.

**`data/kalender.json`** — keyed by season (`"2025"`, `"2026"`), each an array of:
```json
{ "navn": "Bahrain", "podium": "Pole: X, Racevinner: Y", "kjort": true }
```
`kjort: true` = completed. `podium` is free-text. Sprint weekends have `[Sprint]` in `navn`. **No dates here** — dates are in `datoer.json` (deliberately separate so the wheel track selection stays secret).

**`data/datoer.json`** — race dates only, keyed by season. Used by countdown. Update this when the real calendar is confirmed:
```json
{ "2026": [{ "runde": "R1", "dato": "2026-03-22" }, ...] }
```

**`data/resultater.json`** — cumulative fantasy points:
```json
{
  "runder": ["R1", "R2", ...],
  "forere": [{ "navn": "Antonio", "poeng": [7, 7, 22, ...] }],
  "lag":    [{ "navn": "Ferrari", "poeng": [15, 23, 49, ...] }]
}
```
Points arrays are cumulative totals. `poeng[last]` is the season total.

**`data/straff.json`** — penalty points:
```json
{ "penaltyPoints": [{ "fører": "Antonio", "poeng": 1, "runde": "R3", "beskrivelse": "..." }] }
```

### Player colors (used for avatars in standings + chart datasets)
```js
Frenzy:  '#990000'  // red
Gorba:   '#22c55e'  // green
Antonio: '#8b5cf6'  // purple
Dave:    '#eab308'  // yellow
```
Defined as `PLAYER_COLORS` in `results.js`.

### Styling
Single CSS file at `css/style.css`. CSS variables: `--red: #990000`, `--dark`, `--gray`, `--light`, `--gold`, `--silver`, `--bronze`. Uses **Barlow Condensed** (Google Fonts) throughout.

### Key CSS classes
- `.race.done` / `.race.not-done` / `.race.next-up` — calendar row states
- `.pos-1/2/3` — gold/silver/bronze on standings rows
- `.leader-badge` — red "Leader" chip
- `.shame-badge` — pulsing red "Skam" chip on worst penalty offender
- `body.race-weekend` — triggers pulsing red border via `::before` pseudo-element
- `.modal-overlay.open` — driver stats modal visible state
- `.flip-digit` / `.flip-digit.flip` — countdown digit elements with flip animation
- `.player-avatar` — colored circle with player initial in standings rows
- `.gap-cell` — points gap to leader column in standings tables

### Build
Webpack merges `webpack.common.js` with env-specific configs:
- Dev (`webpack.config.dev.js`): inline source maps, webpack-dev-server from `./` root
- Prod (`webpack.config.prod.js`): `MiniCssExtractPlugin`, `HtmlWebpackPlugin` for all 5 HTML pages, `CopyPlugin` copies `img/`, `data/`, icons, manifests to `dist/`

**npm dependencies:** `chart.js` (charts), `canvas-confetti` (spin wheel), `copy-webpack-plugin@^12` (prod build — must stay at v6+ for object-syntax API).
