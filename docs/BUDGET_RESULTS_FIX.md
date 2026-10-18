# Budget shortcut empty-results correction — 2026-10-18

The homepage budget URLs and Cars route parser were correct: all shortcuts use KRW ceilings, page 1, nine results and ascending price. Both the original local and production API returned positive `metaCounter` values but empty cheap-first pages. The lowest-price records included orphaned references: public `getCars` applied pagination before member/brand lookup and unwind, so records removed by those joins had already consumed the selected page. Counts still included those records.

Corrected only the local backend public `CarService.getCars` pipeline: resolve/unwind the existing member and brand joins before sorting and the count/pagination facet. Viewer-specific likes remain inside the selected page. Filtering, joins' existing visibility rules, statuses, ownership, GraphQL contracts, other service methods and the Nestar architecture remain unchanged. Existing unrelated backend edits were preserved. No cars, accounts, prices, counters or database references were modified.

No new cars were needed: every shortcut has existing displayable cars after the fix.

| Budget | Verified visible cars |
| --- | ---: |
| Under ₩10M | 2 |
| Under ₩20M | 21 |
| Under ₩30M | 63 |
| Under ₩40M | 107 |
| Under ₩50M | 133 |
| Under ₩75M | 153 |
| Under ₩100M | 160 |
| Any Budget | 163 |

The 14 excluded orphaned records remain untouched in storage. Public counts now describe the same joined set as the public list. The unfiltered original count was 177.

Added a read-only integration regression, `yarn node scripts/check-budget-results.cjs`, which consumes the actual budget helper and Cars URL parser. It walks every page of all eight shortcuts and verifies count/list agreement, filled intermediate pages, unique IDs across pages, ascending prices, budget bounds, ACTIVE cars and resolved member/brand IDs. It also checks the empty page after the end. It failed before the correction (`under10`: count claimed 16 but the first page returned zero) and passed after the correction with the counts above. The test allows a genuinely empty budget; it catches false positive counts rather than creating artificial stock.

Validation: frontend Yarn strict typecheck, existing budget-card URL test, the new full live read-only pagination regression, both backend TypeScript checks, 18 existing car category/admin-status tests and the local Nest production build passed. No interactive browser visual QA was performed.

Production was queried read-only to reproduce the original defect. No production service, image, configuration or record was changed/restarted/deployed. Production needs a separately approved backend deployment of this correction before its API behavior changes. Local changes alone do not repair the running VPS container. AI diagnostics remain a separate existing local change; deployment review must account for the complete backend diff.
