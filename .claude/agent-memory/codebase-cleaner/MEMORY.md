# F1 BOYZA Codebase Cleaner — Agent Memory

## Project Conventions
- Norwegian language throughout all HTML and data files. Never translate or autocorrect content.
- CSS variables: `--red`, `--dark`, `--gray`, `--light` (all lowercase, all in use).
- Data files live in `data/` as `.json` files (e.g., `data/kalender.json`, `data/resultater.json`, `data/straff.json`).
- JS modules live in `js/modules/`. Entry point is `js/app.js`.
- All 5 HTML pages share identical nav structure with `.menu-toggle` and `#navLinks`.
- Webpack: `webpack.common.js` (shared), `webpack.config.dev.js` (dev), `webpack.config.prod.js` (prod).

## Architectural Decisions (post-cleanup)
- `initNavigation()` in `navigation.js` attaches click listeners to `.menu-toggle` — no `onclick` attributes, no `window.toggleMenu`.
- Slider images now live in `img/` (moved from root). Paths in `slider.js` use `img/` prefix.
- `webpack.config.prod.js` CopyPlugin uses `{ from: 'img', to: 'img' }` to cover all images — no individual entries needed for slider images.
- `webpack.config.dev.js` has no `module.rules` block — CSS loader is inherited from `webpack.common.js`.

## Known Issues Fixed (Session 1)
- Deleted orphaned root-level `kalender`, `resultater`, `straff` files (no extension, stale duplicates).
- Merged duplicate `<footer>` tags in `index.html`.
- Fixed `innerHTML +=` in loops in `calendar.js`, `results.js`, `penalties.js` — all now accumulate a string and assign once.
- Removed `window.toggleMenu` global; replaced with `initNavigation()` event listener pattern.
- Added missing CSS rules: `.hero.small`, `.container.single`, `.season-select`, `.race-name`.
- Fixed nav label in `Spinthatshit.html`: was "Spin the Wheel", now "Spin that SHIIIT".
- `slider.js` now stores `setInterval` return value in `intervalId`.

## Files by Cleanliness
- `js/modules/api.js` — not yet audited
- `js/modules/wheel.js` — not yet audited
- `css/style.css` — clean after session 1 additions
- `js/app.js` — clean after session 1 updates

## See Also
- (no additional topic files yet)
