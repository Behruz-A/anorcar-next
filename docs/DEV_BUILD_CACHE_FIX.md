# Recurring blank dev page — 2026-10-08

The running dev server and production builds were sharing `.next`. Builds replaced files still referenced by the dev server and open browser tabs. Actual dev logs showed `Cannot find module './6859.js'`, 500 responses for Next page data, and repeated 404 responses for `main.js`, `react-refresh.js`, `_app.js` and `index.js` despite the HTML route returning 200. This explains why checking only the HTML response missed the blank-page failure.

The earlier temporary QA wrapper did not apply its assumed output-directory override. Its builds also wrote to `.next`, recreating the conflict after a cache restart. Earlier reports claiming that wrapper isolated output are corrected by this report.

## Fix

- `next.config.js`: use `.next-dev` when `NODE_ENV` is `development`; keep `.next` for production build/start. Existing object export, redirects, i18n, API environment names, Apollo and app architecture are unchanged.
- `.gitignore`: ignore `.next-dev` alongside `.next`.
- Restarted the frontend on port 3000 with normal `yarn dev -p 3000`; backend port 3007 was left running.

No UI, domain contract, dependency, lockfile or backend source change was required. The dev server remains running on port 3000. An already-open tab may need one reload to replace its stale document/scripts.

## Verification

Normal Yarn typecheck, lint, migration/auth tests and live GraphQL validation passed. Lint has zero errors and 194 existing warnings. A normal `yarn build` passed with 88 localized pages while the dev server remained running; no temporary build-config wrapper was used.

A single browser session loaded the dev homepage before the build, rendered all eight budget cards and the actual listing count, and recorded the served JavaScript files. During the checks/build it repeatedly verified those URLs (81 rounds). Afterward it compared SHA-256 hashes: every original dev JavaScript file was unchanged and still returned 200. Reloading the same browser session rendered the page again, with no uncaught runtime exceptions or failed requests. The post-build screenshot is `docs/screenshots/dev-after-build-fix.png`.

Normal `yarn start -p 3012` also returned 200 with the budget section; its build manifest confirmed production `distDir` is `.next`. The dev entry existed independently in `.next-dev`. The temporary production QA server and browser were closed; the frontend dev server remains available. `git diff --check` passed.
