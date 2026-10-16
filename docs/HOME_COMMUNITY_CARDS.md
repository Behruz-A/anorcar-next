# Homepage Community cards — 2026-10-16

Existing homepage CommunityBoards and CommunityCard now display three equal image/content cards on desktop, two on tablet and one on mobile. This replaces the featured-image mosaic in the same component/files; the directory, detail page and common CommunityCard remain unchanged.

The heading is From Our Community, localized in EN/KR/RU and using the existing homepage 34px/500 typography. View All Posts is a plain neutral link without a colored background. Shared wide gutters remain. Each card uses the existing article cover/fallback, category badge, two-line 20px/600 title, three-line text excerpt, locale-formatted date, real views/comments and a detail arrow. Equal grid cards and flex captions align metadata. The existing articleExcerpt helper strips editor HTML; no stored HTML is injected.

All Posts is the default tab and omits articleCategory from the existing GET_BOARD_ARTICLES search. Four existing enum category tabs remain. Query limit is three; existing articleViews DESC ordering, Apollo network-only fetch, page reset, loading/error/empty states and category-aware detail/directory URLs remain. No enum/backend/GraphQL contract, dependency, architecture or live record changes.

Yarn typecheck, migration regressions and PC/mobile Sass compilation passed. The new check-home-community.cjs checks three rendered cards, All Posts and four category inputs, page reset, safe excerpts, image fallback, date/counters and detail routing. Browser visual/interaction QA was not performed.
