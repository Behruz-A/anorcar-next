# Agents browse reference UI — 2026-10-10

The existing /agent page now uses the supplied four-column portrait-card reference, with an orange active display toggle, nickname search, supported sorting, real counts, profile links, location and inventory metadata, and heart controls. The red annotation and profile arrows were omitted. Shared navbar/banner/footer remain.

Preserved Pages Router, LayoutBasic, Apollo GET_AGENTS and LIKE_TARGET_MEMBER, USER/AGENT/ADMIN roles, member types and scoped SCSS. Replaced the old mobile placeholders with the same responsive UI: four/three/two/one grid columns and a functional list mode. Default query is memberRank DESC, page 1, limit 8. URL filters survive reload/back navigation; search and sort reset pagination. Literal search escapes regex characters because the backend matches memberNick with a regex. Invalid URL JSON falls back safely.

Backend AISearch supports text only and matches nickname, not full name or address. Therefore the reference's unsupported city filters/counts were omitted. Card addresses and memberCars are real; missing location is explicit and missing/broken portraits use the established avatar. No fictional profiles, city counts or backend filters were added. Existing like mutation/refetch and guest-login guard remain, with pending-click protection. Authenticated like persistence was not tested in this read-only task.

Loading skeletons, empty/reset, error/retry, keyboard focus, accessible toggle/like labels, reduced motion and EN/KR/RU translations are included. An initial server/client loading mismatch was found during QA and fixed by delaying the query until mounted.

Changed implementation files:
- pages/agent/index.tsx
- libs/components/common/AgentCard.tsx
- scss/pc/agent/agent.scss
- public/locales/{en,kr,ru}/common.json (new keys only)

Validation: Yarn phase/final typechecks, lint (no errors; existing warnings), migration/auth checks, live 42-operation GraphQL/three-upload/enum contract checks, production build (91 localized pages), and git diff --check. scripts/qa-agents-directory.cjs checks real API IDs/order/count, 1440/1024/768/390/320px viewport bounds and columns, grid/list, loaded portraits, nickname/literal punctuation searches, empty/reset, sorting, pagination/reload, malformed input, guest like guard, locale labels and error/retry. Final browser checks passed, including KR/RU labels, simulated network-error/retry and no uncaught runtime exceptions. The dev locale cache was warmed after adding translations. Desktop/mobile screenshots were visually reviewed.

Desktop/mobile previews: docs/screenshots/agents-directory-1440.png and agents-directory-390.png. No backend source/schema/data, dependency or lockfile changes, commit or deployment. An unrelated concurrent car.enum.ts formatting edit was preserved.

