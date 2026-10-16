# ANORCAR admin console

The existing Nestar `withAdminLayout`, `/_admin` routes, MUI tables and controls, Apollo queries/mutations and admin SCSS entry point remain in use. No backend API, schema, authentication contract, dependency or new component architecture was introduced.

- White console, ANORCAR accents, fixed admin navbar and sidebar; content starts below the navbar without a hero. Mobile uses the same sidebar as a temporary drawer.
- ADMIN-only **Admin Console** links in the public account dropdown and My Page navigation. Personal profile/activity features remain available. `/_admin` continues to open `/_admin/users`.
- Members: real global member/agent/active/blocked counts through aliases of the existing `getAllMembersByAdmin`; nickname search, combined type/status filters, pagination and inline type/status selects.
- Agents: the same member page/component and API, with `memberType=AGENT` in the route. Switching type filters keeps route/query state consistent.
- Members/Agents omit optional `sort` and use the service's default newest-first order. The current backend DTO incorrectly nests `availableMemberSorts` inside `IsIn`, rejecting explicit `createdAt` even though GraphQL schema validation accepts it. Reproduced with the actual backend DTO/class-validator: explicit sort fails, omitted sort passes for both member and agent inputs. Regression checks enforce omission. No backend change or restart is required for this frontend compatibility fix.
- Cars: preserved location/brand/status filters and pagination; status selects support ACTIVE → SOLD/DELETE and SOLD → ACTIVE, with permanent removal restricted to deleted listings. Reactivating clears lifecycle dates and increments the owner's active listing count once; status-conditioned updates guard concurrent requests. Deleted listings remain non-restorable. Existing service/resolver/GraphQL contracts are retained.
- Mutations retain confirmation, cancel and error handling, prevent concurrent submissions and refresh the affected list/counts. Existing Brands, Community, FAQ, Inquiries and Notices routes remain linked.
- Member and car tables keep profile/detail links, IDs, real images, fields and values. Tables scroll horizontally on narrow screens.

Checks passed: `yarn typecheck`, `yarn check:graphql` (54 operations), `yarn test:migration`, `yarn node scripts/check-admin-console.cjs`, desktop/mobile Sass compilation and `yarn build` (91 pages). Build reports existing lint/image, Browserslist, large page-data and CSS compatibility warnings. Admin regressions use isolated Apollo/router responses and do not modify live accounts or listings. Browser visual QA was not performed.
