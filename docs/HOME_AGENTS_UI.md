# Top Agents homepage UI — 2026-10-08

## Follow-up: taller section and 10 agents in two desktop views — 2026-10-08

Latest user request supersedes the original no-arrow UI below. Desktop Top Agents now has min-height 816px with 132px/94px vertical padding, matching Trending/Popular; smaller screens remain content-sized. Added the same existing Swiper Navigation/IconButton pattern as Browse by Budget: group 5 above 1200px, group 1 below, no loop/spacers/custom pagination architecture. Initial desktop displays agents 1–5 with only right arrow; second view displays agents 6–10 with only left arrow; left restores first five. Mobile retains arrows, touch swipe and keyboard support. View all agents remains.

GET_AGENTS still requests page 1, limit 10, memberRank DESC and search {}; existing equal-rank date tie-break is unchanged. API metaCounter confirmed seven agents initially. Created only three more authorized fictional demo AGENT profiles via signup/updateMember and normal imageUploader, bringing actual total/list to exactly ten. Existing seven accounts, cars, counters and ranks were preserved. Two existing agents lack photos and correctly use the normal defaultUser fallback; no invented identities or pictures were assigned to those accounts.

| New profile | Actual ID |
| --- | --- |
| Jisoo Han | 6ac74926e8ca66a84a682f1a |
| Alex Choi | 6ac74925e8ca66a84a682f17 |
| Eunwoo Lim | 6ac74925e8ca66a84a682f14 |

Built-in image_gen produced three individually prompted and visually inspected fictional portraits, saved in public/img/agents/demo/jisoo-han.png, alex-choi.png, eunwoo-lim.png and uploaded to their actual profiles. Exact prompts/paths appended to AGENT_IMAGE_PROMPTS.json; eight generated source assets now exist in that directory. Secrets remain in temporary seed state, outside Git.

Validation passed: Yarn typecheck, lint (0 errors/189 existing warnings), migration/auth tests, live GraphQL (42 operations/three uploads/enums), 88-page production build and diff check. Isolated live browser checked exact ten real cards, exactly five visible in each desktop position, hidden end arrows, return navigation, 816px height, loaded visible portraits/fallbacks, View all agents/detail routes, mobile previous/next and touch swipe, 320px/390px overflow, Korean/Russian labels, empty/error states and absence of runtime exceptions. Lazy images were checked when each view became visible. Updated screenshots: home-agents-desktop.png, home-agents-page2.png, home-agents-mobile.png. Dev server reloaded new navigation translations and remains on localhost:3000 with separate .next-dev output.

Backend business code, architecture, environment variables, auth contracts, GraphQL documents, dependencies and unrelated UI remain unchanged. No commit or deploy performed. The original section implementation report below is historical context.


## Scope and architecture

Rechecked current filesystem and Git before development: HEAD bbed3a4, clean frontend working tree. Read AGENTS.md and actual sibling backend docs (docs/ai is absent). User requested the supplied dark Top Agents design immediately after Trending Cars, exact English CTA "View all agents", and actual demo agent profiles.

Updated existing TopAgents.tsx and TopAgentCard.tsx only within the existing homepage folder; moved the existing TopAgents mount after TrendCars in both desktop/mobile homepage branches, without adding a duplicate. Scoped styles remain in existing pc/homepage/homepage.scss and translations in existing en/kr/ru common files.

Retained existing Pages Router/layout HOC, useDeviceDetect, MUI/Swiper, Apollo GET_AGENTS, useState/onCompleted, cache-and-network, notifyOnNetworkStatusChange, existing Member/AgentsInquiry types, backend memberRank DESC, page 1, limit 10 and empty search. No operation, cache, auth, dependency, lockfile, schema or backend source changes. Equal memberRank values have a local updatedAt DESC tie-break within the fetched page; actual rank order and rank values remain unchanged. This is the only additional ordering rule and avoids artificially raising demo ranks. Agents remain AGENT.

## UI and backend contracts

Dark #15171b section, orange eyebrow rule, translated Trusted Experts/Top Agents, five rectangular portrait cards across on desktop, dark #202328 caption, real memberFullName with memberNick fallback, real memberType. Header uses approved Poppins/34px/500 typography; mobile 25px. Existing Swiper provides keyboard/touch access to additional profiles with responsive 270px/250px cards; previous decorative arrows were replaced by the requested CTA layout.

CTA links to existing /agent; cards link to existing /agent/detail?agentId=<actual ID>. Image handling uses existing imageUrl, actual uploaded memberImage paths and defaultUser fallback on missing/error images. Added explicit loading, empty and error states.

Screenshot text "certified" was adapted to "Our agents are always ready to serve you." because backend has no certification field. No fake certification flag, Seller/Dealer role, rank, count or hardcoded member inventory was introduced. Existing agents remain returned by GET_AGENTS and accessible through Swiper/View all agents.

## Authorized demo data and assets

Five fictional demo AGENT accounts created through existing signup API. Profiles updated through their own authenticated updateMember calls; descriptions identify fictional development profiles and AI-generated portraits. Images uploaded through existing authenticated imageUploader(target: member) multipart API, so existing agent/detail/profile consumers can load them as normal backend uploads. Existing agents, car records and engagement counters were not modified. Credentials/tokens retained only in temporary seed state outside the repository; none in docs/source.

| Profile | Actual Member ID |
| --- | --- |
| Minyoung Shin | 6ac74200e8ca66a84a682e4a |
| Hyeryeong Yoon | 6ac74200e8ca66a84a682e47 |
| Daniel Kim | 6ac74200e8ca66a84a682e44 |
| Sophie Park | 6ac74200e8ca66a84a682e41 |
| Junho Lee | 6ac741ffe8ca66a84a682e3e |

All are AGENT with current memberRank 0. Real GET_AGENTS returned them; date tie-break currently places these five first. Future backend batch recalculation/higher ranks can change this order as expected.

Image mode: built-in image_gen, five individual generation calls, visually inspected originals. Final repo assets:
- public/img/agents/demo/minyoung-shin.png
- public/img/agents/demo/hyeryeong-yoon.png
- public/img/agents/demo/daniel-kim.png
- public/img/agents/demo/sophie-park.png
- public/img/agents/demo/junho-lee.png

Exact complete prompts and saved paths: [AGENT_IMAGE_PROMPTS.json](AGENT_IMAGE_PROMPTS.json). Generated originals retained under Codex generated_images. Application renders backend-uploaded copies; the repo retains source assets for reproducibility. Backend upload files/data need preservation when moving environments.

## Checks

- Yarn typecheck passed.
- Yarn lint passed: zero errors, 189 existing warnings (previous TopAgentCard img warning removed).
- Existing migration/auth tests passed; live GraphQL validated 42 operations, three inline uploads and registered enums.
- Normal production build passed with 88 localized pages; dev continues using separate .next-dev output.
- Live isolated Chrome verified five visible real portrait cards/names, black background, one TopAgents mount directly after Trending, actual View all agents and detail clicks, real profile name on detail page, loaded uploaded images, mobile touch swipe, 390px/320px absence of overflow, Korean/Russian labels and no runtime exceptions.
- Browser-only GraphQL response fixtures additionally checked empty/error rendering; no fixture persisted to backend.
- Dev server was restarted to reload Next i18n server resources after dictionary additions; normal localhost:3000 remains running.
- Diff whitespace check passed. Screenshots: docs/screenshots/home-agents-desktop.png, home-agents-mobile.png.

No commit, deployment, broad refactoring or unrelated screen changes. Backend COMPLETED_TASKS.md updated for workflow only.
