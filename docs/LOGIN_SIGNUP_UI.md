# Login and signup — 2026-10-12

The existing `/account/join` page now has a responsive ANORCAR login/signup form. Signup is directly accessible through `/account/join?mode=signup`; the default route opens login. Existing referrer queries survive mode changes.

- Preserved Pages Router, layout HOC, MUI, SCSS, Apollo login/signup operations, JWT storage and 15-minute access/30-day cookie refresh sessions.
- Uses the supplied `/img/car/loginpageimg.png` with a left image/right form desktop layout and compact mobile banner. Shared marketplace navigation sits above the page, without overlapping the form. Removed the old real-estate banner and unused auth hero.
- Added labeled fields, password masking/show-hide, autocomplete, signup password confirmation, buyer (`USER`)/seller (`AGENT`) radios, field validation matching backend nickname 3–12/password 5–12 limits, and phone presence validation.
- Enter submits the form; a synchronous lock blocks duplicate requests. Pending fields, mode controls and submit button are disabled. Backend errors appear inline and failed attempts retain input for retry.
- Successful login/signup uses existing auth helpers and returns to a safe local referrer or home. Login-page loops, protocol-relative URLs, backslashes and control characters are excluded.
- Added EN/KR/RU translations. Help links to the existing support page. Removed the unconnected remember-me and password-reset controls.

QA uses isolated GraphQL browser fixtures rather than live accounts or database changes. Script: `scripts/qa-login.cjs`. Previews: `docs/screenshots/auth-login-1440.png`, `auth-signup-1440.png`, `auth-login-390.png`, `auth-signup-390.png`.

Backend instructions reference `anorcar/docs/ai`, which does not exist; existing backend handoff documents are in `anorcar/docs`.

## Verification

- Phase and final `yarn typecheck`, existing `yarn test:auth`, and `git diff --check` passed.
- `yarn build` compiled and generated all 91 localized pages; lint retains the project's img/Link and other warnings.
- `yarn node scripts/qa-login.cjs` passed login/signup at 320/390/768/1024/1440px, image loading, navbar clearance, masked/show-hide passwords, blank/length/confirmation/phone validation, double submission, exact trimmed GraphQL payloads, USER/AGENT roles, credentialed client headers, inline backend/network errors, retained values/retry, successful auth storage and referrer navigation, unsafe referrer rejection, mode/referrer preservation and KR/RU mobile localization. No uncaught runtime exceptions or live account writes.
- Screenshots were visually reviewed. A static-page readiness guard that kept the queries-free login submit disabled was removed; pending requests still disable submission. Two Next dev servers sharing `.next-dev` were replaced with one on port 3000. Backend remains on port 3007.

## Supplied login image — 2026-10-12

- Replaced the homepage photo with the user's `loginpageimg.png` on both login and signup. Kept the original file; CSS cover sizing preserves its proportions. Adjusted the crop to the car and increased the mobile banner to 220px.
- Followed the supplied caption reference with a compact bottom-left heading, “Find your next car.”, and subtitle, “Buy, sell and explore with ANORCAR.” Added EN/KR/RU translations and a lower dark overlay for readability.
- Yarn typecheck and the existing five-width/three-locale login browser suite passed. Refreshed screenshots reviewed. Authentication behavior remains unchanged.

## Reference layout sizing — 2026-10-13

- Matched the supplied layout proportions with independent rounded image/form blocks, a wider image column (1.125:1), responsive 32–88px column gap and a centered 1360px maximum layout width.
- Desktop photo height is 760px; both login/signup forms share an 832px minimum height. Content can expand for translations and errors. Compact spacing keeps signup fields within the same default desktop height as login.
- Below 900px the blocks stack with automatic form height; mobile keeps a 220px image. Existing supplied image, caption, account fields and authentication behavior remain.
- Yarn typecheck, existing five-width/three-locale browser checks and diff check passed; desktop/mobile previews refreshed and visually reviewed.
