# Frontend release review — 2026-10-17

The frontend was checked across Pages Router entry points, shared components, Apollo operations, SCSS, scripts and dependencies. The Nestar folder/component patterns, React 18, MUI, SCSS and GraphQL contracts remain. This review does not certify production infrastructure or every possible runtime interaction.

## Cleanup and corrections

- Removed confirmed unreachable legacy advertisement/events/carousel/3D modules, an unused My Page article module, unused styled helpers and obsolete video regression/temporary scripts. Retained compatibility routes, shared contracts and utilities used by regression tests.
- Removed unused imports, declarations, parameters, debug logging and obsolete video configuration. Strict unused-declaration checks now form part of `yarn typecheck`.
- Corrected effect dependencies and redundant refetches in member lists, admin Community, car detail and chat. Preserved mutation handlers, authentication, pagination and Apollo transport.
- Replaced template admin FAQ/Notice records and inactive controls with the existing published FAQ dataset and real NEWS articles. FAQ content is read-only; news editing uses existing admin Community controls.
- Reused Next Image for existing image elements, preserving local/remote URLs with `unoptimized`, CSS cropping and fallback handlers. No remote image optimizer contract was introduced.
- Added a shared current DOMPurify sanitizer to Toast UI Editor and Viewer. Toast UI embeds an older sanitizer, so overriding its dependency alone would not protect rendering. Rich text, links and images remain; executable markup and embedded frames are removed.
- Removed unused direct dependencies and refreshed the Yarn lockfile. Next.js is 15.5.27 with the existing Pages Router/React 18; Swiper is 12.1.2 with its required module import paths. Axios is 0.34.0. Apollo remains pinned to the original 3.8.3 to preserve existing Nestar query callbacks and cache behavior.
- Security resolutions pin DOMPurify 3.4.16, PostCSS 8.5.23 and grpc-js 1.13.6. Yarn reports their intentional mismatch with upstream version constraints. Toast UI's React wrapper also declares React 17 as a peer; React 18 is retained and the real Viewer smoke test passes.
- Replaced starter documentation and public environment examples with actual Yarn setup/deploy instructions. API and WebSocket origins must be configured before the production build.

## Validation

| Check | Result |
| --- | --- |
| `yarn check:release` | Passed: strict TypeScript, ESLint with zero warnings, migration/homepage/search/agents/auth regressions, Firebase chat fixtures, Apollo cache, compare/restoration and article sanitization |
| `yarn check:graphql` | Passed: 53 frontend operations, 3 inline uploads and enums against the local backend |
| Focused admin, Cars browse, card, free-text brand and comparison-results scripts | Passed; admin mutations use isolated fixtures and live range checks are read-only |
| `yarn build` | Production artifact generated successfully: 91 localized/static pages |
| Production HTTP smoke on port 3010 | Passed: 13 page/asset responses and 3 locale/query-preserving legacy redirects |
| `git diff --check` | Passed after whitespace cleanup |
| `yarn audit --groups dependencies` | Zero reported production dependency advisories |
| Full `yarn audit` | One high-severity development-only advisory remains; details below |

The new article test executes the real Toast UI Viewer in JSDOM, checks safe text/images/links and rejects scripts, event handlers, JavaScript URLs, forms, SVG and iframes. Browser visual QA and production-account flows were not performed; no browser surface was available. SDK fixtures do not exercise a deployed Firebase project.

## Remaining findings

- Full dependency audit reports **braces**, through `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). The registry lists no patched version. It concerns deeply nested glob patterns processed by development tooling; it is absent from the production dependency audit. Do not claim the full audit is clean.
- Existing Sass `@import` deprecation warnings remain. Replacing the project's SCSS architecture was outside this cleanup and would conflict with the requested incremental approach.
- Shared translation payloads produce existing approximately 142 kB page-data warnings on English pages. The build succeeds; translation namespace splitting is a separate performance change.

## Before deployment

Follow `README.md`: use public HTTPS/WSS API origins, deploy the matching backend before frontend queries that select optional agent fields, configure Firebase authorized domains/rules/token endpoints, and build with production environment values. Local artifacts were built with `.env.local`, so rebuild for production. Use frozen-lockfile installation and a supported Node LTS release. Check login/refresh/logout, uploads, admin permissions, responsive UI and chat on the deployed origin using test accounts. No deployment or commit was made during this review.
