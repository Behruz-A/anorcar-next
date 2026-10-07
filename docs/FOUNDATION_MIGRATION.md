# Foundation migration — Phases 0 and 4–8

Completed 2026-10-07. Home/Cars UI implementation remains pending approval.

## Authoritative starting state

- Frontend HEAD: `a67b9f1`. The previously audited uncommitted migration was still present when implementation began.
- NESTAR reference HEAD: `7466964`; working tree clean before and after this work.
- No reset, checkout, commit, or automatic preservation of old implementation was performed.
- Initial path/status inventory: [FOUNDATION_STARTING_STATE.txt](FOUNDATION_STARTING_STATE.txt). Git's overall diff includes substantial pre-existing migration work; it is not the diff for these foundation phases alone.
- Read frontend/backend AGENTS.md and the four backend handoff documents before editing. Required context lives in `../anorcar/docs`; `../anorcar/docs/ai` does not exist. Backend DTOs/resolvers/enums and the running schema govern contracts where old documentation differs.

## Exact foundation changes

### Phase 0 — checks and necessary compatibility fixes

- Added `.eslintrc.json`, extending the installed `next/core-web-vitals` configuration. Added `eslint.dirs` in `next.config.js` so both lint and build inspect `pages`, `libs`, and `apollo`.
- Named returned layout components in `libs/components/layout/{LayoutAdmin,LayoutBasic,LayoutFull,LayoutHome}.tsx` and forward-ref components in `libs/components/common/ScrollControls.tsx` to resolve display-name errors.
- Replaced deprecated `ReactDOM.render` in ScrollHtml with `ReactDOM.createPortal`. Kept the target container, markup, refs, transforms, and explicit scroll/fiber providers; React manages portal cleanup. Existing Canvas/Home composition was not changed.
- Replaced the internal admin anchor in `libs/components/mypage/MyMenu.tsx` with Next Link, retaining its new-tab target.
- Recorded the initial Git state. No dependency or lockfile changes, rule suppressions, or broad warning cleanup.

### Phase 4 — domain types

- `libs/types/car/car.ts`: directly owns `MeLiked` and nullable `TotalCounter.total`, following NESTAR's original shared types inside the catalog output file. Existing Car dates are JSON strings; nullable description, lifecycle dates, joins, engagement, and counters remain aligned.
- `libs/types/car/car.input.ts`: nullable optional description/barter/rent values. Required Car fields and existing filter/sort contracts were verified against backend DTOs.
- `libs/types/car/car.update.ts`: required `_id`, nullable optional Car fields/status; no server-owned lifecycle timestamp inputs.
- `libs/types/brand/brand.ts`: output only. Added `brand.input.ts` and `brand.update.ts` using the existing per-domain input/update organization. Updated the BrandInput import in `pages/_admin/brands/index.tsx`.
- Removed `libs/types/engagement.ts` after moving consumers safely. Updated imports in `libs/types/member/member.ts`, `board-article/board-article.ts`, `comment/comment.ts`, and `follow/follow.ts` to `../car/car`.
- Those four output files now use string dates and nullable aggregation results/counters. Member nullable profile fields/access token match the DTO; memberImage and follower/following counters are required. Removed non-output memberPassword and non-output comment meLiked. Article image is nullable.
- Verified Car, Brand, Member and CAR engagement wire values. Kept `AVTOMATIC`, `CHONJU`, `DAEJON`, and string `ASC`/`DESC` exactly. Added serialization/role assertions in `scripts/check-car-migration.cjs`.
- Phase 5's expanded live validation subsequently exposed an inherited extra `CommentGroup.COMMENT`; removed that unused frontend value in `libs/enums/comment.enum.ts`. Backend supports only MEMBER/ARTICLE/CAR.

### Phase 5 — GraphQL organization

- Moved all 17 Car/Brand operations into the four existing files with explicit selections; operation names, arguments, variables, and response selections were preserved.
  - `apollo/user/query.ts`: GET_CAR, GET_CARS, GET_AGENT_CARS, GET_FAVORITES, GET_VISITED, GET_BRANDS, GET_BRAND.
  - `apollo/user/mutation.ts`: CREATE_CAR, UPDATE_CAR, LIKE_TARGET_CAR.
  - `apollo/admin/query.ts`: GET_ALL_CARS_BY_ADMIN, GET_ALL_BRANDS_BY_ADMIN.
  - `apollo/admin/mutation.ts`: UPDATE_CAR_BY_ADMIN, REMOVE_CAR_BY_ADMIN, CREATE_BRAND, UPDATE_BRAND_BY_ADMIN, REMOVE_BRAND_BY_ADMIN.
- Removed the pre-existing untracked `apollo/car.ts` and `apollo/brand.ts` after migrating consumers. No shared domain fragment layer remains.
- Only operation import paths changed in these 13 UI files:
  - `libs/components/car/CarSearchFields.tsx`
  - `libs/components/homepage/PopularCars.tsx`, `TopCars.tsx`, `TrendCars.tsx`
  - `libs/components/member/MemberCars.tsx`
  - `libs/components/mypage/AddNewCar.tsx`, `MyCars.tsx`, `SavedCars.tsx`
  - `pages/_admin/brands/index.tsx`, `pages/_admin/cars/index.tsx`
  - `pages/agent/detail.tsx`, `pages/car/detail.tsx`, `pages/car/index.tsx`
- Updated `scripts/check-car-migration.cjs` and `scripts/check-graphql-contract.cjs` to load the four canonical files. Live validation also compares registered enum names and validates inline upload documents in Teditor, MyProfile and AddNewCar. It performs introspection, not mutations/uploads.

### Phase 6 — shared/core

- Restored `libs/hooks/useDeviceDetect.ts` to the NESTAR reference's user-agent implementation instead of the previous viewport-breakpoint rewrite.
- Evaluated and retained the existing Apollo singleton/initialize/useApollo pattern, links, InMemoryCache, reactive variables, environment names, multipart uploads, and token-bearing WebSocket integration. No new cache policy, transport, utility layer, or socket architecture was introduced.
- Existing configuration constants and utility behavior already preserve their organization. Deferred Car UI helpers were not prematurely removed from working consumers.

### Phase 7 — authentication/Member

- `libs/auth/index.ts`: login/signup propagate actual backend GraphQL messages or network errors; missing access tokens reject. Failed authentication no longer reloads the page or silently permits navigation after failed signup.
- Signup submits only USER/AGENT. ADMIN remains valid for existing login/hydration, while Seller/Dealer are not signup roles.
- Retained JWT/localStorage keys, login/logout timestamps, reactive Member state, and explicit logout reload. Hydration handles guest/expired/malformed tokens and rejects unknown role/missing-member claims.
- Retained the existing `authReadyVar` gate because it prevents premature protected-page redirects and repeated layout hydration. Successful auth marks readiness. Added defaults for backend Member counters and mapped followers/followings/comments alongside memberCars.
- `apollo/store.ts` and `libs/types/customJwtPayload.ts`: added those three existing backend counters to initial state/JWT types.
- `libs/enums/common.enum.ts`: backend error names/messages now match ANORCAR, including authentication and duplicate nickname/phone errors. INSERT_ALL_INPUTS remains a local form message.
- `libs/types/member/member.update.ts`: removed server-only deletedAt from both frontend input interfaces.
- `pages/account/join.tsx`: Agent option uses the Agents label; both success redirects accept local paths; callback dependencies include router. Failed auth stays in the form.
- Added `scripts/check-foundation-auth.cjs`, invoked by existing migration checks. It tests the real helpers with isolated storage/Apollo responses; it does not create live accounts or alter data.

### Phase 8 — navigation/layout

- `libs/components/Top.tsx`: restored Agents labels and original mobile navigation composition, removing the extra mobile logo added by the previous migration. Car route/labels, notification icon, locale handling and existing desktop navigation structure remain.
- `libs/components/layout/LayoutBasic.tsx`: restored NESTAR's per-route banner mapping and Agents/Agent Page headings. Kept Car mapping and ANORCAR branding. Auth header is derived from the current route so it does not persist after navigation away from login; wrapper, containers, footer and chat retain their existing organization.
- `public/locales/{en,kr,ru}/common.json`: restored original Agents and Agent Page translations.
- Home layout received only the Phase 0 component name fix; its existing hero/mobile filter/composition changes are deferred.
- Existing legacy redirects were retained and checked for locale/query preservation. No routes, SCSS, Home composition, filters, card markup, or Car forms/screens were redesigned.

## Verification

Each phase completed all five Yarn checks after its implementation. Resolved failures were rerun before advancing.

| Phase | typecheck | lint | build | test:migration | check:graphql |
| --- | --- | --- | --- | --- | --- |
| 0 | PASS | PASS | PASS | PASS | PASS |
| 4 | PASS | PASS | PASS | PASS | PASS |
| 5 | PASS | PASS | PASS | PASS | PASS |
| 6 | PASS | PASS | PASS | PASS | PASS |
| 7 | PASS | PASS | PASS | PASS | PASS |
| 8 | PASS | PASS | PASS | PASS | PASS |

- Final lint: zero errors, 194 existing warnings; no blanket disabling. Warnings concern existing images, hook dependencies and legacy link patterns. Earlier phase logs had 198 warnings; auth dependencies/mobile logo reduced that count.
- Final build generated 88 localized pages.
- Final live contract check: 42 exported operations, three inline upload documents and registered enums validated against `http://localhost:3007/graphql`.
- Auth regression checks: guest/USER/AGENT/ADMIN hydration; one-time hydration; expired/malformed/unknown-role tokens; SSR safety; backend/network/missing-token failures; USER/AGENT-only signup; counters; stale response protection; logout.
- Read-only production HTTP checks on temporary port 3012: seven routes returned 200 (`/account/join`, `/agent`, `/car`, `/community?articleCategory=FREE`, `/cs`, `/kr/account/join`, `/ru/account/join`); English navigation rendered Cars and Agents, with no Sellers navigation label.
- Three redirects returned 308 and preserved parameters/locale: Property detail → Car detail; Korean Property listing → Car listing; admin Properties → admin Cars. Four restored/current banner assets returned 200.
- `git diff --check` passed. No obsolete root Car/Brand operation imports or engagement-module imports remain in active source.
- Browser runtime reported no available browser and an empty browser list. Interactive desktop/mobile rendering, real authenticated sessions, and live mutation/upload/role workflows remain unverified; isolated auth tests and HTTP checks do not claim that acceptance.

## Architecture differences and reasons

- No new frontend architecture, routing system, state management, dependencies, or UI component hierarchy was introduced by these phases.
- Brand is a real backend entity without an original NESTAR entity counterpart; its operations/types fit the existing user/admin/per-domain patterns. Existing Brand admin UI is deferred for its later pattern review.
- The retained readiness reactive variable is a small compatibility gate inside existing Apollo/auth architecture, tested for hydration timing.
- ScrollHtml's portal is the necessary React 18/lint compatibility change. Existing scroll/fiber containers and providers remain; visual Canvas acceptance is deferred with Home.
- Deriving Basic layout's auth header is a local route-state correction, not a layout redesign.
- The current tree still contains prior UI architectural departures listed below. Their presence is not approval to preserve them.

## Backend mismatches/findings

- Corrected frontend mismatches: unsupported CommentGroup.COMMENT; nullable counter/profile/aggregation types and Date assumptions; old auth error strings; server-only Member deletedAt input. Current exported/inline GraphQL documents validate against the running schema.
- Backend MembersInquiry uses `@IsIn([availableMemberSorts])`, a nested array rather than the sort strings. Normal admin sort values appear liable to validation rejection. This is a source finding, not authenticated runtime verification; no backend workaround/change was introduced.
- Member type/status output fields are GraphQL String even though backend types/schema use Member enums; frontend role comparisons retain the actual USER/AGENT/ADMIN values.
- Backend signup accepts optional MemberType without a USER/AGENT-only restriction; updateMember exposes optional role/status fields. Frontend signup restricts offered/submitted roles; backend authorization review is outside this task.
- Comment deletion/update does not decrement target comment counters in the inspected service. Existing backend behavior was not changed.
- Notice/notification schemas have no connected CRUD/read resolvers for new frontend features. Existing inert notification/newsletter/contact behavior remains; no invented operations.
- Historical backend/frontend handoff documents include stale Property and Seller descriptions. This foundation report supersedes their claim of completed strict frontend parity.

## Deferred pre-existing migration defects — approval required

- Home: original FiberContainer replaced by car hero art; advertisement/video composition changed; added mobile header/filter; original section/card composition needs strict NESTAR parity review.
- Cars filters/cards/details/forms: shared CarSearchFields and draft Apply/Reset behavior diverge from original HeaderFilter/sidebar patterns; metadata placement, original filter behavior, forms/uploads and desktop/mobile branches need their later phases.
- Favorites/visits were consolidated into SavedCars instead of retaining their separate original implementations. Owner inventory/forms also diverge from original controls and patterns.
- New broad `scss/car.scss` styling and prior responsive screen rewrites remain unreviewed. Device selection now follows the original user-agent behavior, but deferred mobile screens have not yet been restored.
- Existing Home/Cars/About/FAQ/admin UI copy still contains Seller wording. Navigation, shared layout headings, translations for Agents, and signup labeling were corrected; other screen copy awaits its authorized phase.
- About/FAQ/admin screens and Brand administration require later pattern review; no broad screen restoration occurred here.
- No unsupported Car fields were added in these phases. Later screens still require full backend business-rule and visual acceptance.

STOP: foundation phases are complete. Do not start Home/Cars UI migration until the user approves the next phase.
