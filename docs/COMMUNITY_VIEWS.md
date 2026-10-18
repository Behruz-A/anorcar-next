# Requested local Community views — 2026-10-18

At the user's explicit request, signed into the seven supplied active AGENT accounts (Khan, Adam, Angel, Ray, Kevin, Leo and Ryan) and opened article details through the existing authenticated `getBoardArticle` API. Added 110 unique account/article views across the 40 newly created posts and the retained red Hyundai show-car post. These are seeded local demonstration views, not organic readership. No accounts were created, no likes/comments were added, no counters were edited directly and no homepage sorting code changed. Sessions were logged out; credentials and tokens are excluded from the report.

The existing backend deduplicates each viewer/article pair. Authors' own articles were excluded for each acting account. Every new post now has at least two views; selected category highlights have four, the two selected homepage highlights have five, and the original red show-car post has six.

The actual anonymous homepage query (`articleViews DESC`, limit 3) now returns:

| Post | Views |
| --- | ---: |
| The imaginary garage needs more space — original red show-car photograph | 6 |
| Geneva 2018: Volkswagen on the concept stage — new News post | 5 |
| Your perfect automotive weekend — new Free Board post | 5 |

News, Free Board and Recommendations each return three new posts for their category tabs. Humor returns the retained red show-car post and two new posts. Verified unchanged titles, image paths, categories, authors, likes and comments for all existing records. Frontend Yarn strict typecheck passed. Verification used the exact live API inputs used by the homepage; no interactive browser verification or deployment was performed. Future readership may naturally change this ordering.

Credential-free before/after article snapshots, actor IDs, individual view attempts and returned homepage/tab lists: [community-views-2026-10-18.json](community-views-2026-10-18.json).
