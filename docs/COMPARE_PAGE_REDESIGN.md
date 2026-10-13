# Comparison page redesign - 2026-10-13

Updated `/car/compare` around the user's reference: three selection positions, a compact control bar, price/mileage/year summaries, grouped specifications and seller/detail actions. Preserved Pages Router, Apollo/GraphQL operations, existing layout/navbar/footer, MUI, SCSS, Poppins typography and KRW numeric-price conventions. No new dependencies or backend/schema/data changes.

Visual direction: white surfaces on `#f6f7f9`, `#181a20` text, `#667080` secondary text, `#e3e7ed` borders and `#e94b20` ANORCAR accents. Existing 34px/25px page-heading standards remain. New selectors are limited to the results route; shared cards/table use optional props so the homepage keeps its current behavior.

The existing URL-based selection/load/retry flow remains. Added the existing searchable/paged picker to this route for add/replace, with duplicate and three-car limits. Removal and Clear All update the URL; selection survives refresh and the share button copies that URL. Clipboard failures explain how to copy the address. Inactive/sold/deleted cars are not accepted as valid comparison results.

Summaries derive only from actual price, reported mileage and model-year fields. Unknown mileage is excluded rather than treated as zero; a mileage difference needs at least two reported values. Specifications preserve all twelve existing fields, grouped as vehicle specifications, powertrain, appearance/location and buying options. Difference filtering and highlighting are independent. Groups can be individually expanded or collapsed, with accessible controls and Expand/Collapse all. No horsepower, engine, equipment or ownership-history data was fabricated.

Seller actions now open the existing private Firebase chat on the same page, with the selected listing title. Phone numbers can be shown/hidden inline. See `COMPARE_SELLER_CHAT.md` for the follow-up implementation and validation. Full-detail links retain real listing IDs. EN/KR/RU labels follow existing translation patterns. Mobile stacks cards; specification tables remain horizontally scrollable inside their own regions with no page overflow.

Files: `pages/car/compare.tsx`, `libs/components/car/CompareCarCard.tsx`, `CarComparisonTable.tsx`, new `CompareHighlights.tsx`, `scss/pc/homepage/compare.scss`, new `compare-results.scss`, `public/locales/{en,kr,ru}/common.json`, `scripts/check-compare-results.cjs`, new `scripts/qa-compare-page.cjs` and desktop/mobile screenshots.

Verification: phase TypeScript, existing comparison/restoration tests, rendered results checks and production build passed (91 pages, existing lint/Browserslist warnings). Isolated headless Chrome fixtures passed 1440/768/390/320px, two/three/empty selections, price/mileage summary calculations, difference/highlight controls, groups, picker exclusion/add/remove/replace, URL updates, refresh, clipboard share, Clear All and KR/RU localization. No uncaught browser exceptions, real account operations, GraphQL writes or paid calls. Desktop/mobile screenshots were visually inspected: `docs/screenshots/compare-redesign-1440.png` and `compare-redesign-390.png`. Real inventory content remains subject to backend availability.

No automatic commit or deployment.

Navigation follow-up: added a localized Compare link to the shared desktop/mobile navbar, including active-page styling and accessible current-page state. `/car/compare` now opts into the existing marketplace navigation treatment. This makes the standalone page directly discoverable without going through the homepage comparison section.

Live picker follow-up: the displayed loading error was caused by the local API being stopped (frontend listening on 3000, no listener on 3007). Started the existing backend with `yarn.cmd start:dev`; it compiled without type errors and now listens on 3007. The exact public picker `GetCars`/`GetBrands` queries returned nine cars and one brand. Live schema validation passed all 52 frontend operations, three upload documents and registered enums. No frontend/backend logic change or data migration was needed. The development backend is left running for the user.
