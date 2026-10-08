# Browse by Budget — 2026-10-08

The current repository was rechecked before editing: HEAD `f31592c`, clean working tree. The user approved replacing only the homepage Trend Cars section with the supplied Browse by Budget design and confirmed that backend `carPrice` values are US dollars.

## Six-visible-card clarification — 2026-10-08

The latest user clarification supersedes the historical six-plus-two pagination below. Desktop shows cards 1–6 initially and cards 3–8 after the right arrow. Removed the artificial trailing offset and its init/breakpoint/resize callbacks; existing Swiper advances two cards above 1200px. At the end only the left arrow appears; returning restores the first six and the right arrow. Mobile keeps one-card navigation and touch swipe.

Swapped only the image references for card 6 (Under $75K, now yellow) and card 8 (Any Budget, now silver). Eight category labels, USD filters, routes, assets, architecture and backend logic remain unchanged.

Validation passed: Yarn typecheck, lint (0 errors, 194 existing warnings), migration/auth tests, live validation of 42 GraphQL operations, all eight read-only budget inquiries, and production build (88 pages). Production browser checks verified six visible cards in both desktop positions, arrow visibility, swapped images, all eight actual links, mobile arrows/swipe, responsive widths and Korean/Russian labels with no uncaught exceptions. Updated desktop, second-position and mobile screenshots are in docs/screenshots. Development continues using the separate .next-dev output.

## Historical eight-card pagination follow-up — 2026-10-08

The user subsequently requested eight cards and desktop pages of six followed by only the remaining two. Added $40K and $75K categories in price order, with new green and silver illustrations and localized labels. First page: $10K/$20K/$30K/$40K/$50K/$75K. Second page: $100K/Any Budget.

Existing Swiper now groups six cards above 1200px and uses trailing space to avoid clamping the last page into another six-card window. Init/breakpoint/resize handlers keep that spacing aligned to the actual slider width. At smaller widths, one-card navigation and touch swipe remain. Disabled previous/next controls are hidden in both directions: only right on the first desktop page, only left on the final page. No empty cards, custom pagination framework or backend change was added.

Yarn typecheck, lint (0 errors, 194 existing warnings), migration/auth tests, live GraphQL checks and isolated production build (88 pages) passed again. Production Chrome verified exactly six visible cards, exactly two after a real right-arrow click, hidden right/visible left, and restoration after left-arrow click. All eight actual category links, 390/320px mobile navigation/swipe, intermediate desktop widths and Korean/Russian labels passed with no runtime exceptions. Read-only queries checked all eight inquiries; all eleven translation keys exist in all locales.

Updated previews: `home-budget-desktop.png`, `home-budget-page2.png`, `home-budget-mobile.png` in `docs/screenshots`. Two additional built-in image_gen assets (`budget-green.png`, `budget-silver.png`) are in `public/img/car/budget`; exact prompts were added to `BUDGET_IMAGE_PROMPTS.json`. The original six-card implementation and validation below are retained as historical context. No source refactoring, dependency/lockfile, backend code or database changes were made.

## Changes

- Added `libs/components/homepage/BrowseByBudget.tsx` in the existing homepage folder. It uses MUI, Next links/images, the existing Swiper dependency, Navigation/Keyboard/A11y modules and local category configuration.
- Replaced the TrendCars import and its desktop/mobile mounts in `pages/index.tsx`. Existing TrendCars/TrendCarCard files were retained; other homepage sections and the header remain unchanged.
- Added scoped responsive styles in the existing `scss/pc/homepage/homepage.scss`, shared by the existing desktop/mobile layout wrappers. Six cards fit on wide screens; narrower screens allow touch, keyboard and arrow navigation. Arrows disable when no further categories exist.
- Added nine translation keys in the existing English/Korean/Russian common dictionaries.
- Generated and saved six matching automotive studio photos in `public/img/car/budget/`: blue, orange, red, slate, white and yellow. Images are illustrative category artwork, not backend inventory or a claim about a specific model's price. Next Image provides responsive delivery; the optional sharp package was not installed, and Next's existing fallback optimizer served the tested images successfully.

## Data and contracts

| Category | Existing CarsInquiry search |
| --- | --- |
| Under $10K | `pricesRange: { start: 0, end: 10000 }` |
| Under $20K | `pricesRange: { start: 0, end: 20000 }` |
| Under $30K | `pricesRange: { start: 0, end: 30000 }` |
| Under $50K | `pricesRange: { start: 0, end: 50000 }` |
| Under $100K | `pricesRange: { start: 0, end: 100000 }` |
| Any Budget | Empty search, with no price restriction |

Each link opens `/car` with page 1, limit 9, sort `carPrice` and exact GraphQL direction `ASC`. The existing Cars page parses the inquiry and queries real listings through GET_CARS. Budget categories are nested ceilings; backend bounds are inclusive (`$gte`/`$lte`). No product records, availability counts, conversion rates or new Car fields are hardcoded.

The screenshot's won labels were intentionally adapted to USD after the user's explicit currency answer. No exchange-rate conversion or backend currency field was invented. Live data currently returns zero matches for these five ceilings and one result for Any Budget; an empty filtered result is expected for the current dataset. No inventory data was changed.

## Architecture and validation

The existing NESTAR homepage folder/layout HOC, Pages Router, Swiper, MUI, SCSS and i18n organization are preserved. No new architecture, dependency, GraphQL operation, shared utility or backend business-code change was introduced. The approved section's visual/content replacement is the only intended departure from the previous Trend Cars UI.

- Yarn typecheck, lint, existing migration/auth tests and live GraphQL checks passed. Lint: zero errors, 194 existing warnings. Live validation: 42 operations, three inline uploads and registered enums.
- Production Next build passed with 88 localized pages. Historical correction: the temporary QA wrapper did not isolate output as assumed; builds wrote to `.next`. The cache conflict and subsequent permanent dev/build separation are documented in [DEV_BUILD_CACHE_FIX.md](DEV_BUILD_CACHE_FIX.md).
- Additional read-only live queries tested all six category inquiries, actual price ceilings, unbounded Any Budget and ascending price order. All nine new translation keys exist in all three locales.
- Headless Chrome production checks passed for all six real card clicks and serialized inquiries, desktop 1690px, mobile 390px/320px, actual mobile device detection, previous/next buttons, touch swipe, Korean/Russian labels, loaded images and absence of horizontal overflow. No uncaught runtime exceptions were observed. The in-app browser runtime had no available browser; a separate temporary headless profile was used.
- `git diff --check` passed. Screenshots: `docs/screenshots/home-budget-desktop.png` and `home-budget-mobile.png`.

## Generated assets

Mode: built-in `image_gen`, six separate generation calls. Final files: `public/img/car/budget/budget-{blue,orange,red,slate,white,yellow}.png`. Original generated files were retained. Exact final prompts, modes and saved paths are recorded in [BUDGET_IMAGE_PROMPTS.json](BUDGET_IMAGE_PROMPTS.json).

Further homepage sections, Cars UI/forms, comments, authentication and backend defects remain outside this slice. Backend documentation only was updated in its actual `docs/COMPLETED_TASKS.md`; `docs/ai` does not exist. No dependencies, lockfiles, database records or Git commits were changed.


## Popular typography alignment — 2026-10-08
Trending Cars and Browse by Budget headings match existing Popular Cars desktop typography exactly: Poppins, 34px, weight 500, 150% line height, -0.646px letter spacing, #181a20. Added existing translated Trend is based on likes subtitle under Trending, matching Popular subtitle typography. Responsive 25px mobile headings retained. Existing GraphQL carLikes DESC ordering, >=1 like AND >=2 views eligibility, Budget filters and arrow behavior unchanged; no data writes or backend source changes. Typecheck, lint (190 existing warnings/no errors), migration/auth tests, live GraphQL and 88-page build passed. Real browser compared computed typography for all three headings, verified like subtitle and descending real counts, four cards, 816px desktop height, responsive mobile and no exceptions. Updated live Trending screenshots.
