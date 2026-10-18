# Community additions — 2026-10-18

Published 40 new short English-language board posts through the existing authenticated GraphQL API: 10 NEWS, 10 FREE, 10 RECOMMEND and 10 HUMOR. Each category increased from 6 to 16 accessible posts (64 total). Existing posts remain intact. Authors are the user-authorized active agents Khan, Adam, Angel, Ray, Kevin and Leo. No accounts were created or passwords changed; import sessions were logged out and credentials are excluded from reports.

Forty distinct real photographs replace the repeated catalog-photo approach for these additions. Covers show automotive exhibitions, press presentations, people at car gatherings, workshop activity and two humorous roadside/travel scenes. Selected photographs were visually reviewed on contact sheets. News entries explicitly identify historical show/photo archives and dates rather than presenting old events as current announcements. Free Board contains discussion questions, Recommendations practical viewing prompts, and Humor clearly labelled fictional jokes.

All selected source JPEGs were archived in `C:/Users/behru/Desktop/CARIMG/ANORCAR-Community-2026-10-18` before deriving the website assets from those archived files. Optimized, uncropped JPEGs are in `public/img/community/posts-2026-10-18` and were uploaded through the existing authenticated `imageUploader(target: "article")` operation. Published posts reference the resulting `uploads/article/...` paths. No external image hotlinks are used as covers.

Photographer/source/license links are included in post bodies. Full source titles, URLs, license records, archive paths, resize notes and SHA-256 hashes are in the asset [credits manifest](../public/img/community/posts-2026-10-18/credits.json). Existing backend title/content limits of 50/250 characters are preserved.

Validation:

- Exactly 40 unique created IDs, 10 per category, with 40 distinct source photographs and uploaded image paths.
- Exact public API readback verified category, author, ACTIVE status, title, body and uploaded path for every new post; counts increased by exactly 10 in each category.
- All 40 uploaded JPEGs returned HTTP 200 and matched the optimized asset SHA-256 hashes.
- All 40 CARIMG archive files match the selected downloaded source bytes. All 40 frontend image URLs returned HTTP 200 with matching hashes; four filtered Community routes returned HTTP 200.
- Frontend Yarn strict typecheck passed. Photographs were visually reviewed; no interactive browser QA was available in this session.

No application components, styles, GraphQL contracts, backend implementation, architecture or dependencies changed. Operation IDs, complete inputs, before/after category snapshots and verification results are recorded in [community-additions-2026-10-18.json](community-additions-2026-10-18.json). Records/uploads are in the local backend; a separate production store would require its own data/upload migration. No deployment was performed.
