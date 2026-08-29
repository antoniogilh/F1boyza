# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

F1 BOYZA is a Norwegian-language static website for tracking an F1 fantasy league among friends. It displays race calendars, driver/team standings with charts, penalty points, a "spin the wheel" feature for selecting the next race, and various fun/stats features.

**Players:** Shaya, Philip, Antonio, Oddi, Dave, William

Names are now normalised everywhere — one name per player in every data file. The old aliases (Frenzy = Shaya, Cabra = Antonio, Gorba = Oddi) have been rewritten out of `kalender.json`, `resultater.json` and `straff.json`; **don't reintroduce them**, since win/pole/slam-dunk lookups match podium text against the `resultater.json` name.

**2026 teams:** Ferrari (Shaya, Philip) · Red Bull (Antonio, Oddi) · Mercedes (Dave, William)

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
- `js/modules/api.js` — shared `fetchData(url)` wrapper. Caches the promise per URL, so several modules can read the same file on one page without refetching
- `js/modules/navigation.js` — sticky nav + active link highlight
- `js/modules/status.js` — fills the status strip present at the top of every page (`#statusSeason`, `#statusRound`, `#statusFlag`) from `data/datoer.json`. Sets `body.race-weekend` when today is a race day
- `js/modules/codes.js` — no DOM; maps player and team names to the three-letter codes used in tables, the grid and race control (`Shaya` → `SHA`, `Red Bull` → `RBR`). Unknown names fall back to the first three letters
- `js/modules/countdown.js` — live countdown on `index.html` hero, fetches `data/datoer.json`. Renders one `.flip-digit` per unit; a digit flashes purple for 140 ms when it changes. Dates are compared at day resolution, so a race today shows the race-weekend state instead of counting down to the next round
- `js/modules/slider.js` — fade image carousel on `index.html`
- `js/modules/homepage.js` — index.html-only: team-radio trash talk generator + the starting grid. The grid orders drivers by championship position, or by file order before the season starts
- `js/modules/calendar.js` — race calendar on `kalender.html`, fetches `data/kalender.json`. Shows country flags, round numbers (`R01`), sprint badges, run/not-run state, staggered fade-in animation
- `js/modules/dates.js` — race dates table on `kalender.html`, fetches `data/datoer.json`. Day-resolution comparison, same as the countdown. Rounds with `dato: null` are collapsed into a single trailing summary row (`R2–R24 · Dato ikke satt`), so an unplanned season is two rows instead of twenty-four identical ones. The range label is only used when the undated rounds are actually contiguous
- `js/modules/podium.js` — no DOM; parses the free-text `podium` field in `kalender.json` into `{ pole, sprintpole, vinner, sprint, slamDunk }`. Handles `Pole: X, Racevinner: Y` (plus optional `Sprintpole:` / `Sprintvinner:` on sprint weekends) and the shorthand `X Slam Dunk`, which counts as a pole *and* a win for that player. **`sprintpole` counts as a pole** in the records and the driver modal, so a sprint weekend can yield two poles. **`slamDunk` is only true for races literally written as `X Slam Dunk`** — pole and win to the same player in the normal form is not derived as one; slam dunks are noted by hand. Used by `results.js` and `modal.js` — any new win/pole counting must go through it
- `js/modules/results.js` — Chart.js line charts (straight lines, gradient fill) + timing-tower standings tables (position, code with team colour bar, name, points, gap) + season records (most wins, poles, sprint wins, longest win streak, most slam dunks) + dominance meter on `resultater.html`. Fetches both `data/resultater.json` and `data/kalender.json`. Rows are clickable (opens modal)
- `js/modules/headtohead.js` — head-to-head comparison chart on `resultater.html`, fetches `data/resultater.json`
- `js/modules/modal.js` — driver profile modal (injected into DOM). Called by `results.js` on driver row click. Shows points, wins, poles, best/worst round
- `js/modules/penalties.js` — on `straff.html`, fetches `data/straff.json`. Renders a horizontal bar chart, a per-driver summary table (worst offender gets a pulsing SKAM badge) and a race control message log, newest first
- `js/modules/wheel.js` — canvas spin wheel on `Spinthatshit.html`, fetches `data/kalender.json`. Fires confetti (`canvas-confetti`) and Web Audio tick sounds on spin. No season selector: it always uses the newest season in the calendar and only offers races with `kjort: false`. Rotation accumulates across spins and the button is disabled while spinning
- `js/modules/season.js` — no DOM; converts `resultater.json` from per-race points to cumulative and derives team points from driver pairs. Used by `results.js` and `headtohead.js`
- `js/modules/sound.js` — Web Audio API tick sound generator used by wheel. No audio files required

### Data Files (`data/`)
JSON files fetched client-side at runtime.

**`data/kalender.json`** — keyed by season (`"2025"`, `"2026"`), each an array of:
```json
{ "navn": "Bahrain", "podium": "Pole: X, Racevinner: Y", "kjort": true }
```
`kjort: true` = completed. `podium` is free-text, parsed by `podium.js`. Recognised fields, in any order: `Sprintpole:`, `Sprintvinner:`, `Pole:`, `Racevinner:` — or the shorthand `X Slam Dunk` when the same player took both pole and win. Sprint weekends have `[Sprint]` in `navn` and carry all four fields; a sprint weekend therefore awards two poles (`Sprintpole` + `Pole`). Sprint-pole data for 2025 was reconstructed by hand and follows the sprint winner. **No dates here** — dates are in `datoer.json` (deliberately separate so the wheel track selection stays secret).

**`data/datoer.json`** — race dates only, keyed by season. Used by countdown. Update this when the real calendar is confirmed:
```json
{ "2026": [{ "runde": "R1", "dato": "2026-03-22" }, ...] }
```

**`data/resultater.json`** — fantasy points **per race**, keyed by season:
```json
{
  "2026": {
    "runder": ["R1", "R2", ...],
    "lag":    [{ "navn": "Ferrari", "farge": "#e8002d", "forere": ["Shaya", "Philip"] }],
    "forere": [{ "navn": "Shaya", "lag": "Ferrari", "poeng": [25, 18, ...] }]
  }
}
```
`poeng[i]` is what that player scored in race `i` — **not** a running total. To record a race, append one number per driver; nothing else needs updating.

A team with no `poeng` list gets its points summed from the drivers in `forere` (this is how 2026 works). A team that *has* a `poeng` list keeps it — 2025 does, because its two-team points don't equal the driver sums.

`js/modules/season.js` converts per-race → cumulative once at load via `normaliserSesonger()`, so `results.js`, `modal.js` and `headtohead.js` all keep working with running totals (`poeng[last]` = season total). **Any new module reading this file must run it through `normaliserSesonger()` first.**

Note the array order is the order races were actually driven (chosen by the wheel), which is not calendar order.

**`data/straff.json`** — penalty points:
```json
{ "penaltyPoints": [{ "fører": "Antonio", "poeng": 1, "runde": "R3", "beskrivelse": "..." }] }
```

**Deliberately not keyed by season.** Like real F1 penalty points, these run on a rolling window: a penalty given in R*n* expires when R*n* comes around again the following season. So the file holds only the currently active penalties across the season boundary, and expired entries are deleted by hand as the rounds roll past. `runde` is therefore never season-qualified, and each round number can only be present once at a time.

### Player colors (fallback when a season has no teams)
```js
Shaya:   '#e8002d'  // red        Philip:  '#f97316'  // orange
Oddi:    '#22c55e'  // green      William: '#06b6d4'  // cyan
Antonio: '#8b5cf6'  // purple
Dave:    '#eab308'  // yellow
```

`fargeFor()` in `results.js` resolves a colour in this order: the driver's team colour (`lag[].farge`), then `PLAYER_COLORS`, then the generic `COLORS` palette. It drives both the chart lines and the team colour bar in the standings; the second driver in each team pair is drawn dashed so the pair can be told apart.

### Styling
Single CSS file at `css/style.css`. The whole site is styled as a **live timing screen**: dark blue-black monitor, monospace numerals, and a colour language where every colour carries one meaning.

```
--screen #05070d   --panel #0c111b   --raised #131b28   --rule #1d2532
--text   #e9eff8   --dim   #8792a6   --dimmer #6f7d94
--purple #b026ff   raskest / leder / aktiv   (--purple-ink #cb7bff for tekst)
--green  #00d47f   kjørt / fullført
--yellow #ffd320   neste / varsel
--red-hot #ff2d1a  straff / rødt flagg
```

Everything not carrying one of those four meanings is greyscale. Both grey tones are contrast-checked against `--panel` (6.0:1 and 4.5:1); the accents are only used as text via `--purple-ink`, since the raw accents fall below 4.5:1 at label sizes. Team colours appear as a 3px bar, never as small text — Ferrari red and Red Bull blue both fail contrast at 9px.

Three type roles, all variable-width Google Fonts:
- `--display` **Anybody** (expanded, 800–900) — wordmark and page titles only
- `--data` **Martian Mono** — every number, code, label and status word
- `--body` **Archivo** — sentences

### Key CSS classes
- `.statusbar` + `.status-flag` (`.caution` / `.idle`) — the broadcast status strip on every page
- `.panel` / `.panel-head` / `.panel-body` — the standard content block; `.span-2` makes it full width in the two-column grid
- `.grid-slots` / `.grid-slot` — the signature starting grid on the front page; even slots are offset with `margin-top` to stagger like a real grid. `--team` on the slot sets the colour bar
- `.race.done` / `.race.not-done` — calendar row states
- `.standings-table` — the timing tower. **Cell rules must be written as `.standings-table .pos-cell`**, since a bare `.pos-cell` loses to `.standings-table td` on specificity
- `.pos-1` — purple position number on the leader's row
- `.leader-badge` / `.shame-badge` — outlined chips in purple and red
- `.rc-msg` — a race control message on `straff.html`
- `.flip-digit.flip` — a countdown digit lighting up for 140 ms as it changes
- `body.race-weekend` — turns the status strip yellow
- `.modal-overlay.open` — driver stats modal visible state

### Build
Webpack merges `webpack.common.js` with env-specific configs:
- Dev (`webpack.config.dev.js`): inline source maps, webpack-dev-server from `./` root
- Prod (`webpack.config.prod.js`): `MiniCssExtractPlugin`, `HtmlWebpackPlugin` for all 5 HTML pages, `CopyPlugin` copies `img/`, `data/`, icons, manifests to `dist/`

**npm dependencies:** `chart.js` (charts), `canvas-confetti` (spin wheel), `copy-webpack-plugin@^12` (prod build — must stay at v6+ for object-syntax API).
