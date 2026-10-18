# Local full-project review - 2026-10-18

Reviewed the frontend and matching sibling backend, preserving the Nestar Pages Router/Apollo/MUI/SCSS and Nest resolver/service/module architecture. No production configuration, deployment, restart, SSH access or live account/data mutations were performed during this review. Existing unrelated edits were retained. Backend handoff files are in `../anorcar/docs/`; `docs/ai` is absent.

## Corrections

- Moved required member/brand lookups ahead of count/pagination in public, agent and admin car lists. Applied the same correction to admin articles, comments, follow lists, favorites and visited cars where a missing joined record previously consumed a page slot. Counts and pages now describe the same visible set. Existing filters, sorting, authenticated viewer state and records remain. See `BUDGET_RESULTS_FIX.md`.
- Blocked public ADMIN registration and self-service role/status or other-member changes. Profile/admin password updates now use the existing bcrypt helper; admin-only role changes remain available. The resolver passes the original target ID to the service for validation.
- Kept the existing upload mutations while sharing target/extension/MIME validation and stream handling. Upload targets are limited to member/car/article, filenames are generated, and source/destination stream failures propagate. Batch uploads report failure instead of a sparse success array. Validation uses filename/MIME metadata; this is not image-content decoding, and failed uploads are not a filesystem transaction.
- Comment deletion now decrements its target count once; subsequent admin removal of an already deleted comment does not decrement again. Concurrent duplicate likes/views no longer produce duplicate counter increments; only an actual removed like decrements. No historical counter repair or database migration was run.
- Escaped car/member/article search text as literal text, including compatibility with frontend escaped punctuation, preventing malformed regex errors and user-supplied regex evaluation.
- Removed request/response/credential debug logging. Shared WebSocket chat broadcasts only public member ID, nickname, portrait and role rather than a full token profile; chat text is excluded from logs. Existing chat transport and Firebase integration remain.
- Repaired backend ESLint configuration to use installed parser/plugin versions, removed unused declarations/imports and centralized the small duplicated upload/update/comment-counter operations within existing classes. Replaced the sole backend Moment usage with native dates and removed four unused direct packages. No folder reorganization or whole-app rewrite.
- Replaced stale generated HTTP tests with isolated API/batch smoke tests that do not boot a database or scheduled jobs. Added behavioral security/upload/counter/search/chat-privacy tests and permanent frontend `test:ui` / `check:live` commands. Canonical-enum integration checks now paginate the full inventory rather than assuming at most 100 cars.

## File cleanup

Removed **46 confirmed unused files, 55,645,129 bytes (53.07 MiB)**: nine unreachable source modules/types and 37 obsolete media assets. References were checked against source/tests and 258 image references returned by the local public API. Exact paths, original sizes and SHA-256 values are in `cleanup-files-2026-10-18.json`.

Retained compatibility routes, shared contracts/test fixtures, currently used catalog/community/agent images, credit records, CARIMG originals and backend uploads. The pre-existing deletions of SKILLS.md, favicon.ico, next.svg and ads.mov are excluded from this cleanup count. No additional video was deleted because no additional confirmed-unused video was found.

## Verification

| Check | Result |
| --- | --- |
| Frontend `yarn check:release` | Strict typecheck, zero-warning ESLint and functional fixture/regression scripts pass, including UI checks |
| Frontend `yarn check:live` | 54 operations, three inline upload documents/enums; read-only range, all-budget pagination and full 163-car enum checks pass |
| Frontend `yarn build` | Pass: 91 generated pages |
| Built frontend HTTP/SEO checks on local port 3010 | Pass: 12 page/asset responses, missing detail 404, three locale/query redirects, 23 HTML SEO routes and OG image dimensions |
| Backend API and batch TypeScript / ESLint | Pass: both typechecks; zero-warning lint |
| Backend Jest with local Firebase emulator | Pass: 19 suites, 274 tests, zero skipped |
| Backend isolated HTTP tests | Pass: API and batch, one each; no database/scheduler |
| Backend production builds | API and batch pass |
| Backend dependency tree | `npm ls --depth=0` and version-scoped WebSocket tree pass |

The budget integration checks verify every page, counts, joins, uniqueness, price bounds/order and the empty page after the end. Existing inventory already covers every budget: Under10M 2, Under20M 21, Under30M 63, Under40M 107, Under50M 133, Under75M 153, Under100M 160, Any163. No synthetic listings were necessary.

These checks combine unit/fixture tests, a local Firebase rules emulator, read-only API integration, production builds and HTTP HTML checks. No interactive browser surface was available, so responsive visual QA and real browser account/upload flows remain to be checked. Tests ran on local Node 25; verify the lockfiles on the supported Node LTS used by production. Frontend build retains existing Sass `@import` and roughly 142 kB translation page-data warnings.

## Dependency findings and deployment limits

Compatible local patches reduced the backend **runtime audit from 36 findings (one critical, 19 high, 16 moderate) to 23 (zero critical, 13 high, ten moderate)**. These are affected dependency-node counts, not 23 independently confirmed exploit paths. Kept Nest10/Apollo4 and the existing upload integration; did not force a breaking upgrade. The snapshot in `dependency-audit-2026-10-18.json` records remaining package names, installed versions and advisory URLs, without environment values or secrets.

Security overrides pin proxy-addr 2.0.8, qs 6.16.0, body-parser 1.20.6, glob10 to10.5.0, lodash4.18.1, multer2.4.0 and uuid11 to11.1.1. WebSocket8 resolves to the patched root8.22.0 while the required legacy subscriptions transport keeps ws7. Mongoose resolves to8.24.5. Lockfile changes are required along with source changes.

Remaining runtime findings include Nest core, Apollo Server/GraphQL tools, graphql-upload/dicer, file-type, brace-expansion/braces and Apollo's uuid9. Several fixes require coordinated major framework/upload migrations. For example: [Nest advisory](https://github.com/advisories/GHSA-36xv-jgw5-4q75), [Apollo advisory](https://github.com/advisories/GHSA-9q82-xgwf-vj6h). Do not describe this backend dependency audit as clean or treat these findings as fixed by the local code review.

Frontend production dependency audit reports zero findings; the full frontend audit retains one development-only braces advisory through ESLint tooling ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)). No patched braces version was reported. Existing details are in `DEPLOY_REVIEW.md`.

Production AI root cause is **still unconfirmed** pending the user-run Docker configuration/provider diagnostic output. Local tests and safe reason-code logging do not prove the deployed Gemini issue is resolved. See `AI_PRODUCTION_DIAGNOSTICS.md`; never print API keys or deploy/restart production automatically.

Before user-managed deployment, resolve/review the remaining runtime advisories, obtain the AI diagnostic result, and rebuild frontend with production HTTPS/WSS values. Local backend records/uploads from earlier authorized content work require separate migration if production uses a different store. Keep the matching backend/frontend revisions together and perform browser login/refresh/logout, role permissions, upload, budget, chat and locale smoke checks on staging. No deployment was performed here.
