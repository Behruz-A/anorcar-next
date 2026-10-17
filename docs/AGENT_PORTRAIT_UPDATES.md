# Agent portraits and demonstration accounts — 2026-10-18

Updated 14 existing agents through their own login, imageUploader and updateMember operations. Created 15 ACTIVE AGENT demonstration accounts through signup and completed their profiles through the same public API. No application code, styles, routes, API contracts or architecture changed.

Angel's existing portrait was retained. Ryan's supplied password did not match, so his account and portrait were left untouched. No passwords were reset.

## Images

29 distinct licensed Pexels stock portraits were downloaded first to `C:/Users/behru/Desktop/CARIMG/ANORCAR-Agent-Portraits-2026-10-18`, then copied to `public/img/agents/portraits-2026-10-18` and uploaded to the existing member image store. Downloaded images are 1024 × 1024 JPEGs, with square crops checked visually for complete heads and visible shoulders/upper bodies. Existing square card frames therefore fill without changing the shared card layout or stretching photos.

Photograph models illustrate demonstration profiles; they are not represented as the named account owners or actual ANORCAR employees. New profile descriptions identify this demo usage. Per-image source pages, photographers, download URLs, hashes and the [Pexels license](https://www.pexels.com/license/) are recorded in [credits.json](../public/img/agents/portraits-2026-10-18/credits.json). Stock photographs do not establish anyone's actual identity, location or qualifications.

## New accounts

| Username | Display name | Demo location |
| --- | --- | --- |
| daniel.park | Daniel Park | Seoul, South Korea |
| james.lee | James Lee | Busan, South Korea |
| eric.choi | Eric Choi | Incheon, South Korea |
| alex.han | Alex Han | Daegu, South Korea |
| adrian.kim | Adrian Kim | Daejeon, South Korea |
| marcus.jung | Marcus Jung | Gwangju, South Korea |
| david.kang | David Kang | Ulsan, South Korea |
| emma.cho | Emma Cho | Suwon, South Korea |
| olivia.kim | Olivia Kim | Jeju, South Korea |
| sophia.lee | Sophia Lee | Seongnam, South Korea |
| chloe.park | Chloe Park | Goyang, South Korea |
| hannah.yoon | Hannah Yoon | Yongin, South Korea |
| sarah.lim | Sarah Lim | Cheongju, South Korea |
| julia.jang | Julia Jang | Jeonju, South Korea |
| emily.shin | Emily Shin | Pohang, South Korea |

New accounts use the user-requested shared password; passwords and tokens are excluded from tracked reports. Phone fields use distinct noncontact placeholder values beginning `000202610`, not real customer phone numbers. Locations are sample profile data. No unverified language skills or verification badges were added. Existing profile information and engagement/listing counters were preserved.

## Verification

- Public active agent count increased from 16 to 31; exactly 15 new accounts.
- All 15 new logins succeeded with the requested password; all new accounts are ACTIVE AGENT.
- All 29 uploaded portrait URLs returned HTTP 200 and matched the staged/project JPEG bytes by SHA-256.
- All portraits are 1024 × 1024; contact sheets reviewed before uploading.
- Angel and Ryan retain their original image paths. Existing account IDs, statuses and listing/engagement counters preserved.
- TypeScript passed. Homepage, agent listing and new profile HTTP checks passed. No interactive browser QA performed.

Operation IDs and before/after profile snapshots are in [agent-portrait-updates-2026-10-18.json](agent-portrait-updates-2026-10-18.json). Records and uploads exist in the local backend database/upload store. Deploying frontend files alone does not migrate these records to a separate production backend.

Follow-up: five original user-provided professional portraits were subsequently restored, shared photo fitting was adjusted, and explicitly requested local demo ranking interactions were added. See [FEATURED_AGENT_RANKING.md](FEATURED_AGENT_RANKING.md) for current results; the earlier snapshot above remains the history of the first operation.
