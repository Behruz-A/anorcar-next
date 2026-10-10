# Agents hero — 2026-10-10

- Reused the existing Cars hero in LayoutBasic for `/agent`, including `/img/hero4.png`, overlay, typography, content alignment and responsive styles. Agent details retain their existing banner.
- Added `Find Your Agent` and `Connect with an agent to find your next car.` in the existing English, Korean and Russian dictionaries.
- Enabled the existing Cars/Home navbar for the Agents listing so the image starts behind the navigation on mobile as it does on Cars. Existing Apollo queries, list/search/sort/pagination and authentication behavior are retained.
- Final Yarn typecheck and `git diff --check` passed. Desktop 1440px browser comparison passed for image, geometry, typography and copy; screenshot `screenshots/agents-hero-1440.png` was visually reviewed.
- Initial checks found the old mobile navbar offset, which was corrected. A subsequent browser run encountered a stylesheet-readiness race at 768px; permission for the corrected rerun was denied. Final mobile and localized visual validation remain incomplete. The existing mobile Agents listing placeholder remains outside this hero task.
- This is a small frontend change. No backend source/data, dependency, commit or deployment changes.
