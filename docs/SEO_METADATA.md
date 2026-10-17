# SEO metadata and sharing previews

The existing Pages Router uses one `next/head` component, `libs/components/common/Seo.tsx`, mounted in `_app.tsx`. `libs/seo.ts` defines production canonical URLs, localized page copy, Open Graph/Twitter tags and indexing rules. Former layout/page title blocks and `_document` description/robots tags were removed to avoid conflicting tags. `_document` retains icons and sets the correct HTML language (`en`, `ko`, `ru`); page-specific tags remain outside `_document`. The existing next-i18next configuration is explicitly supplied to the existing app wrapper so error/admin pages also have an i18n provider.

## Coverage

- Homepage: `ANORCAR | Find Your Next Car`; the meta description and social description follow the two requested English copies, with Korean/Russian translations in the existing common namespaces.
- Cars, Compare, Agents, Community, Help Center and About: localized titles/descriptions, canonical and alternate-language links using actual existing routes.
- Car, agent and article detail: request-time public metadata using the existing GraphQL operations through `libs/seo.server.ts` and `getServerSideProps`. UI Apollo queries, authentication and engagement handlers remain unchanged. Only public title/description/image metadata is serialized; no member records, phone numbers, auth tokens or personalized Apollo cache are passed to the browser. Anonymous backend reads do not record authenticated views.
- Private account/member/admin pages: generic metadata and `noindex,follow`; sensitive query values are excluded from canonical/social URLs. Filtered/search/comparison URLs canonicalize to their base page. Existing static listing pages share their initial HTML across query strings, so query-specific noindex applies after router hydration; initial HTML consolidates queries through the base canonical. Invalid/deleted/sold/non-public detail records return 404. Temporary API failures return 503 with noindex and Retry-After, rather than permanent 404s.
- Metadata is keyed to the current detail ID so shallow navigation cannot retain a previous listing's title.

Canonical origin is fixed at `https://anorcar.io`. Default English routes have no locale prefix; Korean uses the existing `/kr` prefix and Russian `/ru`. Hreflang is `en`, `ko`, `ru`, plus x-default; OG locales are `en_US`, `ko_KR`, `ru_RU`. Only the meaningful detail ID is kept in canonical detail queries. Trailing slash handling follows the current Next.js configuration: `/` at the English root, `/kr` and `/ru` at localized roots, and no trailing slash on other pages.

## Image asset

`public/og-image.jpg` is a real 1200 x 630 JPEG, approximately 178 kB, served as `https://anorcar.io/og-image.jpg`. It was generated with the built-in imagegen tool using the existing `public/img/hero4.png` and `public/img/anorcar_logo_original.png` as references, inspected, then normalized to the requested dimensions/format using the already-installed Sharp package. Existing UI assets were preserved.

Final generation prompt:

> Create one premium ANORCAR automotive marketplace Open Graph social sharing graphic, landscape aspect ratio exactly 1200:630. This is a new standalone branded social preview, not a website screenshot. Use the supplied coastal blue-SUV sunset image as the automotive imagery reference: blue modern SUV on a coastal road at golden hour, vehicle clearly visible in the right half. Use the supplied red square white-car ANORCAR emblem faithfully as the logo emblem, at upper left next to the exact word ANORCAR in bold white clean sans-serif. Deep Navy #0B1F33 dominates the left half and blends subtly into the photographic right half, with restrained orange-red #F04428 accent. Main headline exactly 'Find Your Next Car' in large exceptionally clear white sans-serif on the left, split over two lines if needed. Small footer 'anorcar.io'. Minimal polished high-end automotive composition, comfortable 64px safe margins, excellent readability at thumbnail size. No extra text, buttons, navigation, watermarks, real estate elements, invented statistics or claims. Deliver the finished graphic at 1200 by 630 pixels if possible.

Listing/profile/article primary images are used when they are HTTPS JPEG/PNG images verified by anonymous HEAD on the configured public API origin or the ANORCAR origin. Redirects, inaccessible images, untrusted third-party origins, HTTP/local/private IP addresses and missing images fall back to the global asset. This avoids server-side requests to arbitrary stored URLs. Global image metadata includes exact width/height/MIME; primary images omit unknown dimensions. Ensure `REACT_APP_API_URL` is the public HTTPS upload origin in production. Local HTTP uploads deliberately use the global image in social metadata.

## Verification and release

Run `yarn check:release` (includes `yarn test:seo`) and `yarn build`. After starting the tested production artifact on port 3010, run:

```powershell
yarn node scripts/check-seo-html.cjs
yarn node scripts/check-frontend-routes.cjs
```

The HTML check reads raw responses without executing JavaScript. It verifies unique tags, real car/agent/article data in EN/KR/RU, HTML/OG locales, canonical/alternate URLs, private noindex, missing-record statuses and the actual JPEG dimensions/MIME. It requires real public fixtures in the matching backend. Unit fixtures additionally cover anonymous requests, data minimization, API outages, unavailable records, stale page data and safe image fallback.

No deployment, backend changes or infrastructure changes are included. The live production origin and OG asset could not be accessed by the web verification tool during development. After deployment, confirm the public HTTPS HTML/image return 200 without login, rebuild with production API environment values, and refresh cached link previews through each platform's supported rescrape/debug tools. Previously shared previews may remain cached; local tests cannot certify Telegram/WhatsApp/Facebook/LinkedIn/X rendering or production CDN behavior.

Implementation references: [Next Head deduplication](https://nextjs.org/docs/pages/api-reference/components/head), [Pages Router server rendering](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props), [Open Graph protocol](https://ogp.me/).

Verified locally on 2026-10-17: `yarn check:release` passed strict TypeScript, zero-warning ESLint and all release regressions, including SEO fixtures. `yarn build` completed with the existing Sass import and translation page-data warnings. Against that production artifact, the raw HTML check passed 23 public/private/filtered URLs, two missing-listing 404 responses and the real 1200 x 630 JPEG. This includes real backend car, agent and article metadata in all three locales, unique tags and private query exclusion. Browser visual QA and live deployed/social-platform verification remain unavailable; no deployment was performed.
