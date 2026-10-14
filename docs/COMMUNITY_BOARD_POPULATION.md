# Community board population - 2026-10-14

Created 24 original English-language automotive posts through the existing authenticated createBoardArticle GraphQL mutation: six in each category. Authors are Khan, Kevin, Angel, Nathan, Leo and Adam, four posts each. All are active AGENT accounts. The supplied ADMIN fallback was not needed. No credentials, access tokens or refresh cookies are saved. Import sessions were logged out.

## Editorial content

- News: two explicitly dated 2022 automotive milestones with official sources, plus four verified ANORCAR feature/catalog updates. Historical events are not described as breaking 2026 news.
- Free Board: open discussion prompts about vehicle choice, features, practical needs and useful seller conversations.
- Recommendations: concise shopping and comparison suggestions, with no unsupported certification, price guarantee, mileage assumption or invented vehicle history.
- Humor: clearly fictional, light car-shopping and ownership-themed jokes, with no fabricated personal testimonials.
- Existing backend limits remain: title 3-50 characters, content 3-250 characters. These are short board posts rather than long-form articles; longest title 47, longest body 244. No DTO or schema was changed.
- Covers reuse genuine, licensed photographs already uploaded to the backend. CC BY-SA photographer/source/license attribution is included in each applicable body; the JSON ledger records full photo attribution for every post, including CC0 covers. Image paths and source photos remain unchanged.

News fact sources: [2022 World Car Awards results](https://www.worldcarawards.com/web/2022_results.asp), [2022 Car of the Year result](https://caroftheyear.org/award/edition-2022/).

## Root cause and minimal backend fix

After creation, each category contained six accessible new posts plus four existing posts whose authors no longer existed. The old public query counted all ten, paginated the four most-viewed orphaned records first, then removed them during member lookup/unwind. Homepage consequently still received an empty list.

BoardArticleService.getBoardArticles now resolves the existing member lookup/unwind before sorting and the pagination/count facet. Both count and list operate on the same author-resolved set. Engagement lookup remains inside the selected-page pipeline. Existing articleStatus/category/member/text filters, sorts, role guards, services/resolvers/modules and frontend UI are preserved. No old posts were deleted, reassigned or given artificial views/likes/comments. Admin listing behavior is unchanged.

## Verification

- 24 distinct published IDs, exact category and author association, body and image verified. All covers return successful image responses.
- Each category: page one four posts, page two two posts, six unique IDs and total six; all created IDs are present.
- Focused backend pagination Jest test passed. Backend API/batch TypeScript checks and production build passed; frontend Yarn typecheck passed.
- Guest browser checks passed all four homepage tabs at 1440px and 390px, with four real posts, loaded covers, correct IDs/category links, View All category and no page horizontal overflow. Screenshots are in docs/screenshots/community-populated-{news,free,recommend,humor}-{1440,390}.png.
- Desktop article detail route/title/markdown body and source link verified. The pre-existing mobile article-detail route still renders its Nestar placeholder; this content/query task does not redesign that page. Homepage and community data are available on mobile.
- Frontend application code, schema, permissions and existing functionality were not rewritten. No new dependency, commit or deployment.

## Published posts

| Category | Author | Title | Article ID |
| --- | --- | --- | --- |
| News | Khan | IONIQ 5: a 2022 World Car Awards triple win | `6acee834c98aa26ea0c34d03` |
| Free Board | Khan | Which detail makes a car feel right? | `6acee834c98aa26ea0c34d07` |
| Recommendations | Khan | Build a shortlist around everyday needs | `6acee834c98aa26ea0c34d0b` |
| Humor | Khan | When the shortlist refuses to stay short | `6acee834c98aa26ea0c34d0f` |
| News | Kevin | EV6: Europe's Car of the Year in 2022 | `6acee835c98aa26ea0c34d18` |
| Free Board | Kevin | City hatchback or family SUV? | `6acee835c98aa26ea0c34d1c` |
| Recommendations | Kevin | Compare the same fields, not just the price | `6acee835c98aa26ea0c34d20` |
| Humor | Kevin | The weekend plan called car browsing | `6acee835c98aa26ea0c34d24` |
| News | Angel | ANORCAR comparison puts three cars side by side | `6acee836c98aa26ea0c34d2d` |
| Free Board | Angel | Your ideal three-car comparison | `6acee836c98aa26ea0c34d31` |
| Recommendations | Angel | Ask for photos that answer your questions | `6acee836c98aa26ea0c34d35` |
| Humor | Angel | The family meeting about paint colors | `6acee836c98aa26ea0c34d39` |
| News | Nathan | A clearer view of new and used listings | `6acee837c98aa26ea0c34d42` |
| Free Board | Nathan | What belongs in a great listing description? | `6acee837c98aa26ea0c34d46` |
| Recommendations | Nathan | Treat unknown mileage as unknown | `6acee837c98aa26ea0c34d4a` |
| Humor | Nathan | The clean car and the surprise rain cloud | `6acee838c98aa26ea0c34d4e` |
| News | Leo | Seven brands, one ANORCAR marketplace | `6acee838c98aa26ea0c34d57` |
| Free Board | Leo | The feature you would never give up | `6acee838c98aa26ea0c34d5b` |
| Recommendations | Leo | Plan your EV charging routine before shopping | `6acee839c98aa26ea0c34d5f` |
| Humor | Leo | Every cup holder has a job description | `6acee839c98aa26ea0c34d63` |
| News | Adam | Fresh listings now appear on the homepage | `6acee839c98aa26ea0c34d6c` |
| Free Board | Adam | What makes a helpful seller conversation? | `6acee83ac98aa26ea0c34d70` |
| Recommendations | Adam | Bring your real luggage to a car viewing | `6acee83ac98aa26ea0c34d74` |
| Humor | Adam | The imaginary garage needs more space | `6acee83ac98aa26ea0c34d78` |
