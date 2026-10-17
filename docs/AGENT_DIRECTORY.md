# Agents directory

The existing `/agent` page and shared `AgentCard` now follow the supplied reference: filter sidebar, search/sort and grid/list controls, three cards per desktop row, two on tablet and one on mobile. The outer container uses the same shared homepage width. Mobile filters use the existing MUI Drawer pattern.

Grid cards use the Top Agents proportions: square image areas with contained, undistorted photos, 20px card padding, 24px card corners, 18px image corners and 24px gaps. Mobile card padding is 14px with 20px corners. View Profile retains a pale gray background and dark text. List mode retains horizontal cards.

Cards show real profile photos, names, agent type, address, languages, active listing count, views and likes. Follow/Following uses the existing subscribe/unsubscribe mutations; likes retain authentication checks, red selected hearts and refetch. Self interactions are disabled. Profile links keep the existing agent detail route. Missing metadata is labelled rather than invented; no illustrative verification badges or stock profiles were added.

## Data and filters

The existing Nestar Member schema, DTO, service and Apollo query are extended with optional `agentType` and `agentLanguages`. No new modules, libraries or migrations are introduced. Existing members remain valid without these fields. Agents can edit their type and languages in the existing My Page profile form; authentication hydration retains the optional fields from the refreshed token.

Existing `AgentsInquiry.search` accepts location, agent types, languages and minimum/maximum active listings. Filters combine with keyword search across nickname, full name, address and description. Multiple languages require all selected languages; types match either selected type. Location is matched literally, case-insensitively against the stored address. Listing ranges are inclusive. Search, sorting and pagination remain URL based, with nine records per page and a reset to page one when filters change. Clear all resets filters and text while retaining sort.

Deploy the corresponding `anorcar` backend changes before this frontend: the Apollo query now selects the optional fields. Backend validation rejects invalid enum values, duplicate or oversized lists, invalid counts and reversed ranges. Public results still require ACTIVE AGENT accounts. Existing follow/like lookups and pagination facets remain.

## Validation

- Frontend TypeScript, migration regressions (including the new directory behavior checks), production build and shared/desktop/mobile Sass compilation passed.
- Backend API TypeScript and seven focused DTO/service tests passed.
- All 54 frontend GraphQL operations, three upload documents and registered enums validated against the local backend.
- Read-only local backend directory requests passed for default, location/listing and type/language filters. No member data was changed.
- EN/KR/RU labels checked. Production build retains existing repository lint and page-data warnings. Browser visual QA was not performed.
