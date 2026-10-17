# Featured agent portraits and local demonstration rankings — 2026-10-18

The 15 newly created demonstration agents comprise seven men and eight women. A run of recently updated female profiles appeared on the homepage because every stored `memberRank` was zero, leaving equal-rank profiles ordered by update time. No gender or race filter was introduced.

## Portrait presentation

Restored the existing user-provided professional portraits for Khan, Kevin, Nathan, Leo and Adam from `Desktop/CARIMG`. Angel's existing photo remains unchanged. Files were copied unchanged into `public/img/agents/featured-2026-10-18` and uploaded with each owner's existing login/imageUploader/updateMember flow. Original files and prior image paths remain available; no password resets or profile metadata changes.

Existing agent and homepage SCSS now uses `object-fit: cover` and `object-position: center top`, filling the existing square frames while retaining the top of portrait photographs. Fallback avatars retain contain/center behavior. Card dimensions, grid, sidebar, buttons and interactions are unchanged. Other stock portraits were retained; people were not excluded based on skin color.

## Explicitly requested demo engagement

Used the 15 authorized demonstration accounts created in the preceding task to add 66 unique actor/target likes and authenticated profile visits to the six specified existing agents. These are seeded development interactions, **not organic customer activity**. No third-party accounts were used, no accounts were created in this step, and no counters were edited directly. Before calling the like toggle, viewer-specific state was checked to avoid undoing existing likes. The existing getMember API deduplicates visits per viewer/target.

Invoked the original backend `BatchService.batchTopAgents()` once through an application context, without starting an HTTP server. All 31 agent ranks were initially zero, matching that method's existing selection criteria. The rollback/car-rank jobs were not invoked, and scheduled jobs in the temporary context were stopped. No backend code or formula changed:

`memberCars * 5 + memberArticles * 3 + memberLikes * 2 + memberViews`

| Order | Agent | Rank | Likes | Views |
| --- | --- | --- | --- | --- |
| 1 | Khan | 209 | 14 | 14 |
| 2 | Angel | 199 | 16 | 15 |
| 3 | Nathan | 195 | 13 | 12 |
| 4 | Kevin | 180 | 11 | 11 |
| 5 | Leo | 169 | 11 | 10 |
| 6 | Adam | 156 | 10 | 9 |

The existing homepage rank query now returns these six first, with a mixed first desktop row. No names, IDs, rankings or engagement values were hardcoded in frontend components. Future rank refreshes continue to depend on the existing backend batch deployment/schedule; this task did not deploy or run a persistent batch service.

## Verification

- TypeScript and zero-warning frontend lint passed.
- Both touched SCSS partials compiled with the existing shared variables.
- All five restored uploads returned 200 and matched CARIMG/project bytes by SHA-256.
- All 31 stored ranks match the original formula; specified agents occupy the first six positions.
- Homepage and agent listing returned HTTP 200. Interactive browser QA was not performed.
- [Operation report](featured-agent-ranking-2026-10-18.json) records before/after state, actor/target IDs and portrait paths, without passwords or tokens.

Data/uploads remain in the local backend store. Frontend deployment alone does not migrate this data to a separate production backend. Seeded interaction counts should remain identified as demonstration data when preparing a public production dataset.
