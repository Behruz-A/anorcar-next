# ANORCAR Events carousel

Implemented 2026-10-08 in existing `libs/components/homepage/Events.tsx` and homepage SCSS. Desktop mount remains between Top Cars and Community; the same responsive component now also appears there on mobile. Existing inline EventCard, MUI, Next Image, i18n and installed Swiper patterns are retained. No new architecture or dependencies.

## Data and behavior

The backend currently has no Event model/getEvents operation. The user explicitly approved six static demo events ordered by createdAt until a later backend integration. Dates below are fictional record creation timestamps, not advertised event dates. No GraphQL operation, backend enum, event route or registration action is invented.

| Demo event | City label | createdAt UTC |
| --- | --- | --- |
| Auto Tuning Show | Incheon | 2026-10-06 09:00 |
| Seoul Auto Show | Seoul | 2026-10-05 09:00 |
| Speed Festival | Daegu | 2026-10-04 09:00 |
| Busan Motor Festival | Busan | 2026-10-03 09:00 |
| Jeju EV Expo | Jeju | 2026-10-02 09:00 |
| Community Drive Day | Gyeongju | 2026-10-01 09:00 |

Copies the local array, sorts createdAt descending and takes six. UI identifies these as concepts with dates/locations pending confirmation. City strings are display labels, not new GraphQL values.

## UI

- Reference-inspired warm off-white full-width section, centered heading and eyebrow, portrait cards with city/title at top over a contrast gradient.
- Standard Poppins heading 34px/500/150%/-0.646px; mobile 25px. Subtitle 16px/28px (mobile 14px/24px).
- Centered Swiper with auto card widths: desktop 22vw (280–420px), tablet 42vw, mobile 82vw. Initial center index 2 shows three full cards and two partial cards at 1690px, with the sixth off-screen.
- Six clickable dots, previous/next arrows, keyboard navigation, touch gestures and disabled end arrows. No automatic rotation. Photo hover zoom remains clipped; reduced-motion removes photo transition.
- Desktop portraits 590px, tablet 500px and mobile 450px. Responsive section sizing and EN/KR/RU labels retained.
- Five fictional illustrative images generated with built-in image_gen and saved under public/img/events/anorcar-*.png; sixth card reuses existing home-hero.png. Exact prompts: EVENT_IMAGE_PROMPTS.json. No real event photos/schedules claimed.

## Verification

Yarn typecheck, lint (180 existing warnings/no errors), migration/auth tests, live GraphQL validation (42 operations, three uploads and enums), production build (88 localized pages), and diff whitespace checks pass.

Real local Chrome verified six slides/dots, desktop five visible/two partial cards, heading typography, all six photos loaded, dot/arrow navigation, disabled ends, 390px/320px mobile with no horizontal overflow, locales and no runtime exceptions. Screenshots: docs/screenshots/home-events-desktop.png and home-events-mobile.png.

Backend source/data and other sections are unchanged. No commit or deployment; localhost:3000 remains running. Real backend Events integration is deferred as agreed.
