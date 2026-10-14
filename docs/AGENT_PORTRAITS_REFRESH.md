# Agent portraits and demo profile refresh

## Image layout

The photos were being cropped by `object-fit: cover`, combined with the directory's wide 1.48/1.5 photo frame and the homepage's square frame. This was a presentation issue, not an upload-size restriction. Existing Homepage, Agents grid/mobile and Agent Profile portrait frames now use 4:5 with `object-fit: contain` and centered positioning. Horizontal directory list cards retain their existing layout and use the same non-cropping fit. Portrait, square and landscape uploads keep their full visible image and natural proportions. The neutral frame can show padding around photographs with different proportions; filling every pixel would crop or stretch those photographs.

Only scoped existing SCSS changed. Pages Router, Apollo, member/image APIs, image fallbacks, card links, likes, Swiper and roles remain unchanged. Profile avatars elsewhere retain their existing avatar behavior.

## Profile replacement

Created ten new fictional development AGENT profiles through the existing signup, authenticated imageUploader and updateMember operations. Each uses a distinct real Pexels stock portrait, uploaded through the normal member-image API. Descriptions explicitly identify a demo profile and explain that the photograph is illustrative and the model is not an ANORCAR agent. No professional credentials, endorsement, experience, car inventory or rank values were fabricated.

| Display name | Username |
| --- | --- |
| Oliver Reed | oliver.reed |
| Maya Ellis | maya.ellis |
| Victor Hayes | victor.hayes |
| Clara Morgan | clara.morgan |
| Lucas Brooks | lucas.brooks |
| Nora Bennett | nora.bennett |
| Ethan Miles | ethan.miles |
| Amira Wilson | amira.wilson |
| Leon Carter | leon.carter |
| Ella Stone | ella.stone |

The seven still-active, previously generated demo accounts (Sophie Park, Daniel Kim, Hyeryeong Yoon, Minyoung Shin, Eunwoo Lim, Alex Choi, Jisoo Han) were identified by documented IDs and their demo descriptions. Verified zero car/article counters and no matching references in the complete admin car/article query window before removing them via existing `updateMemberByAdmin(memberStatus: DELETE)`. Junho Lee was already absent from the active list. This uses the application's existing soft-delete status; historical records/assets were not physically purged. Khan, Kevin, Angel, Nathan, Leo, Adam, Ray and Martin remain active. Public agents total: 18.

All new-agent and admin sessions were logged out. Passwords/tokens were not written to the source/ID ledger. Existing car, article and engagement records remain intact.

## Sources and validation

Source pages, photographers, Pexels license URL, original download URLs, local paths, uploaded paths, new member IDs and removed IDs are recorded in [agent-profiles-2026-10-14.json](agent-profiles-2026-10-14.json). Original downloaded JPEGs are in `public/img/agents/stock/`. Sources were visually inspected together before publication. Assets are photographic stock portraits, not AI-generated replacements.

- Yarn typecheck and lint passed; existing lint warnings remain.
- Live isolated Chrome checked Homepage and Agents at 1440/1280/768/390px: images load, all photo fits are `contain`, profile links remain and no page overflow occurs.
- Agent Profile portrait checked at 1440/390px.
- Read-only fixture checks cover portrait/landscape/square uploads, missing/broken fallbacks, equal photo frames and grid/list layouts on desktop/mobile.
- Browser checks send no engagement mutations. Data creation/deletion uses the explicitly authorized normal API operations above.
- Screenshots: `screenshots/agents-portraits-home-{1440,390}.png` and `screenshots/agents-portraits-directory-{1440,390}.png`.
- Run `node scripts/qa-agent-portraits.cjs` to repeat browser checks.

No backend code/schema, dependencies, commit or deployment changes.
