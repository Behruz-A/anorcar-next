# ANORCAR full-width homepage promotion, statistics and benefits

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
