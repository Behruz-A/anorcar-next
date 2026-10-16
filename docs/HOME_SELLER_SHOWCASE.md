# ANORCAR homepage promotion, statistics and benefits

## Current reference layout — 2026-10-16

This supersedes the historical layouts below. The existing SellerShowcase component now places three icon/text features beside the unchanged `/img/carimg21.png` and configured video. Discovery copy follows the supplied reference, without claiming agent verification. The original role-aware CTA remains (AGENT lists a car; other visitors explore). The previous separate Why Choose grid was consolidated into these three features.

Background is `#f8f9fc`, matching Most Loved Cars. The shared wide homepage gutter remains. Four real overview metrics now sit inside a bordered white panel with icons and dividers, reducing to two columns on smaller screens. Existing IntersectionObserver, Apollo overview, locale counts, zero/error/retry states and video dialog/focus/unmount behavior remain.

The section is separated from both neighboring sections by white top/bottom spacing: 96px desktop, 64px tablet and 40px mobile, increased after the user found the initial spacing too small, in addition to its existing gray inner padding. These scoped white borders keep the section visibly independent even next to a similarly colored section, without changing content widths or component structure.

Six SVG icons from the installed `@mui/icons-material` library were first exported to `C:/Users/behru/Desktop/CARIMG/anorcar-showcase`, then copied to `public/img/showcase`. The section uses only those local URLs for icons; it does not use the reference's video, cover, or remote icon links. Material icon design and package license/source attribution accompany the assets.

Yarn typecheck, showcase component/config tests and desktop/mobile Sass compilation passed. Tests verify six local icon files, three feature rows, real/zero/error metric values and retained role-aware routes. Browser screenshot/interaction QA was not performed for this revision.

## Current layout refinement - 2026-10-14

Latest size correction: the user found the bounded card too small and requested the original large scale with only small top/side gaps. The promotion now spans the available width minus 24px per desktop side, 20px per tablet side and 14px per mobile side, without the 1416px maximum. Top separation is 32/24/16px respectively. Desktop copy padding is restored to 48px vertically, with a responsive 38-46px heading and 18px description. Image visibility/contain fit and the 60/40 desktop split remain; metrics/benefits retain the narrower reading container and previous alignment/type refinements. No arbitrary minimum row height or clipping was reintroduced. The earlier bounded-card description below records the superseded pass.

The latest request supersedes the earlier full-bleed/zero-gap design described in the history below. The section now has 64px desktop, 48px tablet and 32px mobile top padding, separating it from Top Agents. Promotion, statistics and benefits use the same centered, 1416px-bounded container and responsive gutters as the agent content. The promotional card has a subtle border and rounded outer corners.

Root cause was measured before editing: at 1440px the old media panel was 712.5px wide and 620px tall. Cover fit enlarged the panoramic 1756x896 source to approximately 1215px wide, cutting roughly 251px from each side. The section itself also began at the viewport's left edge with no gap after Agents. The new grid gives the image 60% of the card width, removes the arbitrary minimum row height and uses centered contain fit. Both desktop panels still stretch to the same row and begin at the same position; the full photograph remains visible when copy grows. Source/content proportions can produce neutral dark padding around the image. No negative margins, viewport-width hacks or layout transforms were introduced.

At 1200px and below the image stacks above copy at its source aspect ratio. Copy padding/type are more compact, and the benefits heading matches existing homepage section typography (34px desktop/25px mobile). Existing carimg21 image, video configuration/dialog/keyboard focus restoration, role-aware CTA, observer loading, Apollo overview counts, localized copy, metrics and features remain. No backend, authorization, dependency or architecture changes.

Validation: Yarn typecheck, component/configuration checks and browser checks cover balanced/inset edges, explicit section separation, aligned promotion/metrics/benefits, no horizontal or vertical photo crop, full vehicle bounds, non-overlapping play control, panel alignment, responsive stacking, real/zero/error count rendering, CTA, lazy modal open/close/Escape/unmount/focus and Korean/Russian text. Fixture screenshot figures are not production counts. Current screenshots: home-seller-showcase-1440.png, home-seller-showcase-1920.png, home-seller-showcase-3440.png and home-seller-showcase-390.png. No database writes, commit or deployment.

## Earlier implementation history

Inspired by the scale of https://boxcar-nextjs.vercel.app/ while retaining ANORCAR colors, content, permissions and the Nestar-derived architecture.

## Previous constraints and gap

The promotional split was inside `.seller-showcase-container`, capped at 1300px, with 16px rounding and a 500px minimum height. The split now renders outside that container, as a normal 100%-width child of the existing full-width homepage section. No viewport-width hacks or negative margins were added. Statistics and benefits retain a separate 1300px centered wrapper; global homepage containers are unchanged.

The Top Agents showcase imposed `min-height: 816px` plus 132px top/94px bottom padding regardless of actual content. Removed its artificial minimum height and reduced desktop bottom padding to 64px. Existing agent content, carousel, queries and tablet/mobile rules remain. Promotion has no exterior padding, creating a direct dark-to-light transition.

## Layout and supported content

- Desktop promotion: equal 50/50 panels, minimum height clamped between 620px and 680px on large screens, no card rounding. Longer content may expand the row rather than clip. Right panel centers a readable 540px inner column with 56-80px horizontal padding, 44-50px heading, 18px description, 16px benefits and 16px CTA.
- Keep supplied `public/img/carimg21.png`, natural colors and Next Image optimization. Cover positioning is 50% 100%, keeping the centered vehicle visible. Existing viewport observer schedules image loading near the section. Tablet/mobile stack image above copy using the original 1756:896 image aspect ratio, a 76px mobile play control and full-width mobile CTA.
- Listing permissions were rechecked in existing `AddNewCar`: signed-in AGENT accounts receive seller copy and `/mypage?category=addCar`; guests/USER/ADMIN receive buyer copy and `/car`. No permissions, user roles or routes changed.
- Statistics retain the existing Apollo overview query and locale configuration. No new operation or endpoint was added. Live read-only backend verification returned 15 cars, 15 agents and one brand; configured languages are en/kr/ru. Counts are not hardcoded. Existing loading dashes, zero values, error/retry and no-cache behavior remain. Numbers are now 52px, labels 14px, with 68px vertical padding and a subtle divider.
- Why Choose ANORCAR uses the requested four supported capabilities: finding vehicles, comparison, KRW prices and existing private seller messaging. Heading 44px, MUI icons 52px, titles 21px and descriptions 16px. Tablet uses two columns; mobile uses one readable column.
- Order remains Top Agents, promotion, statistics, benefits, Recently Added Cars, community. Removed the old large homepage CompareCars render to retain comparison on its existing dedicated `/car/compare` route; its components, state utilities and dedicated page were preserved.
- Retained Pages Router, React/TypeScript, MUI, SCSS, Apollo, localization and current backend contracts. No new dependencies or backend/schema/data changes. Hero/search, budget, trending, recent listings, agents, auth, navigation, Firebase, community chat and AI assistant logic were not rewritten.

## Video configuration and behavior

`HOME_PROMOTIONAL_VIDEO_URL` in `libs/config.ts` reuses the previously approved https://www.youtube.com/watch?v=Cdh5Taq7H6A. A live YouTube oEmbed check confirmed the title Lamborghini Huracan: Driven by Instinct, author Lamborghini and type video. The UI uses Play video/Automotive video, with no inaccurate manufacturer label on the unrelated photograph.

Optional `NEXT_PUBLIC_HOME_PROMOTIONAL_VIDEO_URL` overrides the default at build time. Empty or unsupported/malformed URLs hide Play. HTTPS YouTube watch/embed and youtu.be URLs are accepted; other hosts and malformed IDs are rejected. Changing a public environment value requires restarting development/rebuilding production; a replacement video must be a real embeddable video.

An 84px white circular button opens the existing MUI Dialog. The youtube-nocookie iframe mounts only while the dialog is open, requests autoplay when permitted, and unmounts immediately on close/Escape to stop playback. Focus returns to Play. A Watch on YouTube fallback remains. Reduced-motion styles disable hover transitions. No video library or automatic iframe loading.

## Files changed in this refinement

- `libs/components/homepage/SellerShowcase.tsx`
- `scss/pc/homepage/seller-showcase.scss`
- `scss/pc/homepage/homepage.scss` (Top Agents minimum-height/bottom-padding only)
- `libs/config.ts` and `.env.example` (video configuration)
- `pages/index.tsx` (remove homepage comparison render)
- `public/locales/{en,kr,ru}/common.json`
- `scripts/check-seller-showcase.cjs`, `scripts/qa-seller-showcase.cjs`
- This report and `docs/screenshots/home-seller-showcase-{1920,1440,390}.png`

## Validation and limits

- `yarn.cmd typecheck`: passed after component changes and final page-order changes.
- `yarn.cmd lint`: passed, with pre-existing warnings for legacy img/link usage and hook dependencies in unrelated files.
- `yarn.cmd build`: passed, all 91 pages generated. Existing Browserslist warnings remain.
- `yarn.cmd node scripts/check-seller-showcase.cjs`: passed supplied image, role-specific copy/CTA, zero/error counts, delayed iframe, approved URL parsing, invalid URL rejection and hidden play for empty configuration.
- `yarn.cmd test:compare`: passed selection, restoration/race handling, localization and unchanged-price KRW checks.
- Production headless Chrome: passed 1920/1440/1024/768/390/320px, including actual Android mobile wrapper, full viewport width, zero section gap, equal desktop panels, 650-750px large-screen height, vehicle image loading, no page overflow, section order, three benefits, correct CTA and real navigation to Cars. Modal embed/fallback, close button, Escape, iframe removal and focus restoration passed. Korean/Russian localization passed.
- Refreshed desktop/mobile screenshots were visually inspected. Screenshot counts (53 cars/4 agents/1 brand/3 languages) are isolated test fixtures; product uses the live API.

YouTube streaming was blocked in browser fixtures; lifecycle and embed source were tested, and live metadata was verified. Actual video delivery/autoplay remains subject to YouTube/network/browser policies. Existing optional sharp recommendation remains; no new dependency was installed. No accounts, listings or messages were created. No automatic commit or deployment. Temporary production preview is stopped after testing; existing development services remain running.


## Final composition refinement

Source inspected: unchanged PNG, 1756x896 (1.9598:1). At 1920px the previous image panel was about 952.5x729.6; at 1440px about 712x650. These panel ratios (1.31:1 and 1.10:1) force cover to crop the wide source horizontally. Baseline screenshots at 1920/1440/390 showed the complete car; a bottom-clipped car was not reproduced there. The excessive desktop height still removed more landscape, and the previous mobile ratio cropped the original frame. Bottom anchoring now protects the vehicle/road when a wider panel crops vertically. No image editing, replacement, distortion or extra border/overlay.

Desktop minimum height is now content-safe clamp(620px,35vw,680px): shorter and better balanced, with equal grid rows for both panels. Tablet minimum remains 580px; <=800px uses the source image aspect ratio so the whole photo fits. Play is 84px at 42% height on desktop/tablet, 76px at 40% on mobile, well above the vehicle. A white keyboard outline improves contrast against the landscape; reduced motion and existing modal behavior remain.

Benefits now have their own scoped wrapper capped at the established 1416px width (also used by Top Agents/Recently Added Cars), while statistics retain 1300px. The 52px column / 36px row gaps give desktop features room without narrowing their text. Titles have a minimum two-line area on desktop, so descriptions align naturally across one/two-line headings; this resets on tablet/mobile. No manual line breaks, card borders or content changes. Statistics retain 52px numbers/14px labels, with padding refined from 72px to 68px. Benefits use 64px top/72px bottom padding to transition into Recently Added Cars. Global containers and other sections are unchanged.

Changed in this final pass: SellerShowcase.tsx (benefits wrapper only), seller-showcase.scss, qa-seller-showcase.cjs, this report and before/after screenshots. No GraphQL, auth, CTA, modal, translations, backend or dependency changes.

Before screenshots: home-seller-showcase-before-{1920,1440,390}.png. After screenshots: home-seller-showcase-{1920,1440,390}.png. Isolated screenshot figures remain test fixtures, not production counts. Final validation is recorded below.

Final-pass validation: yarn.cmd typecheck, lint, 91-page production build and existing showcase component/configuration tests passed. Browser checks passed at 1920/1440/1280/1024/768/390/375/320px with real Android mobile wrapper, computed source-to-cover vehicle bounds, no vehicle/button overlap, 76-88px play diameter, equal desktop columns, full-width boundaries, 620-680px large-screen height, 4/2/1-column benefits with desktop gap checks, natural mobile photo aspect, no horizontal overflow, modal close/Escape/unmount/focus, localization and CTA navigation. Desktop and mobile after screenshots were visually inspected against saved before images. Exported after previews hide fixed support launchers only during capture to isolate these sections; product launchers and all functional checks are unchanged. Existing lint/Browserslist and optional sharp warnings remain. Streaming was blocked in browser fixtures; video modal lifecycle was tested. No commit, deployment, data writes or new backend requests. Temporary preview stopped; development services remain running.


## Horizontal and vertical boundary audit

Inspected LayoutHome, navbar rules, #main, .home-page, Top Agents, promotional section/grid/media/copy, margins, padding, overflow and positioning. Measured the running production page at 1920/1024/3440px with 720px viewport height before editing. #main and .home-page have zero margin/padding, full available width and visible overflow. Promotion has zero margin/padding and begins exactly at Top Agents' bottom. Image and copy have identical top/bottom coordinates, with no horizontal panel gap. The navbar is fixed at y=0 with 87px height; it does not reserve additional space inside these sections. Existing Top Agents bottom padding (64px desktop/70px tablet) is deliberate internal spacing, not an external section gap. No navbar/preceding-section offset or margin fix was warranted.

The reproduced top issue is photographic cropping on ultrawide screens. At 3440px viewport (3425px content), media was 1712.5x680. The 1756x896 source scaled to cover that width becomes approximately 1712.5x873.8. Its 100% vertical anchor consequently removes about 193.8 source-rendered pixels from the top, including the mountain peak. At 1920/1024, cover trims horizontally instead; the source car remains centered and visible.

Smallest fix: move the existing source-derived aspect-ratio:1756/896 from the stacked-only breakpoint to the media's base rule, explicitly stretch the grid items, and bind the media width to 100% of its grid column. Grid's automatic row sizing can then grow with the photograph on ultrawide screens, rather than forcing it into a too-short row. The established minimum height and content-driven expansion still apply, and both desktop columns stretch to the same row. Aspect-ratio items use start-like normal alignment in Grid by default; an intermediate test exposed a 31px panel-height mismatch at 2560px, resolved by align-items:stretch. Its automatic inline size could also derive a width from that stretched height and exceed its column; width:100% anchors it to the assigned 50% column. That three-rule combination was verified in an isolated browser before the final build. Object-fit/object-position, global containers, preceding-section spacing, navbar, content, authorization, GraphQL and video logic are unchanged. No new transforms, negative margins, arbitrary offsets, state or dependencies.

Validation is extended to 3440/2560px as well as existing laptop/tablet/mobile widths, with explicit identical panel tops, zero horizontal/external vertical gap and zero vertical image crop. Viewport height is configurable in the QA script for short/tall browser verification. Final measurements/results are recorded below.

Final audit validation: final production CSS (no browser style override) passed all 10 widths 3440/2560/1920/1440/1280/1024/768/390/375/320 at 720px viewport height, then 3440/1920/1024/390 at 1080px height. Tests assert identical panel tops/bottom heights, zero horizontal panel gap, zero external previous-section gap, equal 50% columns, no page overflow, no vertical photo crop, full conservative vehicle bounds, play/car non-overlap, natural stacked image ratio, modal close/Escape/unmount/focus, KR/RU and real Cars CTA navigation. Ultrawide and normal desktop screenshots were visually inspected; the mountain peak and whole car remain visible. Source-based sizing lets the ultrawide row grow to approximately 874px, while 1440/1920 retain 620-680px; no viewport-height clipping is imposed. Final typecheck, component/config tests and 91-page production build passed. Build's existing lint/Browserslist warnings and optional sharp recommendation remain; no new dependency was added. Video streaming was blocked in fixtures, so modal lifecycle/source were tested. The temporary preview server is stopped after testing. No account/data writes, backend/schema changes, commit or deployment.
# Current layout refinement — 2026-10-15

This supersedes the historical sizing/background notes below. SellerShowcase (video/copy, metrics and benefits), RecentlyAddedCars and CommunityBoards now use the same existing `--home-wide-width` as Top Agents, Most Loved Cars and search: maximum 1680px with 64px desktop side gutters, 32px tablet and 14px mobile. Existing SCSS files/components and Apollo queries remain; no new abstraction or code style was added.

SellerShowcase uses a white background for video/copy, metrics and benefits, as clarified by the user: only Top Agents keeps the dark section background. Text is dark with gray descriptions, subtle light dividers and orange icons/CTA. Removed the separate enclosing panel/border, retaining a rounded contain-fit landscape image with its original 1756:896 ratio and the existing 60:40 desktop split. Copy uses a quieter 32–40px heading and 32px vertical padding. At 1200px and below, image/copy stack with aligned left edges. Existing video modal, focus restoration, lazy overview query and role-aware CTA are unchanged. Next Image sizes track the actual bounded media width. Recently Added retains its light-gray section and Community its white section. Community's artificial 1000px minimum height was removed; desktop section padding is now 88px. Recently Added heading aligns left with the grid. Color correction passed Yarn typecheck and Sass compilation.

Validation: Yarn typecheck, seller showcase component/configuration checks and desktop/mobile Sass compilation passed. No visual browser QA was available for this revision; older screenshot results below describe earlier versions.
