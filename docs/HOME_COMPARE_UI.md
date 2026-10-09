# Premium homepage comparison — 2026-10-09

This approved redesign supersedes the historical UI notes below. It changes the homepage selector and its picker incrementally; the existing `/car/compare?ids=...` results route and table presentation remain intact. Other homepage sections and unrelated working-tree changes are preserved.

### Empty-state visual refinement

Empty cards now have a 320px minimum height with balanced plus/title/button spacing, localized Select a Vehicle / Choose a car to compare / Browse Cars copy, and subtle orange hover/focus borders and shadows. Desktop grid items stretch to match selected cards without reducing the selected-card layout. The action area has a clearer selection counter, a consistent divider and spacing, and equal-width aligned mobile controls. Reduced-motion preferences disable card transitions. Comparison logic, picker, restoration, queries and results styling are unchanged. Yarn typecheck passed.

Focused isolated-browser checks passed at 1440px desktop, 768px tablet and 390px mobile, including EN/KR/RU copy, empty-card height, hover shadow, action alignment, real listing images, specifications and Replace/Remove control bounds. Existing preview files were preserved; refinement screenshots are temporary QA artifacts.

## Implemented behavior

- Localized SMART COMPARISON label, Compare Cars. Choose Smarter. heading and supporting copy; existing Poppins typography, white background, charcoal headings, orange accent and 1300px maximum width.
- Three equal rounded desktop cards, two-column tablet layout and stacked mobile layout. Empty cards have dashed borders, plus icons and outlined Add Car controls. Selected cards use actual API images, brand/model, existing USD price formatting, year, optional mileage, fuel and transmission. Missing mileage stays Not provided; no specifications are invented.
- Maximum three distinct listings, minimum two for Compare Now, individual removal, atomic replacement, Clear All and a live selection counter. Cancelling replacement preserves the original car. Validation uses the latest selection state.
- Responsive MUI dialog with fresh GET_CARS results, thumbnails, year/price, Select controls, debounced escaped search and nine listings per page. Selected IDs are excluded only from displayed rows; page counts use the unchanged server total. Empty selectable pages retain pagination. Loading, API errors and retry are supported.
- Three slot IDs persist under `anorcar.compare.selection` in sessionStorage. Restoration shows skeletons rather than empty slots. Complete Apollo cache entries avoid GET_CAR requests; missing entries use a shared per-client, per-ID pending request. Generation and slot revisions reject responses made stale by selection, replacement, removal, Clear All or unmount. Confirmed missing/sold/deleted listings are cleared; network failures retain IDs and allow retry. Blocked storage leaves selection usable in memory.
- Homepage SCSS is scoped to `.compare-home-premium`; the existing results table does not receive these styles. The shared card's Replace control is optional and omitted on results.
- EN/KR/RU copy, labeled controls, keyboard dialog opening, focus containment, Escape cancellation and focus return.

## Current verification

- Yarn typecheck passed after each implementation phase and at completion.
- `yarn test:compare` passed existing comparison invariants and new deferred-response/cache tests: add/remove/replace/Clear All/unmount races, Strict Mode replay, out-of-order responses, deduplication, retry, unavailable listings, invalid replacement, complete cache restoration and USD formatting.
- Production `yarn build` passed and generated all 91 localized pages. Existing repository lint warnings remain.
- Isolated real-inventory browser QA passed at 390px, 768px, 1440px and 2796px, plus KR/RU desktop. Verified search, unchanged server totals, exclusion, replacement/cancellation, min/max selections, existing results route, refresh persistence and cache restoration without extra GET_CAR requests. A delayed GET_CAR test verified loading skeletons and Clear All protection from late responses. Focused blocked-storage and keyboard checks passed using `COMPARE_QA_RESILIENCE_ONLY=1 node scripts/qa-car-compare.cjs`. Search focus is applied after the MUI dialog transition; its title has one unique ID. The final production build passed after this accessibility fix.
- No new dependencies, backend schema changes, currency conversion, commit or deployment.

## Remaining contract limitation

GET_CAR may record a view for an authenticated user when a new view is recorded. GET_CARS does not record views, but has no arbitrary-ID filter. Consequently, uncached restoration can cause that existing view side effect; requests are limited and deduplicated, not guaranteed side-effect free. Cached entries are snapshots, not guaranteed fresh inventory. The existing results page performs fresh availability checks. A guaranteed fresh, view-free bulk restoration endpoint would require a separate backend change. Picker validation uses the latest returned API snapshot; availability can change after that response.

## Modified files for this implementation

- `libs/compareSelection.ts` and `libs/hooks/useCompareSelection.ts`
- `libs/components/homepage/CompareCars.tsx`
- `libs/components/car/CompareEmptySlot.tsx`, `CompareCarCard.tsx`, `CarComparePicker.tsx`
- `scss/pc/homepage/compare-home.scss` and `scss/pc/main.scss`
- `public/locales/en/common.json`, `public/locales/kr/common.json`, `public/locales/ru/common.json`
- `package.json`, `scripts/check-compare-restoration.cjs`, `scripts/qa-car-compare.cjs`
- This document and `docs/screenshots/compare-premium-*.png`
- Backend handoff notes: `anorcar/docs/COMPLETED_TASKS.md` (documentation only)

Pre-existing edits to `scss/pc/homepage/compare.scss` and the older `compare-empty-*.png` files were preserved, not rewritten by this implementation.

## Current previews

- [Empty desktop](screenshots/compare-premium-empty-desktop.png)
- [Selected desktop](screenshots/compare-premium-selected-desktop.png)
- [Selection dialog](screenshots/compare-premium-picker-desktop.png)
- [Restoration skeletons](screenshots/compare-premium-restoring-desktop.png)
- [Empty mobile](screenshots/compare-premium-empty-mobile.png)
- [Selected mobile](screenshots/compare-premium-selected-mobile.png)
- [Selected tablet](screenshots/compare-premium-selected-tablet.png)
- [Existing results page](screenshots/compare-premium-results-desktop.png)

---

# Historical comparison notes — 2026-10-09

The latest user references supersede the earlier comparison UI. The homepage Popular Cars position now contains the comparison selector in both desktop and mobile branches. Existing Pages Router, layout HOCs, Apollo/GraphQL, MUI, shared Car types/enums, SCSS and EN/KR/RU integration are preserved.

## Current behavior

- Three empty slots: numbered Add Car 1/2, grey side-view sedan silhouettes with spoke wheels, thin rectangular borders, and a shorter pale optional third slot with an overlay action. Typography and spacing follow the supplied reference. Removed selection counts, progress dots, explanatory copy and button icons.
- Numbered Add Car buttons turn ANORCAR orange with white text on hover and show the Add Car to Compare tooltip. Compare Cars is grey with white text until at least two cars are selected.
- Every slot retains its position. Selecting the optional third car first works. Duplicate IDs, overwriting occupied slots and a fourth selection are prevented.
- Select Brand/Model uses a rectangular MUI dialog, plain search placeholder, close control and a scrollable list containing brand/model names only. No years, prices, add icons, counts, stripes or pagination.
- Opening the picker with no query displays the visitor's recent searched listings. A new browser with no history shows an empty-history prompt. History is bounded to 20 listings under the dedicated `anorcar.compare.recent-searches` browser key; storage failure does not prevent searching or selection.
- Searches use existing GET_BRANDS and GET_CARS. Brand fragments resolve to brandIds; other text uses the existing model/title filter. Regex characters are escaped. Up to 50 matching real listings are available in the scroll list. Clicking a row selects it and closes the picker.
- Compare Cars navigates to `/car/compare?ids=...`. The standalone page contains the existing navbar, comparison section and footer. It has no homepage sections, hero or chat. LayoutFull defaults stay unchanged for other routes.
- URL IDs are validated, normalized, deduplicated and capped at three. The page loads the selected cars with existing GET_CAR, retains selection on refresh and handles missing cars, loading, retry and insufficient selection.
- The existing comparison table retains twelve supported fields, differences filtering, remove controls and real car detail links. Mobile can scroll the table horizontally.
- No additional domain types, backend API/filter changes, dependencies or lockfile changes were needed for this follow-up.

## Mileage retained from the earlier authorized phase

The user approved backend mileage storage in kilometres. The optional CarMileage frontend alias and carMileage output/create/update/schema fields remain. Values are nullable whole numbers from 0 to GraphQL Int maximum 2147483647, with no default/backfill. Unknown mileage displays Not provided; zero displays 0 km. Existing queries and listing form retain mileage support. Unsupported engine, body, efficiency and safety fields were not invented. Prices remain USD.

## Verification

- Yarn typecheck and dedicated compare invariant checks passed, including valid/invalid URL IDs, deduplication and maximum-three handling.
- Production build generated 91 localized pages, including /car/compare. No lint errors; pre-existing lint warnings remain.
- Isolated headless Chrome QA passed against real inventory at 1440px desktop and 390px mobile, plus KR/RU desktop. Verified reference typography, orange/white hover, recent searches on reopening, literal punctuation search, slot placement, duplicates, two-selection enablement, three-car selection, standalone route, navbar/footer-only layout, refresh persistence, differences, detail links and removals. No uncaught browser exceptions.
- Desktop empty/hover/modal and mobile result screenshots were visually reviewed. The connected Browser runtime was unavailable, so QA used a separate temporary Chrome profile.
- Earlier mileage phase: backend API/batch typechecks and build passed; 25 focused DTO/schema tests passed. This follow-up changes only frontend source and backend handoff documentation.
- No commit or deployment.

## Previews

- [Empty desktop](screenshots/compare-empty-desktop.png)
- [Orange hover](screenshots/compare-hover-desktop.png)
- [Recent searches modal](screenshots/compare-picker-recent-desktop.png)
- [Search modal](screenshots/compare-picker-desktop.png)
- [Selected desktop](screenshots/compare-selection-desktop.png)
- [Comparison desktop](screenshots/compare-results-desktop.png)
- [Empty mobile](screenshots/compare-empty-mobile.png)
- [Selected mobile](screenshots/compare-selection-mobile.png)
- [Comparison mobile](screenshots/compare-results-mobile.png)

## 2026-10-09 - Comparison selector viewport fit

- Kept the maximum of three cars. Bounded the comparison section to its parent and centered its container with a 1360px maximum. Selected homepage cards now have photos capped at 180px, tighter content/spec spacing and stable year badges; table cards remain unchanged. Enabled Compare text is white.
- Yarn typecheck and isolated real-inventory browser QA passed at 390px mobile, 1440px desktop and 2796px wide desktop, plus KR/RU. Added assertions that every selection slot stays inside the viewport, the heading is not clipped and selected photo height stays bounded. Existing route, refresh, search, duplicate, differences and removal checks also passed. Wide-screen screenshot visually reviewed.

[Wide-screen selector](screenshots/compare-selection-wide.png)

## 2026-10-09 - Comparison card image and slot alignment

- Fixed the selected-photo aspect-ratio/max-height interaction that narrowed the photo box: photos now have explicit equal horizontal insets, full available width and a fixed 180px height, with centered cover sizing. Removed grey letterboxing.
- Added a selected-state grid class so empty slots stretch to the selected cards on desktop while the initial empty reference layout remains. Reduced only the gap before the following Community section. Existing selection and result logic remains.
- Yarn typecheck and real-inventory isolated browser QA passed at 390px, 1440px and 2796px, including EN/KR/RU flows. Added checks for equal photo insets and equal desktop slot heights. Reviewed the updated selected-card screenshot.

## 2026-10-09 - Standalone comparison page heading

- Added Home / Cars / Compare breadcrumbs with localized Next links, semantic H1 Compare Cars and the requested introductory sentence above the comparison table. Scoped to the standalone result page; homepage selector is unchanged.
- Matched existing Poppins typography: desktop title 34px/500/150% with -.646px tracking, mobile title 25px, muted 14px/24px body and 12px breadcrumbs. Added EN/KR/RU labels and an accessible current-page marker. Added scroll margin for the fixed navbar.
- Yarn typecheck and real-inventory desktop/mobile/localized browser QA passed, including heading, introduction, Poppins font and localized breadcrumb targets. Existing comparison behavior remains.

## 2026-10-09 - Homepage comparison heading consistency

- Replaced the homepage comparison heading Arial override with the same Poppins 34px/500/150% typography and tracking used by other homepage sections; mobile uses 25px. Added the concise introduction: Compare up to three cars, side by side. EN/KR/RU translations are included.
- Yarn typecheck and focused browser heading checks passed on desktop/mobile and all three locales. Desktop screenshot visually reviewed. Restarted the stopped dev server and rebuilt its stale cache; old cache retained in TEMP. No comparison logic or backend source changes.
