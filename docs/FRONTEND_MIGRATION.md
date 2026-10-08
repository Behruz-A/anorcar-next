# Frontend migration status

Current approved status: foundation Phases 0 and 4–8 are complete. The user subsequently approved the homepage navigation, hero and Model Search screenshot slice ([HOME_HEADER_UI.md](HOME_HEADER_UI.md)), then replacing Trend Cars with Browse by Budget ([HOME_BUDGET_UI.md](HOME_BUDGET_UI.md)). Prices are USD, explicitly confirmed by the user. Further Home/Cars UI work remains deferred. See [FOUNDATION_MIGRATION.md](FOUNDATION_MIGRATION.md) for the foundation changes, backend findings and deferred defects. The integration report below is historical and does not establish strict NESTAR UI parity.

Updated: 2026-10-07. Implementation is integrated; release acceptance remains pending.

## Implemented and integrated

- Preserved Next.js Pages Router, Apollo/GraphQL, MUI, SCSS, authentication, community, follows, chat, and English/Korean/Russian localization. Dependencies were not upgraded.
- Canonical Car/Brand documents and backend-aligned inputs, responses, enums, filters, `memberCars`, and `CAR` engagement groups replace active Property contracts.
- Car homepage/search/cards, `/car` browsing and detail, seller/member inventory, account create/edit/uploads, favorites, and visits are connected.
- Authentication hydration precedes protected account access. Listing creation and owner management remain AGENT-only; other sellers use public inventory queries.
- Admin Car and Brand screens retain existing administration. Only ACTIVE cars offer sold/delete actions; permanent removal requires DELETE status and confirmation. Brands support soft deletion/reactivation.
- ANORCAR branding, automotive assets, metadata, localized changed UI, and responsive core marketplace/account screens are connected.
- Permanent Property browse/detail/admin redirects preserve query parameters and locale. Old account categories map to Car equivalents. Legacy filters are sanitized rather than reinterpreted.
- Replaced obsolete Property components, types, and operations only after Car consumers passed typechecking. Dormant media and unrelated mobile placeholders remain.

## Contract decisions

- Backend ownership roles remain USER, AGENT, ADMIN. User-facing ownership is seller.
- Wire enum `AVTOMATIC` displays Automatic.
- Car lists return `list` and `metaCounter`; Brand lists return arrays.
- GraphQL defaults to `http://localhost:3007/graphql`, media to `http://localhost:3007`; existing environment keys and WebSocket integration are retained.
- Upload target is `car`, with compression, authenticated multipart upload, previews, and a five-photo UI limit. Failed uploads preserve the draft; saving is disabled while uploading.
- Image handling supports absolute URLs, relative upload paths, and missing-image placeholders.
- No rental-period/currency fields, database migrations, seeds, backend business-code changes, or Git commits were introduced.

## Verification

- Phase and final `yarn typecheck`: passed.
- Final `yarn test:migration`: passed. 42 GraphQL operations parse without legacy contract fields; tests cover response shapes, counters, engagement, image URLs, input boundaries, localization keys, and redirects.
- Final `yarn build`: passed; generated 88 localized pages.
- `yarn node scripts/check-frontend-routes.cjs`: passed against the production server. Thirteen pages/assets returned 200; three permanent redirects returned 308 with locale and query parameters preserved. These HTTP checks do not validate client interactions or authorization.
- `yarn check:graphql`: blocked by an unreachable `http://localhost:3007/graphql`. Source alignment and offline parsing are not live schema validation.
- Interactive browser QA: unavailable; the in-app browser runtime returned no available browser. Responsive code is implemented but visual and interactive acceptance is not claimed.

## Remaining release acceptance

1. Start the existing backend/database and run `yarn check:graphql`; do not release until every operation validates.
2. Exercise guest/USER/AGENT/ADMIN sessions, refresh/hydration, create/edit, multiple/failed uploads, unavailable Brands, sold/delete, Brand lifecycle, and permanent deleted-Car removal using test data.
3. Verify filters, sorting, pagination, back/forward navigation, likes, comments, favorites, visits, public inventory, counters, and mutation refresh behavior against the live backend.
4. Visually verify mobile and desktop browse/detail/account navigation/create/edit/inventory/favorites/visits for overflow and usability; smoke-test authentication, profiles, community, follows, and chat.
5. Unrelated mobile support/community placeholders and dormant legacy media/3D assets remain documented follow-up, not marketplace release acceptance substitutes.
6. Confirm business currency/rental pricing separately; current formatting is preserved.
