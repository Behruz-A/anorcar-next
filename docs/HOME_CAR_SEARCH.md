# Homepage car search — 2026-10-15

The existing `HeaderFilter` remains inside both desktop/mobile branches of `LayoutHome`. It now includes make, model, year, KRW price and location, condition/fuel tabs, the existing `Filter` drawer for More Filters, and ten illustrated category shortcuts. Search and category selection navigate through the existing `/car?input=...` JSON contract and Apollo `GET_CARS`. No new API transport, route framework or dependencies were introduced.

`libs/carCategories.ts` keeps category-to-filter mapping independent of presentation. Body categories preserve selected fuel, condition, brand, location, model and ranges. Electric/Hybrid use `fuelTypes`. Luxury uses `segments`, rather than pretending to be a body shape. All Types clears body/segment/fuel refinements while preserving other selected fields. Every navigation resets pagination to page 1. The model input is escaped before use by the existing regex-based backend text search. More Filters reuses the existing drawer's escaping/range validation and submits its normalized input directly.

Prices are actual KRW amounts: maximums of 10/20/30/40/50/75/100 million won, consistent with listing prices. Region uses existing `CarLocation` values, including canonical DAEJEON. EN/KR/RU labels are included.

## Additive backend contract

Sibling `anorcar` retains Nest resolver/service/module conventions, existing Car ownership/roles, Mongoose collection and the existing getCars aggregation.

- `CarBodyType`: SEDAN, SUV, HATCHBACK, TRUCK, VAN, CONVERTIBLE, COUPE, WAGON, OTHER.
- `CarSegment`: STANDARD, LUXURY.
- Nullable `carBodyType` and `carSegment` on Car, CarInput and CarUpdate.
- Optional `bodyTypes` and `segments` arrays on CarSearch, combined with existing filters using `$in`.
- Optional schema paths and a compound status/body/segment index. No default guesses or backfill. Existing unclassified cars remain visible under All Types.
- Agent create/edit exposes optional category selections. User/admin documents select both fields to preserve edit hydration and Apollo results.

Deploy backend before frontend because frontend selections include the new nullable fields. Local watch server already exposes them. Existing listings need an owner/admin to assign factual categories; no live catalog writes were performed in this task.

## Verification

- `yarn typecheck` passed after integration.
- `yarn build` passed for all 91 generated pages. Lint, Autoprefixer, Browserslist and page-data-size warnings were reported; no compilation/type errors. Development and production output directories remain isolated.
- `yarn test:migration` passed, including category composition, URL round trips, enum whitelisting, reset, translations and existing auth/member regressions.
- `yarn check:graphql` passed for 53 operations, three uploads and registered enums against localhost:3007.
- Backend API and batch TypeScript checks and Nest build passed.
- 37 focused backend tests passed across category service/DTO/schema tests and existing CarInput tests.
- Read-only live queries accepted combined SUV/Hybrid/Seoul and Luxury inputs, while unfiltered queries still returned all 75 current active listings. New body/segment searches have no matching classified records yet.
- Next.js homepage HTTP rendering includes location and ten category shortcuts. Browser automation inventory had no available browser; responsive appearance and drawer interactions still need visual browser review. No screenshot QA is claimed.

## Homepage hierarchy and budgets follow-up — 2026-10-15

- Existing desktop/mobile Home branches now render Most Loved Cars before Browse by Budget, then keep the remaining sections in their previous order. HeaderFilter and its type shortcuts remain in LayoutHome.
- `libs/carBudgets.ts` supplies the seven million-won ceilings and Any Budget for BrowseByBudget; HeaderFilter reuses these same thresholds. All budget links reset to page 1, sort by price ascending and use numeric KRW bounds. Any Budget sends no price range. EN labels are `Under ₩10M` through `Under ₩100M`, with corresponding Korean/Russian labels.
- Following the user's width correction, search/type shortcuts again span the former broad hero width (6.4% side insets on desktop, 32px tablet/20px mobile). Hero copy aligns inside the search panel. Lower sections restore their previous 1416px maximum and `100% - 160px` desktop width, with 64px tablet/28px mobile total gutters. Budget corrections, compact cards, section order and distinct hover remain. Existing section components and Apollo queries remain.
- The final chosen Most Loved Cars presentation is four full cards at 1440px+, two at 600–1439px, and 1.15 on mobile. Existing Swiper now owns slide widths through viewport breakpoints; obsolete fixed widths and five-column rules were removed. Native Navigation/Keyboard/A11y modules drive accessible desktop arrow buttons. The eight-result query and like ordering/eligibility remain. Cards stretch equally, retain 16:10 images and reserve two rows for specs so metadata aligns.
- Search, its type row and Most Loved Cars share `--home-wide-width`, so their left/right edges match: up to 1680px with at least 64px desktop side gutters, existing 32px tablet/14px mobile gutters. The search dock is horizontally centered while preserving its existing vertical overlap. Other sections retain their restored widths. The subtitle remains “Discover the cars our community loves” in EN/KR/RU.
- `check-loved-carousel.cjs` renders the actual section with isolated network/Swiper boundaries and checks all eight cards, responsive counts, unchanged query defaults, installed navigation module and selectors matching actual accessible buttons. Typecheck and migration regressions passed. Browser interaction and visual QA remain unavailable.
- Budget cards are 208px high on desktop, 196px on tablet and 188px on mobile. Images occupy a smaller upper region; larger prices sit on a separate white strip. Existing Swiper navigation, links, focus styles and reduced-motion support remain.
- Only a selected type uses the orange fill/border; mouse hover on another type uses neutral gray, and touch devices do not receive persistent hover decoration.
- Typecheck, migration checks and the 91-page production build passed, including numeric budget-label agreement and URL round trips. Read-only EN/KR/RU HTTP checks verified the new section order and all eight rendered budget URLs. Browser surfaces remain unavailable, so no new visual-browser QA is claimed.

## Browse by Budget layout refinement — 2026-10-15

- Budget now shares `--home-wide-width` with search and Most Loved Cars, keeping identical side gutters. Other sections retain their current widths.
- Existing Swiper navigation buttons moved into the heading row, with outlined circles and a visible disabled state; side-overlay arrows were removed. Navigation/keyboard/A11y modules and numeric KRW search links remain unchanged.
- Added “Find a car that fits your budget.” in English, Korean and Russian. Desktop cards retain six visible budgets, with larger aspect-ratio image frames and separate price strips. Tablet/mobile retain swipeable fixed-width cards.
- White section spacing increased to 88/96px desktop, 64/72px tablet and 48/56px mobile. Existing Nestar component/SCSS structure remains; no backend, Apollo or dependency changes.
- Yarn typecheck and migration regressions passed. No browser visual verification is claimed.

Follow-up: budget cards now use a 4:5 frame with the existing image covering the entire card, aligned left so the front/rear half of each vehicle is enlarged and cropped like the user's reference. The price sits at the bottom over the studio background. Shared data already contains seven ceilings through ₩100M followed by Any Budget; carousel arrows reveal the last two options. Header controls, shared gutters and numeric search bounds remain unchanged.

## Category image asset

`public/img/car/category-cars.png` was generated with the built-in image tool (`transparent_background: true`), copied into the project and displayed as ten SVG viewports of the same raster sprite. The output was visually inspected. No extra image dependency or image modification pipeline is needed.

The thumbnail viewports explicitly clip the source image to their own cell using unique React `useId` clip paths. ViewBox scaling alone left neighboring cars visible in the horizontal gutters of wide SVG boxes. Regression checks render two rows and verify all 20 clip IDs are unique, each clipping rectangle matches its viewport and every image references its own clip.

Source frames use measured transparent gaps between the cars, not equal fifths of the generated image. The unequal source spacing previously cut Truck's front and included adjacent vehicle fragments in Sedan, Hatchback and Hybrid. Tests now also check that each viewport contains the full measured vehicle width and excludes its neighbors.

Final prompt:

> Use case: product-mockup. Asset type: ONE automotive category sprite sheet for a real car marketplace UI. Create exactly TEN separate photorealistic studio car cutouts arranged in a precise 5-column by 2-row evenly spaced grid. Transparent background, no grid lines. Every cell exactly equal size, every vehicle centered inside its cell with generous equal transparent margins, no vehicle may cross cell boundaries. All cars same front-left three-quarter view pointing left, complete body and wheels visible, realistic premium automotive catalog photography, soft neutral studio illumination, subtle contact shadows. Reading order left-to-right, top-to-bottom: 1 white midsize SUV (all types), 2 white sedan, 3 black SUV, 4 white compact hatchback, 5 black pickup truck, 6 blue electric crossover with closed grille, 7 white hybrid crossover, 8 silver luxury sedan, 9 black passenger van, 10 white convertible with open roof. No letters, labels, logos, badge text, license plate text, humans, scenery or watermark. Exact uniform grid alignment is critical: this entire sprite sheet will be sliced into the ten equal cells using CSS.
