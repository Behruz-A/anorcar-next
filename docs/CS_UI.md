# CS Help Center

Implemented 2026-10-12 in the existing NESTAR-derived Next.js Pages Router, layout HOC, MUI, SCSS and Apollo structure.

## Design and behavior

- Dedicated dark Help Center hero with the shared marketplace navbar; existing ANORCAR Poppins, #181A20, white/light gray and #F04432 palette. CS active navigation and localized page metadata.
- Six help topics filter the existing FAQ component. Thirteen practical answers cover car search/comparison, favorites, profiles, agent contact/listings, selling, community, payment arrangements, sign-in, uploads and loading.
- Search matches translated question, answer and topic text. Explicit submit, clear/no-result states, accessible accordion controls and real destination links. Search/category restore from URL using shallow routing; legacy ?tab=faq and ?tab=notice links still work.
- Email support reuses info@anorcar.com from the existing footer. No message is sent automatically and no ticket backend or response-time promise is invented.
- Existing Notice component now shows the latest three actual NEWS articles through existing GET_BOARD_ARTICLES/Apollo. Real IDs, titles, dates and safe text excerpts; loading, empty, error and Retry states. These are community posts, not official platform announcements. No fabricated releases/dates.
- EN/KR/RU dictionaries, responsive topic grids and horizontal mobile FAQ filters. Replaced CS/FAQ/Notice mobile placeholders.
- CS-scoped wrapping fixes and min-width prevent overflow. Existing closed chat panel is hidden until opened on CS, preserving its existing open behavior; no Chat business logic changed.

## Validation

- Yarn typecheck passed after both implementation phases and final functional changes.
- Yarn migration/auth checks passed; 42 existing GraphQL operations and current contracts remain intact.
- Production build passed with 91 pages and existing lint warnings; repeated after final responsive/content refinements.
- Reproducible read-only browser checks: scripts/qa-cs.cjs. Desktop/mobile previews: docs/screenshots/cs-help-1440.png and cs-help-390.png.
- Full browser suite passed at 1440/1024/768/390/320px: actual viewport bounds, six topics, thirteen FAQs, category selection, accordions and destination links, restored URL search, empty/reset, native input/Enter, real NEWS article IDs, KR/RU mobile and backend error/Retry. No uncaught runtime exceptions or authenticated API writes. Both preview screenshots visually reviewed.
- Restarted only the existing frontend dev server to clear stale translation resources; remains on port 3000. Backend remains on 3007. Corrected the CS title to a single text child after reviewing dev logs.

## Scope

No backend code/schema/data changes, dependency/lockfile changes, commit or deployment. Backend handoff docs are in sibling anorcar/docs; docs/ai is absent. The FAQ is maintained frontend guidance, while community news comes from the backend. The previous unrelated page-navigation latency report was outside this CS implementation.
