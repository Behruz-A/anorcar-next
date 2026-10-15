# Homepage Top Agents cards — 2026-10-15

The existing `TopAgents` and `TopAgentCard` now share `--home-wide-width` with search, Most Loved Cars and Browse by Budget. Swiper displays four full cards at 1440px+, two at 600–1439px and 1.15 on mobile. The ten-agent rank query and existing tie-break remain.

Cards use dark graphite inset panels (#202328), square contain-fit portraits, existing member likes, name/Follow row, address fallback, actual car/view counts and a View Agent link to the existing detail route. The upper-left Car Agent badge was removed at the user's request; caption text and buttons use colors suited to the restored dark background. Default/broken-image fallback remains. Cards stretch to equal heights. Existing dark section and carousel arrows remain. English, Korean and Russian labels are included.

Follow uses existing SUBSCRIBE/UNSUBSCRIBE mutations, then refetches GET_AGENTS. Like uses LIKE_TARGET_MEMBER. Both share a per-card synchronous pending guard, guest login redirect and hidden self actions. Interactive buttons are outside profile links. The parent refetches when the viewer changes.

Backend `MemberService.getAgents` adds existing `lookupAuthMemberFollowed` after pagination, scoped to authenticated viewer and each agent ID. GET_AGENTS selects the already-supported nullable `meFollowed` field. No new schema, resolver, service, dependency or live inventory changes. Deploy this backend lookup with the frontend so existing subscriptions show correctly.

Validation: frontend Yarn typecheck, API TypeScript check, GraphQL contract validation and desktop/mobile Sass compilation passed. `check-top-agent-cards.cjs` renders the real components with isolated Apollo/router/Swiper boundaries, checking responsive counts, follow/unfollow/like mutation selection/refetch, guest/self guards and valid non-nested profile links. This is component verification; browser visual/interactions and live authenticated mutations were not tested.
