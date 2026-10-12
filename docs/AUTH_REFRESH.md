# Access and refresh sessions — 2026-10-12

Access JWTs now expire after **15 minutes**. Refresh sessions last **30 days from login/signup**, with an absolute expiry that rotation does not extend. The existing NESTAR NestJS AuthModule/MemberResolver/service/DTO/schema and frontend Apollo/Pages Router architecture remain. No new dependency, login UI, refresh popup, notification or deployment was added.

## Backend

- Existing JwtModule and AuthService issue 900-second access JWTs. Token payloads exclude passwords, nested access tokens and previous timestamps. Verification also caps age at 900 seconds, including previously issued 30-day JWTs. Expiry is reported as ACCESS_TOKEN_EXPIRED for one safe frontend retry; invalid signatures remain unauthenticated.
- Existing login/signup return the same Member.accessToken contract, while their resolver starts a refresh session and sets an HttpOnly cookie. GraphQL context explicitly exposes req/res so cookies reach the browser.
- AuthSessionService/AuthResolver live inside the existing auth component. DTOs are under libs/dto/auth; RefreshSession.model.ts is under schemas. AuthModule registers Member and RefreshSession models through existing Mongoose DI. No MemberService/AuthModule circular dependency.
- refreshAccessToken returns only a new accessToken. Refresh credentials are opaque random values in the anorcar_refresh cookie and never GraphQL/member fields. Mongo refreshSessions stores SHA-256 hashes, authenticated memberId, original expiresAt, rotation history and revokedAt; TTL removes expired records. Atomic compare-and-update permits one rotation per credential. Proven reused tokens revoke their session; guessed IDs/secrets cannot revoke someone else's session.
- Refresh loads the current ACTIVE member, so blocked/deleted accounts cannot renew and role changes appear in the new JWT. Logout revokes the current browser session and clears its cookie; other devices remain signed in. Existing access JWTs remain stateless and are bounded to 15 minutes.
- Cookie: HttpOnly, Path=/graphql, SameSite=Lax by default; Secure in production. Login/signup/refresh/logout require POST, X-Anorcar-Client: web and a trusted Origin when present. Main CORS uses CLIENT_ORIGINS with credentials enabled. Logging redacts credentials; raw bearer/payload logging was removed.
- Socket message identity also stops being authenticated after access expiry. The client reconnects with renewed credentials and refreshes before authenticated chat sends.

Rotation/reuse handling follows the protection pattern described by [RFC 9700, section 4.14](https://www.rfc-editor.org/rfc/rfc9700.html#section-4.14). Cookie flags and credentialed cross-origin requests follow [MDN Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).

## Frontend

Filled the existing apollo-link-token-refresh placeholder instead of replacing Apollo. It detects expired/nearly expired access tokens, queues requests and obtains a new token through a credentialed direct GraphQL fetch. A shared promise coalesces requests; Web Locks coordinate browser tabs where available. The installed library drains its queue after failure, so a small following link blocks failed requests from sending stale credentials. Server ACCESS_TOKEN_EXPIRED is retried once, after refresh.

The 15-minute access token keeps its existing localStorage location. The refresh credential is only in the HttpOnly cookie. The non-secret authSession marker identifies cookie-backed sessions at hydration; the page retains its known user while refreshing. Admin redirects wait for authReady. No refresh-specific loading UI, toast or popup is shown. Temporary network errors preserve the known session for retry; an expired/revoked refresh session clears auth so existing protected-page login behavior applies.

Login/signup bypass refresh gating and wait for earlier refresh work before replacing a session. Logout clears local auth immediately, waits for pending work, revokes the server cookie and then reloads. If offline, logoutPending prevents automatic restoration and retries revocation on the next hydration. Session version checks reject late refresh responses after logout/login. Storage events synchronize tabs without broadcasting logout loops.

The three existing direct image-upload paths request a valid access token before sending; their upload contracts remain unchanged. Access-token updates renew the existing socket connection. Browsers without Web Locks still coalesce requests within a tab; cross-tab coordination relies on browser Web Locks support.

## Rollout/configuration

- Development defaults: CLIENT_ORIGINS=http://localhost:3000,http://localhost:3001. Keep frontend/backend hostnames consistent (localhost versus 127.0.0.1) for cookies.
- Production: set CLIENT_ORIGINS to the exact frontend origins, comma-separated; use HTTPS. Existing SECRET_TOKEN, API URL and GraphQL URL settings remain.
- Same-site frontend/API subdomains can use the default lax cookie. If deployment is truly cross-site, REFRESH_COOKIE_SAME_SITE=none enables Secure; HTTPS and browser third-party-cookie support are then required. Prefer same-site hosting.
- Existing users without a refresh cookie sign in once after their old JWT passes the 15-minute age limit. No old token is exchanged into a new 30-day session without authentication. No development records were migrated/deleted.
- This implements web/mobile-browser cookie sessions. A separate native application would need its own credential transport; no native refresh token is exposed in GraphQL here.

## Verification

- Frontend typecheck, test:auth and migration/auth checks; live schema validation of 47 operations, three uploads and enums.
- Backend API/batch typechecks and Nest build; 19 isolated auth/session/socket/Inquiry GraphQL tests with no live database writes. Tests cover cookie flags/30-day absolute expiry, JWT 900-second age, login/signup, CSRF controls, current role, blocked/deleted members, rotation/replay, concurrent reuse, invalid secrets, storage failure, logout and legacy access age.
- check-auth-session.cjs covers actual frontend session helpers with isolated fetch/storage: single-flight, cross-tab Web Locks, credentials, fresh-token bypass, offline retry, refresh expiry, logout and late responses.
- qa-auth-refresh.cjs exercises actual Apollo/React UI with browser fixtures at desktop/mobile: preflight refresh, one server-expiry retry, updated Authorization, no popup, HttpOnly fixture, admin restoration without early redirect and logout. No real login/account/message writes.
- Existing CS/Inquiry UI browser regressions are retained. Production build keeps pre-existing lint warnings.

Backend handoff remains in sibling anorcar/docs because docs/ai is absent.
