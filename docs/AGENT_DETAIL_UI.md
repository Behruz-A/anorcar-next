# Agent detail UI

Implemented the reference at `/agent/detail?agentId=<member ID>` using the existing Next Pages Router, Apollo and MUI architecture. Backend instructions and migration/handoff documents were read from sibling `anorcar/AGENTS.md` and `anorcar/docs`; the documented `docs/ai` folder is absent.

- Large portrait with missing/broken image fallback, breadcrumbs, real agent name/nickname/address/description, and responsive actions.
- Real active cars, followers and profile views replace unsupported happy-client/experience claims. Profile hearts use the existing member-like mutation and `meLiked` response, so the action is labelled Like rather than pretending there is a separate saved-agent feature.
- Listings / About / Contact tabs. Public inventory uses `getCars` with the exact member ID, four cars per page and `View All` preserving the owner filter. Existing browse CarCard is reused; its unchanged card styles were extracted to a shared Sass mixin.
- Contact opens the contact tab, scrolls below the sticky navbar and focuses its heading. Phone uses a real `tel:` link. Native sharing, clipboard and a selectable-link fallback preserve the current locale.
- Existing member comments remain in About: pagination, real author/date/content and a 100-character review form with guest/self/empty/pending guards. No fabricated ratings. Mutation errors use existing SweetAlert handling.
- Loading, empty and unavailable states; errors with Retry; valid active AGENT checks and profile-ID matching prevent showing a previous agent after navigation. Profile refetch retains tab/form state.
- Shared marketplace navigation remains active on detail; the generic oversized Agent Page banner is omitted. EN/KR/RU strings are provided.

Validation: phase Yarn typechecks passed; lint passed with existing repository warnings; migration/auth checks passed; all 42 GraphQL operations, three inline uploads and enums validated against localhost:3007; production build generated 91 pages.

Read-only live-data browser checks: 1440, 1024, 768, 390 and 320px; 4/2/1 listing columns, bounds/Poppins, exact owner filter, pagination, guest guards, contact focus and phone, share fallback, portrait and empty inventory, KR/RU, invalid ID, backend outage/Retry and no runtime exceptions. Browser scripts use isolated temporary Chrome profiles. Authenticated like/comment writes were not exercised against the development database.

`yarn node scripts/qa-agent-detail.cjs` reproduces the focused checks. `scripts/qa-cars-browse.cjs` checks the shared Cars styling and behavior.

Screenshots contain actual existing development records, with no data seeded or changed for this task:
- `screenshots/agent-detail-1440.png`: the existing seller with 14 active cars and no portrait.
- `screenshots/agent-detail-390.png`: the same seller on mobile.
- `screenshots/agent-detail-portrait.png`: an existing demonstration portrait agent with zero listings. The demo identity/description are stored data, not new claims added by this change.

No backend schema/service/database changes, new dependencies, Git commit or deployment. The backend COMPLETED_TASKS handoff is updated after validation.
