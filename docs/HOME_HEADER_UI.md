# Homepage header implementation — 2026-10-07

The user approved only the supplied homepage screenshot's navigation, hero and Model Search panel. The current dirty working tree was rechecked before editing; the earlier migration was still present. Existing content below this header, Cars screens, cards, forms, comments and backend business code were outside this change.

## Exact changes

| File | Change |
| --- | --- |
| `libs/components/homepage/Hero.tsx` | New small MUI component in the existing homepage folder: headline, description, promotional badge, previous/next controls and an opt-in text slideshow with interval cleanup. Play advances promotional copy, not a video. |
| `libs/components/homepage/HeaderFilter.tsx` | Replaced the old homepage filter wrapper with the screenshot's Model Search form. Local state and existing Apollo operations provide makes, real listing count and model suggestions; submitting serializes the existing `CarsInquiry` to `/car`. |
| `libs/components/layout/LayoutHome.tsx` | Existing desktop/mobile HOC branches render Hero and HeaderFilter above the original page component. Footer, desktop chat and below-header composition remain intact. |
| `libs/components/Top.tsx` | Homepage-only white navigation, dark wordmark, active Home underline and locale code. Existing routes, Member menu, hydration and logout remain. Fixed locale selection to use the MenuItem ID, corrected Korean ID, synchronized locale to the route, and moved the scroll listener into a cleaned-up effect. |
| `scss/pc/homepage/homepage.scss` | Appended styles scoped to `.homepage-shell` and `.homepage-nav`: desktop reference layout, overlapping panel and responsive navigation/hero/form. Existing global styling and other layouts were retained. |
| `public/locales/{en,kr,ru}/common.json` | Added missing header/search/slideshow translation keys without removing existing keys. |
| `public/img/logo/anorcar-home.svg` | Homepage-specific orange mark and dark ANORCAR wordmark; other logo assets remain. |
| `public/img/car/home-hero.png` | Generated sunset automotive background, saved in the project and used only by the new hero. |

No dependencies, package scripts, lockfiles, GraphQL documents, domain types, backend source or database records were changed in this slice. Documentation was updated here and in the backend's existing `docs/COMPLETED_TASKS.md`; `docs/ai` is absent there.

## Architecture and backend decisions

Next.js Pages Router, the NESTAR layout HOC, existing folder organization, MUI, local React state, Apollo and SCSS/i18n patterns remain. The intentional visual change is the user's approved screenshot, limited to the header. The small Hero component adds no architecture or shared abstraction. Homepage mobile navigation reuses Top's full navigation markup with responsive styles; other mobile layouts retain their original branch.

- `GET_BRANDS` provides real makes. `GET_CARS` supplies the actual total, currently 1 in the running backend; the screenshot's 160,864 is not fabricated. Loading and failure display a loading label or dash.
- The backend has no model catalog operation or separate model search field. Suggestions come from up to 100 current listings for the selected make; free text supports other models. Model and keyword controls share `search.text`, which searches title or model, and changing make clears that text.
- Make uses `brandIds`; exact year uses `yearsRange`; price uses `pricesRange`. Submission retains page 1, limit 9, `createdAt` and exact `DESC`.
- Recommended chips use supported `USED`, `NEW`, `ELECTRIC`, `HYBRID` and a maximum price of 20,000. The backend has no SUV/body category, fuel-economy metric or certification filter, so the screenshot's unsupported suggestions were replaced with these real filters.
- Existing dollar presentation is retained. The backend has no currency field; currency conversion or confirmation of business currency is outside this slice.
- Agents remain Agents. No unsupported Car fields or Seller/Dealer roles were added. No new backend mismatch beyond these screenshot capabilities was discovered; previously recorded backend findings remain in `FOUNDATION_MIGRATION.md`.

## Verification

- `yarn typecheck`: passed.
- `yarn lint`: passed, zero errors and 194 existing warnings.
- `yarn test:migration`: passed, including existing isolated Member/auth hydration and role checks.
- `yarn check:graphql`: passed against `http://localhost:3007/graphql`: 42 operations, three inline upload documents and registered enums.
- Production build: passed, 88 localized pages. The unchanged Next build CLI was invoked through `yarn node` with a temporary test-only config override to `.next/home-ui-qa`; this avoids writing into the concurrently running user's dev build. No project config change was needed.
- `git diff --check`: passed.
- All 45 header translation keys are present in English, Korean and Russian. Read-only production HTTP checks returned 200 for `/`, `/kr`, `/ru`, `/car`, the logo and hero image; the user's existing dev server at port 3000 also returned 200.
- Isolated headless Chrome against the production build: desktop 1690×930; mobile device detection at 390×844; 320-pixel width; Korean/Russian homepage routes; real listing count; previous/next and play/pause; actual Make/Year/Price menus; selecting a real model suggestion; selecting/toggling recommended chips; synchronized keyword/model text; serialized Car search navigation; language menu selection back to English; and the guest login route passed. No horizontal overflow or uncaught runtime exceptions were observed.
- The tested search submitted a real Brand ID, year 2024, price 0–20,000, `USED`, `ELECTRIC` and `Model 3`, with `DESC`. Screenshots are in `docs/screenshots/home-header-desktop.png` and `home-header-mobile.png`.
- The in-app browser runtime had no available browser. A separate temporary headless Chrome profile was used; live authenticated visual workflows and mutation/upload behavior are not claimed by these header checks.

An initial parallel dev preview encountered a shared Next webpack chunk error. Its owned server was stopped; the isolated production build and browser checks subsequently passed. The user's existing dev server and backend were left running.

## Asset generation

Mode: built-in `image_gen`; no CLI/API key or dependencies. Final workspace asset: `public/img/car/home-hero.png` (2172×724). The original generated file was retained in the Codex generated-images directory.

Prompt specification: a wide, photorealistic automotive website hero background with a white modern SUV on the right, parked on a spacious stone terrace; a city skyline and warm sunset on the left with clear space for dark headline text; a curved contemporary glass building at the far right; realistic reflections and natural light. Render the background photograph only, without typography, interface controls, badges or watermarks.

## Deferred scope

Existing below-header Home sections and all Cars cards, filters, detail/forms, saved lists and other screen migration defects remain for later approved work. The foundation report's previous stopping point was superseded only for this explicitly approved header slice. No Git commit was created.
