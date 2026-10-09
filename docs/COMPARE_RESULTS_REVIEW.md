# Comparison results review

The `/car/compare` route retains its existing GraphQL contracts, selection URL, availability loading, differences toggle, removal and detail links. Homepage comparison files and unrelated working-tree edits were preserved.

## Navbar and scrolling

The original desktop navbar was fixed at z-index 99 with a translucent background; table headers were not sticky. This let table content show through the navbar and required a hardcoded page offset.

The results route now opts into a `compare-results-shell` layout class. Its navbar wrapper is sticky in normal flow, and its inner navbar is relative and opaque. Navbar content can wrap on tablet. Mobile retains a white navigation background. The route no longer needs the fixed 110px top padding. A ResizeObserver measures the actual navbar height for scroll margins on the comparison region and its interactive controls; it disconnects on unmount. Other routes retain their existing layout behavior.

## Table presentation

- Existing Poppins typography, a consistent line height and cell padding, and tabular numerals improve scanning.
- Three-car tables retain a 900px minimum width and horizontal scrolling on narrow screens; two-car tables retain their existing sizing.
- All twelve existing fields, actual images, names and USD prices remain.
- Missing mileage renders as an em dash in this table. Valid zero mileage renders as `0 km`. The shared mileage formatter and homepage missing-value presentation are unchanged.

## Verification

- `yarn typecheck`: passed.
- `yarn test:compare`: passed existing selection, mileage, restoration and localization tests.
- `yarn node scripts/check-compare-results.cjs`: passed rendered two/three-car columns, twelve fields, missing/zero/nonzero mileage and detail URLs.
- Isolated real-inventory browser checks: passed at 1440px desktop, 768px tablet and 390px mobile, plus KR/RU desktop. Verified natural navbar spacing, opaque sticky stacking while scrolling, no page overflow, aligned row cells, differences filtering, three-to-two removal/URL updates and actual navigation to the remaining car's detail route.
- Measured-height and detail-link scroll-clearance checks passed on all three screen sizes. Scrolled screenshots were visually reviewed using temporary artifacts; existing homepage previews were preserved.
- No dependencies, GraphQL contract changes, homepage UI changes, commit or deployment.

## Modified files

- `libs/components/layout/LayoutFull.tsx`
- `pages/car/compare.tsx`
- `libs/components/car/CarComparisonTable.tsx`
- `scss/pc/homepage/compare.scss` (results-only selectors)
- `scripts/check-compare-results.cjs`
- This document
