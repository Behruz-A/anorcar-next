# Shared ANORCAR footer

Implemented 2026-10-08 in the existing `libs/components/Footer.tsx`, with scoped styles in existing `scss/pc/main.scss`. Existing layout mounting, Apollo integration, backend contracts and dependencies remain unchanged.

- Dark reference layout: brand/contact/social area, newsletter, Company/Quick Links/Explore/App columns, and copyright/legal row. Existing Poppins typography and responsive desktop/mobile patterns retained.
- Footer logo reuses the exact header SVG artwork with white lettering in `public/img/logo/anorcar-footer.svg`; other logo assets are unchanged.
- Subscribe is deliberately static: a button without a handler, form submission, navigation or API call. The email field remains editable.
- Back to top is now in the footer's lower-right row, rather than a floating control. It shares Subscribe's red color and supports smooth scrolling plus reduced-motion preference. Existing chat remains unchanged.
- Available navigation uses existing Home/About/Community/CS/Cars routes. New/Used Cars serialize real `NEW`/`USED` conditions with existing CarsInquiry and `DESC`. Featured Listings uses existing `carRank DESC`.
- Events, Services, Careers, legal text, social icons, Car Types and app badges remain static because dedicated destinations/store URLs or the corresponding backend filter were not supplied. No unsupported routes, social accounts or API contracts were invented.
- Added footer translations in EN/KR/RU, accessible email/back-to-top labels, keyboard focus styles and logo alt text.

## Verification

- Yarn typecheck and lint passed; lint has 180 existing warnings and no errors.
- Existing migration/auth tests passed; live GraphQL validation passed for 42 operations, three uploads and enum contracts.
- Production build passed for 88 localized pages. Diff whitespace check passed.
- Real local Chrome checks passed: correct SVG identity/white lettering, matching button colors, static Subscribe with zero network requests/navigation, exact enum/filter serialization, shared About footer, working back-to-top, translated labels, and 390px/320px mobile without overflow or runtime exceptions.
- Screenshots: `docs/screenshots/home-footer-desktop.png` and `home-footer-mobile.png`.

No backend code/data changes, commit or deployment. Development server remains at localhost:3000.
