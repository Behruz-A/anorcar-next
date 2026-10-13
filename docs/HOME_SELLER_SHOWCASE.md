# ANORCAR full-width homepage promotion, statistics and benefits

Inspired by the scale of https://boxcar-nextjs.vercel.app/ while retaining ANORCAR colors, content, permissions and the Nestar-derived architecture.

## Previous constraints and gap

The promotional split was inside `.seller-showcase-container`, capped at 1300px, with 16px rounding and a 500px minimum height. The split now renders outside that container, as a normal 100%-width child of the existing full-width homepage section. No viewport-width hacks or negative margins were added. Statistics and benefits retain a separate 1300px centered wrapper; global homepage containers are unchanged.

The Top Agents showcase imposed `min-height: 816px` plus 132px top/94px bottom padding regardless of actual content. Removed its artificial minimum height and reduced desktop bottom padding to 64px. Existing agent content, carousel, queries and tablet/mobile rules remain. Promotion has no exterior padding, creating a direct dark-to-light transition.

## Layout and supported content

- Desktop promotion: equal 50/50 panels, minimum height clamped between 650px and 750px on large screens, no card rounding. Longer content may expand the row rather than clip. Right panel centers a readable 560px inner column with 64-88px horizontal padding, 44-52px heading, 18px description, 17px benefits and 16px CTA.
- Keep supplied `public/img/carimg21.png`, natural colors and Next Image optimization. Cover positioning is 50% 75%, keeping the centered vehicle visible. Existing viewport observer schedules image loading near the section. Tablet/mobile stack image above copy with 1.8/1.7 aspect ratios, an 80px mobile play control and full-width mobile CTA.
- Listing permissions were rechecked in existing `AddNewCar`: signed-in AGENT accounts receive seller copy and `/mypage?category=addCar`; guests/USER/ADMIN receive buyer copy and `/car`. No permissions, user roles or routes changed.
- Statistics retain the existing Apollo overview query and locale configuration. No new operation or endpoint was added. Live read-only backend verification returned 15 cars, 15 agents and one brand; configured languages are en/kr/ru. Counts are not hardcoded. Existing loading dashes, zero values, error/retry and no-cache behavior remain. Numbers are now 52px, labels 14px, with 72px vertical padding and a subtle divider.
- Why Choose ANORCAR uses the requested four supported capabilities: finding vehicles, comparison, KRW prices and existing private seller messaging. Heading 44px, MUI icons 52px, titles 21px and descriptions 16px. Tablet uses two columns; mobile uses one readable column.
- Order remains Top Agents, promotion, statistics, benefits, Recently Added Cars, community. Removed the old large homepage CompareCars render to retain comparison on its existing dedicated `/car/compare` route; its components, state utilities and dedicated page were preserved.
- Retained Pages Router, React/TypeScript, MUI, SCSS, Apollo, localization and current backend contracts. No new dependencies or backend/schema/data changes. Hero/search, budget, trending, recent listings, agents, auth, navigation, Firebase, community chat and AI assistant logic were not rewritten.

## Video configuration and behavior

`HOME_PROMOTIONAL_VIDEO_URL` in `libs/config.ts` reuses the previously approved https://www.youtube.com/watch?v=Cdh5Taq7H6A. A live YouTube oEmbed check confirmed the title Lamborghini Huracan: Driven by Instinct, author Lamborghini and type video. The UI uses Play video/Automotive video, with no inaccurate manufacturer label on the unrelated photograph.

Optional `NEXT_PUBLIC_HOME_PROMOTIONAL_VIDEO_URL` overrides the default at build time. Empty or unsupported/malformed URLs hide Play. HTTPS YouTube watch/embed and youtu.be URLs are accepted; other hosts and malformed IDs are rejected. Changing a public environment value requires restarting development/rebuilding production; a replacement video must be a real embeddable video.

A 92px white circular button opens the existing MUI Dialog. The youtube-nocookie iframe mounts only while the dialog is open, requests autoplay when permitted, and unmounts immediately on close/Escape to stop playback. Focus returns to Play. A Watch on YouTube fallback remains. Reduced-motion styles disable hover transitions. No video library or automatic iframe loading.

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
