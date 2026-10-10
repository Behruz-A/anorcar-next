# My Account / My Profile UI — 2026-10-10

Implemented the supplied account/profile reference in the existing NESTAR-derived My Page structure. The page remains Next Pages Router with `withLayoutBasic`, `MyMenu`, `MyProfile`, MUI/SCSS, Apollo reactive user state, and the existing GraphQL/auth helpers.

## Changes

- Replaced the oversized My Page banner with breadcrumbs, My Account title and subtitle. This route uses the existing shared marketplace navbar in a sticky, opaque shell.
- Added the compact user card and grouped sidebar: activity, community, account settings, and existing AGENT-only listing management. Retained all category URLs, legacy category normalization, admin access and logout confirmation.
- Rebuilt only the profile presentation: round photo/camera action, Change Photo/Remove Photo, icon fields for username/phone/address, Cancel and Save Changes. Desktop uses two field columns; narrow screens stack them and keep every sidebar group visible.
- Preserved UPDATE_MEMBER, multipart imageUploader with target member, JWT storage refresh and userVar hydration. Sends only the existing profile fields and current member ID. Address/photo are optional; removing a photo submits an empty memberImage. Cancel restores the saved profile draft.
- Added 5 MB/JPEG/PNG upload validation, upload/save pending controls, duplicate submission prevention, inline failure feedback, mutation/upload error handling and stale account/unmount guards. Nickname follows the backend's 3–12-character constraint. Empty required username/phone cannot save; unchanged forms do not submit.
- EN/KR/RU strings use the existing common dictionaries. Existing imageUrl handles backend and local images; failed portraits fall back to the existing default avatar.
- The reference's SKT Verified badge and Find Zipcode control were omitted because those integrations do not exist in the current contract. Names, phone numbers, addresses and portraits render stored user data. Preview identity is a browser-only fixture.

## Validation

- Yarn typecheck passed after phases and final source changes.
- Yarn lint passed with warnings and no errors. Yarn test:migration passed including existing auth regression checks and translation assertions.
- Yarn check:graphql validated 42 operations, three inline upload documents and registered enums against the local backend.
- Final Yarn production build passed with 91 localized pages; generated KR/RU My Page dictionaries were checked for the corrected UTF-8 values.
- `scripts/qa-my-profile.cjs` passed in isolated headless Chrome at 1440/1024/768/390/320px. Checks cover bounds, portrait loading, sidebar/profile alignment, EN/KR/RU, role-specific menus, initial/dirty/invalid drafts, Cancel, optional empty address, photo removal, duplicate-save guard, JWT/storage refresh, save error, upload MIME/size/error/success, logout cancellation/confirmation and guest redirect. No uncaught runtime exceptions.
- All browser API responses for authenticated tests were intercepted fixtures. No live account mutation/upload, credentials, database changes or demo seeding. Live GraphQL validation was read-only.
- Desktop/mobile previews were visually reviewed: `docs/screenshots/my-profile-fixture-1440.png` and `docs/screenshots/my-profile-fixture-390.png`. These are explicitly fixture previews.
- The dev server was restarted to load corrected dictionaries and remains on port 3000. Backend remains on 3007.

## Scope and files

`pages/mypage/index.tsx`, `libs/components/mypage/MyMenu.tsx`, `libs/components/mypage/MyProfile.tsx`, `scss/pc/mypage/mypage.scss`, `scss/pc/mypage/myProfile.scss`, the three common dictionaries, and minimal My Page conditions in `Top.tsx`/`LayoutBasic.tsx`. Added the QA script, this report and fixture screenshots.

Other My Page sections keep their existing components and business logic; their UI redesign and pre-existing mobile placeholders remain follow-up work. No dependency/lockfile, backend source/schema, Git commit or deployment changes. AGENTS.md and backend handoff files were read; the actual handoff location is `anorcar/docs`, since `docs/ai` is absent.
## Follow-up: Cars-image hero

- My Page now renders the existing Cars hero on desktop/mobile using `public/img/hero4.png`. Copy: **My Page** / **Manage your profile, favorites, and community activity.**, reusing existing EN/KR/RU keys.
- Reused LayoutBasic's marketplaceHero and Cars overlay/responsive sizing (557px desktop, 360px at 800px and below). Account-scoped content alignment matches the existing account container and removes the offset intended for the Cars fixed navbar; account navbar remains in flow.
- Yarn typecheck passed. Extended the existing isolated browser check with image/title/subtitle, height, text bounds, no horizontal overflow and hero-to-account alignment at five widths; existing profile flows remain covered. No new API, dependency or backend changes.
- Hero previews: `docs/screenshots/my-page-hero-fixture-1440.png` and `docs/screenshots/my-page-hero-fixture-390.png` (account data is a browser fixture).
## Current refinement — 2026-10-10

This supersedes the earlier hero dimensions and mobile navigation presentation above.

- Kept the existing Cars hero4 image and account copy, with a compact 300px desktop/220px mobile hero scoped only to account-shell. Removed the duplicate account subtitle and reduced the heading-to-content gap.
- Refined existing MyMenu/MyProfile styles: consistent Poppins typography, balanced sidebar/card spacing, subtle borders/shadows, section icon, smaller avatar and a grouped photo area. Account navbar now marks My Page active. Desktop sidebar stays within the content while scrolling.
- Mobile menu now expands from a labeled MUI button with aria-expanded/aria-controls; selecting a category collapses it. All existing routes and role-specific links remain. The form is visible sooner on narrow screens.
- Profile footer explains unchanged, unsaved, invalid, uploading and saving states. Username guidance follows the backend 3–12-character rule; invalid username/empty phone receive inline feedback after blur, linked through aria-describedby/aria-invalid. Address is explicitly optional. Cancel resets draft/errors/touched state, and the existing save/upload/JWT behavior remains.
- Fixed invalid/repeated category query handling and the stray empty carId parameter without adding undefined query values. Invalid categories fall back to My Profile; legacy property category mappings and relevant IDs remain.
- Yarn phase typechecks and migration/auth/translation checks passed. Final production build generated 91 localized pages and passed its type/lint checks with warnings and no errors.
- Expanded the existing isolated Chrome QA: five viewport widths, compact hero bounds, mobile menu opening/closing, invalid URL normalization, unchanged/invalid form status, real keyboard Tab/blur validation, duplicate-save guard and saved JWT/draft refresh, upload/save failures and success, optional address/photo removal, EN/KR/RU, role menus, Admin without portrait/address and logout/guest redirect. Passed without uncaught runtime exceptions. Authenticated requests remain intercepted fixtures; no real account/data mutation.
- Refreshed and visually reviewed desktop/mobile hero/profile fixture screenshots. Added `docs/screenshots/my-profile-admin-empty-1440.png` to cover the screenshot's missing-data case. Frontend dev remains on port 3000 after reloading the locale dictionaries.
- Existing NESTAR folder/component/layout/Pages Router/MUI/SCSS/Apollo structure and GraphQL contract remain. No new component framework, dependencies, backend source/schema/data changes, commit or deployment.

## Attached brief refinement — 2026-10-10

- Refined the existing account UI without changing navbar/footer, category components, role menus, fields, localization or Apollo contracts during this phase.
- Kept hero4 and its existing text/gradient. Desktop hero remains 300px; positioning at center 78% shows the SUV wheels and bumper. Mobile remains 220px. Hero and account content share the 1300px container.
- Desktop sidebar is 250px with a 24px column gap, independent column heights, 32px heading top spacing and 64px bottom padding. Tablet retains a narrower sidebar; mobile keeps collapsible navigation.
- Sidebar rows remain 42px; labels are 14px, group headings 12px. Cards use restrained 12px corners and orange-red #F04432 accents.
- Profile title is 22px (21px mobile), labels/inputs/body 14px and helper text 12px. Inputs remain 48px with 8px corners. Photo area now has a single divider and no nested card border, with an 88px avatar. Mobile photo controls have 44px tap targets.
- Save uses #F04432 when valid and dirty; unchanged/invalid/busy states keep the existing disabled behavior with a neutral gray appearance. Status and Cancel remain unchanged functionally.
- Validation: Yarn typecheck passed. Existing isolated Chrome checks passed at 1920/1440/1024/768/390/320px, including EN/KR/RU, USER/AGENT/ADMIN, save/upload errors and success, Cancel, dirty/invalid drafts and logout. Preview identities and authenticated API writes are intercepted fixtures only. Production build passed with existing lint warnings.
- Updated desktop/mobile fixture screenshots; added the 1920px hero preview. No dependency, backend source/schema/data, commit or deployment changes.
