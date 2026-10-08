# Recently Added Cars homepage section

Implemented 2026-10-08 directly after Top Agents in both homepage device branches.

## Data and architecture

- Existing `GET_CARS` document, Apollo `useQuery`, `cache-and-network`, `notifyOnNetworkStatusChange`, and `onCompleted`/local state pattern retained.
- Input: page 1, limit 8, sort `createdAt`, direction `Direction.DESC`, search `{}`. Backend sorts ACTIVE listings before skip/limit; no frontend popularity threshold or invented data.
- View All opens existing `/car` with the same inquiry, page 1 and limit 9. Cards link to existing `/car/detail?id=...`.
- New section/card components stay in existing `libs/components/homepage`; styling stays in existing homepage SCSS. Pages Router, layout HOC, backend, authentication, existing sections, GraphQL documents, dependencies, and enums unchanged.

## UI and contract differences

- Reference-inspired centered heading, light background, white cards, orange USD prices, centered pill CTA, four desktop columns / two tablet columns / one mobile column.
- Heading matches existing Popular/Trending standard: Poppins 34px, weight 500, line height 150%, letter spacing -0.646px; mobile 25px. EN/KR/RU copy provided.
- Real brand logo/name, model, year, fuel, transmission, price and location. No mileage field exists in backend, so kilometers from the reference are omitted.
- Existing real inventory contains five ACTIVE cars, so five cards render. Up to eight render automatically when inventory grows; no new listings or data writes in this task.
- One existing listing points to missing `uploads/cars/test-car.jpg`; this section falls back to existing car placeholder without changing that record. Missing optional brand logos are hidden, matching existing Trending handling.
- Loading, error and empty states included. Existing label helper retains backend enum spellings, including AVTOMATIC/DAEJON, while translating labels.

## Validation

- `yarn typecheck`: passed.
- `yarn lint`: passed, zero errors and 189 existing warnings; no new warnings.
- `yarn test:migration`: passed, 42 GraphQL documents plus migration/auth checks.
- `yarn check:graphql`: passed, 42 operations, three inline uploads and enums against localhost:3007.
- `yarn build`: passed, 88 localized pages.
- `git diff --check`: passed.
- Isolated Chrome browser: five real ACTIVE listings match public API ID order exactly; timestamps descending; 4/2/1 columns; computed heading typography matches Trending; images/fallback; View All navigation and inquiry; card detail hrefs; EN/KR/RU; real mobile user-agent at 390px and 320px without overflow; no runtime exceptions.
- Screenshots visually reviewed: `docs/screenshots/home-recent-cars-desktop.png` and `home-recent-cars-mobile.png`.

No commit or deployment performed. Development server remains at localhost:3000; production build output remains separate from dev output.
