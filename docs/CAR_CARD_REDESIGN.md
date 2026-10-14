# Professional marketplace car cards

The existing `libs/components/car/CarCard.tsx` listing presentation now serves Cars, Agent Profile, Recently Added Cars and Trending Cars. Recent/Trending keep their original component entry points as small wrappers, rather than duplicating the presentation. Pages Router, Apollo queries/cache/mutations, auth, ID routes, localization, SCSS imports and existing data contracts remain.

## Architecture and scope

| Consumer | Presentation | Existing interaction |
| --- | --- | --- |
| Cars and Agent Profile | Existing `CarCard` browse branch | Existing like/favorite handler and photo count |
| Recently Added Cars | `RecentlyAddedCarCard` forwards the recent variant | Details links; no invented wishlist button |
| Trending Cars | `TrendCarCard` forwards the trending variant | Existing like handler, views and likes |
| Saved/account cards | Existing non-browse/management variants | Preserved |
| Popular/Top/Compare cards | Existing featured/compact components | Preserved |

`scss/pc/car/listing-card.scss` retains the existing shared mixin. Its homepage inclusion is scoped in `scss/car.scss` after legacy mobile/home rules. Conflicting old Recent presentation rules were removed; loading placeholders still use scoped SCSS. Agent panel heading rules now exclude MUI card headings, preventing the panel's 23px/19px text rules from overriding the card title. No unrelated page layout was redesigned.

## Visual and interaction changes

- White surface, subtle neutral border, 16px corners and restrained shadow. Existing Poppins typeface and ANORCAR palette.
- Full-width 16:10 photos, cover scaling, subtle image zoom/elevation on pointer hover and a real unavailable-image fallback. Lazy loading remains; reduced-motion disables transforms/transitions.
- Primary brand/model title at 20px with a two-line clamp and full-name tooltip. Year at 14px, charcoal KRW price at 26px/700, compact two-column specs at 14px, muted location footer. A two-line title reservation aligns prices within rows; the content has no fixed height.
- Recent grid retains four desktop/two tablet/one mobile columns, now with 24px gaps and automatic row sizing. Cars retain three columns where their sidebar leaves room for three, two on tablet and one on mobile. Agent grid and existing horizontal list mode are preserved.
- Condition badges come from actual NEW/USED values; SOLD/DELETE values take precedence when present. No certification, availability or TOP claim is fabricated. IDs, association, brand, year, price, photos, fuel, transmission and mileage are unchanged.
- Optional specs/location are omitted when absent. Known zero mileage is displayed as `0 km`, instead of the legacy formatter's empty zero. Stable en-US integer formatting matches existing KRW formatting; unknown mileage is not converted to zero.
- Card image/title retain `/car/detail?id=...`; the title's existing stretched-link pattern makes the card navigable. Wishlist remains a separate MUI button above that link, with stopPropagation/preventDefault, pending-state protection, aria-pressed and visible focus. The existing mutation/refetch handler is reused. Keyboard Enter navigation and reduced motion are tested.

## Validation

- `yarn.cmd typecheck`: passed after the component phase, SCSS phase and final numeric formatting.
- `yarn.cmd lint`: passed. Existing image/link/hook warnings remain; no dependency/tooling cleanup was attempted.
- `yarn.cmd build`: passed, 91 pages generated, including the final Agent heading selector correction. The subsequent explicit integer locale parameter passed final typecheck and component/browser checks.
- `yarn.cmd test:migration` and `yarn.cmd test:compare`: passed existing contracts, auth/migration, comparison/restoration and unchanged-price KRW checks.
- `yarn.cmd node scripts/check-car-card.cjs`: passed shared variants, real-data fields, KRW, zero/unknown mileage, optional fields, no duplicate brand prefix, image fallback, status, route IDs and appropriate wishlist presence.
- `yarn.cmd node scripts/qa-car-cards.cjs`: isolated Chrome fixtures test Recent, Trending, Cars and Agent Profile at 1440/1280/768/390px, image ratios, equal row heights, title/price sizes, two-column specs, no horizontal overflow, long names, missing photos, unknown/zero mileage, like without navigation, keyboard Enter, focus and reduced motion. Engagement and auth fixtures are isolated; all test mutations are intercepted and never reach the real database.
- A separate read-only browser preview verified real inventory photos and KRW values at 1440px and 390px. Live screenshots: `docs/screenshots/premium-car-cards-live-{1440,390}.png`. Edge-case fixture screenshots: `premium-car-cards-{1440,390}.png`.

No backend schema/code/data changes, new libraries, fake controls, commit or deployment. The earlier orphaned-demo inventory issue and current Trending eligibility rules are outside this visual change.
