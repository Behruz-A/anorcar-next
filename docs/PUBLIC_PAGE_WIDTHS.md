# Shared public page width

Public Home, Cars/detail/compare, Agents/detail, Community/detail, My Page, member profiles, Help Center, About and authentication page containers follow the approved homepage width:

- Above 1200px: `min(1680px, calc(100% - 128px))`.
- Up to 1200px: `calc(100% - 64px)`.
- Up to 600px: `calc(100% - 28px)`.

The existing shared `scss/car.scss` entry point defines `--public-content-width` on public desktop/mobile roots and aligns explicit outer container selectors, hero copy, navbar and footer. Existing homepage width variables resolve to the same value. The former Cars-only width override is consolidated into this shared rule. Inner panels, article text limits, cards, filters, modals and breakpoint layouts retain their existing rules; legacy member profile frames stretch to the outer container at desktop widths. Authentication outer padding is consolidated into the shared gutter to avoid double spacing. Admin retains its separate sidebar layout.

No component architecture, data fetching, API contract, dependency or interaction changes. Validation: frontend TypeScript and shared/desktop/mobile Sass compilation. Browser visual QA was not performed.
