# CS Help Center

Implemented 2026-10-12 in the existing NESTAR-derived Next.js Pages Router, layout HOC, MUI, SCSS and Apollo structure.

## Design and behavior

- Compact photo Help Center hero with the shared marketplace navbar, section title and short description; existing ANORCAR Poppins, #181A20, white/light gray and #F04432 palette. CS active navigation and localized page metadata.
- Six help topics filter the existing FAQ component. Thirteen practical answers cover car search/comparison, favorites, profiles, agent contact/listings, selling, community, payment arrangements, sign-in, uploads and loading.
- Topic cards and FAQ category controls provide navigation. FAQ answers start collapsed to keep the page concise. Existing q-based links still match translated question/answer/topic text and retain clear/no-result states. Category/query restoration uses shallow routing; legacy ?tab=faq and ?tab=notice links still work.
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

## Hero photo refinement — 2026-10-12

- Applied the user-provided public/img/car/helphero.png as the hero background. Desktop copy/search align left, leaving the support agent visible on the right. Responsive cropping and a dark overlay maintain readable navigation and text; mobile copy remains centered.
- Follow-up: replaced the photo with the user-provided public/img/car/helphero1.png for both desktop and mobile, retaining the existing copy and overlay.
- Kept “How can we help you?” and shortened the subtitle/metadata to “Quick answers for your car journey.” Added matching KR/RU translations.
- Yarn typecheck and the existing full read-only CS browser suite passed at five widths, including localized mobile, search, filters and Retry. Refreshed desktop/mobile screenshots visually reviewed. No new dependencies or backend changes.

## Content simplification — 2026-10-12

- Removed the large hero search and repeated popular-topic chips in favor of one Explore help topics anchor. Removed the hero eyebrow, duplicate section descriptions/note and FAQ kicker; shortened all six topic descriptions and support copy in EN/KR/RU.
- FAQ answers now start collapsed unless restored from a legacy search URL. Existing category filtering, legacy query URLs, reset states, links, Apollo news and support email remain functional.
- Updated the read-only browser suite for topic navigation instead of search input. Five widths, three locales, categories, accordions, legacy search/reset and news/error/Retry passed without runtime exceptions. Refreshed screenshots visually reviewed.
- Final Yarn typecheck and production build passed (91 pages, existing lint warnings). Recorded the refinement in sibling anorcar/docs/COMPLETED_TASKS.md.

## Plain section hero — 2026-10-12

- Matched the requested simple section-banner treatment: helphero1 image, localized Help Center title and one short description. Removed the hero action and red bottom border; topic and FAQ navigation remain below the hero.
- Yarn typecheck and the read-only CS browser suite passed. Updated desktop/mobile previews; browser assertions verify no hero controls and no bottom border.

## Hero readability refinement — 2026-10-12

- Updated subtitle and metadata to “Find answers, explore guides, and get the support you need.” with KR/RU translations. Preserved the strong left gradient; reduced right-side opacity to 0.26 at 70% and 0.16 at the edge so the support agent remains brighter. Mobile keeps sufficient text contrast with a directional gradient.
- Repaired encoding corruption in the recently added short KR/RU topic/support strings. Yarn typecheck and the existing CS browser suite passed; refreshed desktop/mobile previews.
