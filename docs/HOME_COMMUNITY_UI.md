# Homepage Community Board Highlights

## Current follow-up: taller section and live articles (2026-10-08)

User authorized demo article creation. Desktop min-height is now 1000px, padding 132px/94px; grid rows 280px, featured card 578px. At <=1200px the section remains content-sized; all four mobile cards remain 260px. Existing component/query/order/routes/typography retained.

Created exactly 16 explicitly fictional demo posts, four per NEWS/FREE/RECOMMEND/HUMOR, through createBoardArticle using an existing demo USER (6ac7383fe8ca66a84a682d57). Uploaded eight reused illustrative Budget assets through normal imageUploader(target: article), so existing Community detail/image consumers receive standard uploads/article paths. No new accounts, artificial views/likes/comments, backend code or schema edits. Titles and HTML content respect backend 50/250 character limits.

| Category | Title | ID |
| --- | --- | --- |
| NEWS | Demo: A new home for car conversations | 6ac769c0e8ca66a84a68330c |
| NEWS | Demo: Electric car discussion week | 6ac769c0e8ca66a84a68330f |
| NEWS | Demo: Community road trip photo board | 6ac769c1e8ca66a84a683312 |
| NEWS | Demo: Meet our car community | 6ac769c1e8ca66a84a683315 |
| FREE | Demo: What was your first car? | 6ac769c1e8ca66a84a683318 |
| FREE | Demo: City hatchback or weekend SUV? | 6ac769c1e8ca66a84a68331b |
| FREE | Demo: Your favorite car color | 6ac769c1e8ca66a84a68331e |
| FREE | Demo: Share a memorable road trip | 6ac769c1e8ca66a84a683321 |
| RECOMMEND | Demo: Build a weekend driving playlist | 6ac769c2e8ca66a84a683324 |
| RECOMMEND | Demo: Favorite car photography spots | 6ac769c2e8ca66a84a683327 |
| RECOMMEND | Demo: Ideas for a community meetup | 6ac769c2e8ca66a84a68332a |
| RECOMMEND | Demo: What belongs in a road trip bag? | 6ac769c2e8ca66a84a68332d |
| HUMOR | Demo: The car wash rain coincidence | 6ac769c2e8ca66a84a683330 |
| HUMOR | Demo: One more song before parking | 6ac769c2e8ca66a84a683333 |
| HUMOR | Demo: The passenger seat navigator | 6ac769c2e8ca66a84a683336 |
| HUMOR | Demo: Naming the family car | 6ac769c2e8ca66a84a683339 |

Typecheck, 42-operation live GraphQL plus uploads/enums, 88-page production build and real browser checks passed: all category query/DOM IDs match, 16 real articles, images HTTP 200, >=1000px desktop, 578px featured and four 260px cards on 390/320 mobile without overflow/errors. Live screenshots: docs/screenshots/home-community-live-desktop.png and home-community-live-mobile.png. Earlier empty/fixture results below describe the original implementation before this authorized seed. No commit/deploy; dev server remains running.


Implemented 2026-10-08 in the existing desktop Community section position. The same component is now mounted in the mobile homepage branch, replacing its previous unsupported mobile placeholder.

## Architecture and data

- Updated existing `libs/components/homepage/CommunityBoards.tsx` and `CommunityCard.tsx`, with scoped styles in existing homepage SCSS. No new architecture/dependencies or unrelated screen changes.
- Existing `GET_BOARD_ARTICLES`, `useQuery`, `network-only`, `notifyOnNetworkStatusChange`, and `onCompleted`/local state pattern preserved.
- Existing `articleViews DESC` ordering preserved. One active-category query replaces separate NEWS/FREE previews to support the requested tabs; page 1/limit 4. Changing category clears preview and resets page 1. The existing query document and backend remain unchanged.
- View All Posts opens existing Community route with selected `articleCategory`. Cards preserve detail route/category/ID. This listing is category-scoped, following the existing Community page pattern.
- Backend categories are NEWS, FREE, RECOMMEND, HUMOR. Display labels are News, Free Board, Recommendations, Humor. Reference-only Car Tips/Reviews categories were not invented or misleadingly mapped.
- All titles, images, dates, views and comments come from actual BoardArticle fields. Existing image URL helper supports local/API/HTTP paths; missing/broken images fall back to existing event illustration.
- No backend code, DB writes, account changes, post seeding, comments/auth behavior or schema changes. Existing community listing/detail mobile limitations remain outside this homepage task.

## UI

- White background, orange eyebrow line, standard Poppins heading (34px/500/150%/-0.646px), 25px mobile; 16px subtitle/14px mobile.
- Desktop: one large left card spanning two rows, two smaller right cards, one wide lower-right card. Tablet/mobile collapse responsively.
- Translated EN/KR/RU tabs, heading, CTA, loading/error/empty states. Actual category badges, dark gradient captions, 13px metadata, localized dates/counts and clipped photo hover zoom.
- Keyboard-accessible MUI tabs, tabpanel labeling, link focus styles, existing route navigation.

## Checks and current content

- Yarn typecheck, lint, migration/auth tests, live GraphQL (42 operations/three inline uploads/enums), production build (88 localized pages), and diff whitespace checks passed. Lint reports 182 existing warnings/zero errors.
- Real public API returns no posts in all four categories. Live homepage correctly displays the empty state; no fabricated visible inventory was inserted.
- Browser-only intercepted preview data verified four-card layout, computed heading typography, exact category query/page/limit/sort/direction values, selected-category CTA and detail hrefs, actual CTA navigation, mobile user-agent at 390/320 without overflow, translations and empty/error/loading states with no runtime exceptions or DB writes.
- Explicit preview screenshots: `docs/screenshots/home-community-fixture-desktop.png`, `home-community-fixture-mobile.png`. These contain test fixtures and are not live backend posts.

No commit or deployment performed. Normal development server remains available at localhost:3000, with separate production build output.
