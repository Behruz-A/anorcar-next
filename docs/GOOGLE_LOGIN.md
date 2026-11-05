# Google sign-in integration

Google sign-in is connected to the existing ANORCAR backend and access/refresh session contract. Google and Kakao now appear on both login and signup; see [SOCIAL_LOGIN.md](SOCIAL_LOGIN.md) for Kakao setup and current verification. Nickname/password login and signup remain available.

## Local setup

Only backend `../anorcar/.env` contains these settings (values are deliberately omitted):

```dotenv
GOOGLE_CLIENT_ID=your-web-client-id
GOOGLE_CLIENT_SECRET=your-web-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3007/auth/google/callback
```

Google Cloud Web application client registers `http://localhost:3000` as an authorized JavaScript origin and the exact redirect URI above. Existing `SECRET_TOKEN` and `CLIENT_ORIGINS` still apply. Local default origins include localhost:3000/3001. No Google secret is used by frontend code or exposed through a public environment variable.

Open `/account/join`, select Continue with Google, choose your account and approve basic identity access. This final personal account selection/consent remains a manual check. If Google restricts your app to test users, add your Google account in Google Auth Platform → Audience. Configuration changes require a backend reload/restart; the local watch server picked up the new operations.

## Flow and contracts

1. Frontend calls `startGoogleLogin(input: GoogleLoginInput!): String!` through GraphQL with credentialed cookies and `X-Anorcar-Client: web`. Input contains the exact allowed frontend origin, EN/KR/RU locale and optional safe local referrer.
2. Backend sets a ten-minute signed HttpOnly browser-flow cookie and redirects the browser to Google's official authorization endpoint. State, PKCE S256 and nonce are independent random values. The flow signing key is derived separately from the existing JWT secret and is not an access-token signing key.
3. `GET /auth/google/callback` checks the signed browser cookie/state, exchanges the authorization code using PKCE and the server-only client secret, and uses official `google-auth-library` to verify Google ID-token signature, issuer, expiration and audience. Nonce, verified email and Google subject are required. Google access/ID/refresh tokens are never persisted or returned to frontend.
4. Backend finds the member by private, unique Google subject. First sign-in creates an ACTIVE USER with a generated unique editable nickname and optional Google full name. No phone number/password is fabricated, no privileged role can be chosen, and no existing account is linked by email or name. Existing nickname/password signup still requires phone/password and cannot claim the GOOGLE auth type.
5. Callback issues a browser-bound, origin-bound, one-minute one-time ticket, storing only hashes in MongoDB `googleLoginTickets` with TTL cleanup. The opaque ticket travels in the fragment to localized `/account/google-callback`; it is not an access token. The frontend removes the fragment before its request.
6. `completeGoogleLogin(code: String!): GoogleLoginResult!` atomically consumes the ticket with the HttpOnly binding cookie and trusted browser request. Member ACTIVE status is rechecked. Existing AuthSessionService creates the same 30-day rotating refresh cookie, and AuthService returns the normal 15-minute access JWT. Frontend uses existing session storage/user state helpers and performs a full safe return navigation.

`GoogleLoginResult` returns `accessToken` and `returnTo`. Google's subject is not exposed as a GraphQL member field or included in access JWTs. `MemberAuthType.GOOGLE` is additive; public memberPhone output is nullable for Google accounts, while regular signup inputs and existing records remain unchanged. Phone can be supplied later through the existing profile form. Identity linking between an existing password account and Google is intentionally not automatic.

## Validation

- Frontend strict TypeScript, zero-warning ESLint, existing session regression and production build passed (85 static-generation tasks, including the three localized callback pages).
- Backend API/batch TypeScript, focused ESLint and Nest production build passed. Focused OAuth/session/member tests cover state/PKCE/nonce, signature/expiry, denied consent, invalid identity, origin/binding, ticket expiry/replay, blocked/deleted users, race-safe first creation, forged public Google signup and existing password/session behavior.
- `yarn node scripts/qa-login.cjs` passed 320/390/768/1024/1440px, KR/RU, existing password/signup paths, Google start failure/retry, callback exchange/session/fragment removal and missing callback code. Uses isolated provider/auth/storage fixtures; no live account writes.
- `yarn check:graphql` validated 56 frontend operations, three upload documents and enums against the running local API.
- `yarn node scripts/check-google-login.cjs` checks live local start/cookies/PKCE/state/nonce, rejected origins and invalid callback without account writes. Set `GOOGLE_QA_PROVIDER=1` to additionally load Google's authorization page without account selection/consent/token exchange. This passed with the configured local client.
- Existing build warnings concern Sass imports/cache, autoprefixer and shared translated page-data size. No production access, deployment, Google account consent, live member/session creation or database backfill was performed during verification.

For production, register the production frontend origin and exact HTTPS API callback in Google Cloud, configure backend origins/secrets/redirect/cookie settings and deploy both repositories together. This local integration does not deploy changes to anorcar.io.

References: [Google server OAuth flow](https://developers.google.com/identity/protocols/oauth2/web-server), [OpenID Connect verification](https://developers.google.com/identity/openid-connect/openid-connect).
