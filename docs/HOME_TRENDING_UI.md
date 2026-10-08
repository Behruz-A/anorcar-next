# Trending Cars UI — 2026-10-08

## Scope and architecture

Current Git/filesystem was rechecked before editing: HEAD 48dafb7, clean frontend tree. Read AGENTS.md and sibling backend documentation (actual docs directory; docs/ai is absent). Added the existing TrendCars component immediately after BrowseByBudget in both existing homepage device branches. Updated only TrendCars, its sole-use TrendCarCard, scoped existing homepage SCSS, existing locale dictionaries and this report/screenshots.

NESTAR patterns retained: homepage folder and layout HOC/Pages Router, useDeviceDetect, useState with Apollo useQuery onCompleted, GET_CARS, cache-and-network, notifyOnNetworkStatusChange, existing LIKE_TARGET_CAR mutation, authentication guard, same-input refetch after like, userVar/useReactiveVar, SweetAlert error/success feedback, MUI and Swiper. No GraphQL documents, backend business code, types, route parsing, dependencies, environment names or architecture changed.

## Behavior and backend limits

The existing default inquiry remains page 1, limit 8, carLikes DESC, search {}. Locally qualify its returned list with carLikes >= 1 AND carViews >= 2. Both conditions are required and checked again after mutation/refetch. No inventory or engagement records are fabricated.

Backend CarSearch has no minimum-like/view filters. Eligibility therefore applies only to the first eight like-sorted candidates; it does not search every page or guarantee four matching cars. This preserves the original NESTAR fetch pattern and avoids inventing GraphQL fields or changing the backend. A larger catalog could have eligible cars outside that first page. View All links to the existing /car page with carLikes DESC, page 1, limit 9, search {}: it shows all cars in like order, not a server-filtered trending-only list.

UI shows four cards across on wide screens, with existing Swiper touch/keyboard movement at narrower widths. Removed pagination dots and prev/next controls from Trending; header contains View All. Cards use actual carImages, brandData logo/name when supplied, model/title, USD price, backend location, year, transmission, fuel, rent/barter flags, view/like counters, meLiked state and existing detail links. Sale is the display fallback when neither rent nor barter is set. TOP is a section badge, not a new backend field. Existing backend AVTOMATIC and DAEJON values are untouched. The screenshot's mileage is unsupported by the backend, so transmission is displayed instead. No static car photos or fake brand logos were added to application data.

Scoped styles also override the old mobile card fixed height so counters remain visible. Existing unrelated homepage sections, Budget behavior, comments, backend roles and auth implementation are preserved.

## Validation

- Yarn typecheck passed. Initial MUI/TypeScript union errors were resolved by native div wrappers for simple content; final typecheck and production build pass.
- Yarn lint passed, zero errors and 190 pre-existing warnings (four old TrendCarCard img warnings removed by Next Image).
- Existing migration/auth tests passed; live GraphQL validated 42 operations, three uploads and registered enums.
- Production build passed, 88 localized pages, normal .next output while dev retains separate .next-dev.
- Isolated Chrome first checked real backend rendering: currently no eligible cars, so the empty state appears. Browser-only intercepted GraphQL response fixtures then verified inclusion at 1 like/2 views and exclusion at 1 like/1 view, 0 likes/20 views, and 0/0; four-card desktop layout; absence of Trending pagination; actual View All/detail clicks; guest like feedback without navigating; mobile swipe; Korean/Russian headings; empty/error states; no uncaught runtime exceptions. No test fixture was persisted to the backend.
- Fixture design previews: docs/screenshots/home-trending-desktop.png and home-trending-mobile.png. These illustrate UI using browser-only sample data and existing local artwork, not current inventory.

No publish/deploy or Git commit performed. Sibling backend COMPLETED_TASKS.md updated for the workflow only.
## Follow-up: Popular height and three persisted demo listings — 2026-10-08

The user explicitly requested creating three new cars so this section has actual cards. This supersedes the previous UI-only/no-database-write scope for this follow-up. Desktop Trending now has min-height 816px with 132px/94px top/bottom padding, matching the existing Popular section; <=1200px remains content-sized. Existing layout/query/filter/like/refetch patterns are unchanged. A failed optional brand-logo image is hidden; the existing Hyundai brand points to missing http://localhost:3007/hyundai.png. Backend brand data was not edited.

Used existing localhost GraphQL API only: signup one AGENT (demoA472aa1) and two USER viewers (demoV594e29, demoWef5f0c); createCar with existing active Hyundai brand; getCar once per distinct USER and likeTargetCar once for the first USER. Unique-view records and like records therefore match counters, instead of directly editing statistics. Demo titles/descriptions identify these as development examples with illustrative existing artwork. Original inventory remains untouched. No privileged/admin account, new brand, backend source edit or frontend hardcoded records were introduced. Credentials/token manifest remains outside the repository in the temporary seed state; no credentials are recorded here.

| Car | ID | Price USD | Likes | Views |
| --- | --- | --- | --- | --- |
| Demo Hyundai Elantra | 6ac7383fe8ca66a84a682d5c | 18500 | 1 | 2 |
| Demo Hyundai Tucson | 6ac73863e8ca66a84a682d7e | 28500 | 1 | 2 |
| Demo Hyundai Sonata | 6ac73865e8ca66a84a682d97 | 22500 | 1 | 2 |

All three are ACTIVE/USED with exact AVTOMATIC transmission and supported fuel/location values. Images use existing /img/car/budget artwork. Public GET_CARS confirms all three are in the like-sorted response and qualify. No duplicate seed was added when retrying an initial incorrect argument: the API requires likeTargetCar(carId:...), and the seed state resumed existing records.

Validation: Yarn typecheck, lint (zero errors, 190 existing warnings), migration/auth tests, live 42-operation GraphQL validation, production build (88 pages), diff check. Isolated browser on normal localhost:3000 verified three actual persisted cards, loaded car images, minimum counters, exact measured Trending=Popular=816px, responsive mobile/no overflow and no runtime exceptions. Actual live previews: home-trending-live-desktop.png and home-trending-live-mobile.png. Earlier previews/test descriptions above remain historical browser-only fixtures. No commit or deployment performed.

## Fourth demo car — 2026-10-08
User requested one more card. Added Demo Hyundai Santa Fe (ID 6ac73a83e8ca66a84a682deb), 2024, USD 36500, HYBRID, USED, exact DAEJON/AVTOMATIC, existing green illustrative artwork. Reused demo AGENT and two USER accounts through existing GraphQL APIs; new car has 1 like and 2 distinct authenticated views. No new accounts or frontend/backend source changes in this follow-up. Public like-sorted query and live localhost:3000 browser confirm four eligible cards, matching 816px Trending/Popular heights and responsive mobile without runtime exceptions. Existing Sonata now has 2 likes; this follow-up did not modify its engagement. Updated live screenshots.
