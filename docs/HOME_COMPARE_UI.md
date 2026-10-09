# Car comparison — 2026-10-09

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
