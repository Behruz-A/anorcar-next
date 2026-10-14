# Community article detail refinement

The legacy detail page had a house banner, a 1012px fixed article width, large empty regions, duplicated edit backdrops and an unimplemented mobile view. The existing Community hero image (`/img/hero7.png`) now appears on this route. The article uses a responsive reading column with its real uploaded cover, author, date, category, views, likes and comments. Category navigation moves above the article on narrower screens. Existing ANORCAR typography, colors, Pages Router, layout HOC, SCSS imports, Toast UI viewer and Apollo operations remain.

`ArticleMember` shares author/comment metadata presentation and resolves images through the existing `imageUrl` helper. Missing or broken avatars fall back to initials. Missing/broken article covers are omitted rather than shown as a broken image. The viewer is keyed by article ID to avoid stale content when navigating between articles.

Queries wait for client/router readiness and a valid ID. Loading, unavailable, failed request and retry states are explicit. Comments retain the existing 100-character backend limit and five-item pagination. Signed-in members can post; only a comment's owner sees edit/delete controls. A single accessible MUI dialog replaces repeated absolute backdrops. Empty/unchanged submissions and duplicate requests are prevented. Delete confirmation, mutation/refetch, article counters and member routes remain. Deleting the last item on a later page returns to the preceding page. English/Korean/Russian labels are included.

## Verification

- Yarn typecheck and lint passed. Existing repository lint warnings remain.
- Isolated Chrome verified the real published News article, uploaded cover and guest UI at 1440/1280/768/390px. Checked shared hero asset, balanced content spacing and no horizontal page overflow.
- Intercepted fixture mutations verified like state, duplicate guards, whitespace validation, create/edit/delete, owner controls, pagination, invalid IDs and both article/comment retry states. No real database mutations or logins were performed.
- Desktop/mobile captures: `screenshots/community-detail-1440.png` and `screenshots/community-detail-390.png`.
- Run: `node scripts/qa-community-detail.cjs`. When the backend is unavailable, the script explicitly reports using the saved published article as a fixture.
- A transient MongoDB DNS error occurred during the first live check; live read checks succeeded after the connection recovered.
- Production build was not run because the user declined the build command's execution approval.

No backend code, schema, dependencies, database contents, commit or deployment changes were required for this UI work.
