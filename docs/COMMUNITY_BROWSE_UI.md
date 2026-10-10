# Community browse UI

The existing `/community` page follows the supplied discussion-card reference using the existing Pages Router, Apollo GraphQL, MUI and SCSS architecture. Backend instructions and handoff docs were read from sibling `anorcar/AGENTS.md` and `anorcar/docs`; `docs/ai` is absent.

- Explore Discussions header and existing Write a Post destination (`/mypage?category=writeArticle`) with a guest login guard.
- All Posts plus supported Free Board, Recommendations, News and Humor filters. Tips & Guides is not a backend category and was omitted. No fake categories, verification, authors, stats or posts added.
- Server-side title search with regex characters escaped for literal matching. Latest/Oldest/Most liked/Most viewed map to supported backend sorts. Six posts per page. Category/search/sort reset pagination; readable URL state restores on reload and browser navigation. Existing articleCategory links still work.
- Three/two/one responsive grid plus working list view. Both remain usable at 320px. Query loading, empty/reset and error/Retry states.
- Existing CommunityCard receives an opt-in browse variant, preserving legacy My Articles/Member Articles presentation and callbacks. Browse cards show real image/category/title, text-only excerpt, author/avatar/date and view/like/comment counters. Article and member links remain real routes. Likes work across all categories with a pending guard.
- Stored editor HTML is converted to excerpt text and rendered as React text, never injected as HTML. Missing/broken post images use a neutral discussion placeholder; author images use nickname initials.
- Existing hero7 and contrast treatment retained; mobile now gets the hero and shared marketplace navbar. Other routes keep their existing layout. Community navigation opens All Posts; explicit category URLs remain supported.
- EN/KR/RU labels; no new dependencies or backend schema/service/data changes.

Validation: Yarn typecheck and the 91-page production build passed; lint passed with existing repository warnings. Migration/auth checks passed. All 42 GraphQL operations, three inline upload documents and enums validated against localhost:3007.

Read-only browser checks use the 16 existing development posts, without seeds or mutation writes: 1440/1024/768/390/320px bounds, 3/2/1 grid, grid/list, real post IDs and routes, category/All, title search, literal regex characters, empty/reset, sorting/reload, pagination, guest like/write guards, KR/RU and backend outage/Retry. No uncaught runtime exceptions. Authenticated like/post writes were not exercised against the development database.

Run `yarn node scripts/qa-community-browse.cjs`. Refreshed desktop/mobile screenshots are in `screenshots/community-browse-1440.png` and `screenshots/community-browse-390.png`; images are loaded before capture. Existing development post content is displayed unchanged.

Modified code: pages/community/index.tsx, libs/components/common/CommunityCard.tsx, libs/community.ts, libs/types/board-article/board-article.input.ts (category optional, matching the existing backend), scss/pc/community/community.scss, shared Top/LayoutBasic only for the Community route, and EN/KR/RU dictionaries. The QA script, this report/screenshots and backend COMPLETED_TASKS handoff document the result. No commit or deployment.
