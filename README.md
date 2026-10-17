# ANORCAR frontend

Next.js Pages Router, React 18, TypeScript, Apollo/GraphQL, MUI and SCSS, retaining the original Nestar folder/component patterns. The matching API is in the sibling `anorcar` repository. Migration decisions and completed backend work are documented in `../anorcar/docs`.

## Local development

Use Yarn Classic and a supported Node.js release (Node 22 is recommended).

```powershell
yarn install --frozen-lockfile
Copy-Item .env.example .env.local
yarn dev
```

Set local variables before starting. The default frontend is `http://localhost:3000`; the local backend is `http://localhost:3007/graphql`. Development output is isolated in `.next-dev`; production builds use `.next`.

## Checks

```powershell
yarn check:release
yarn check:graphql
yarn build
```

`check:release` runs strict TypeScript including unused declarations, ESLint and the existing auth/homepage/agent/chat/cache/compare and article-sanitizer regressions. `check:graphql` is read-only and requires the matching API; it validates frontend operations, upload documents and registered enums. More focused admin and listing checks are in `scripts/check-*.cjs`. Some `qa-*.cjs` scripts require a separately configured browser session; they are not part of the automatic release gate.

## Production

1. Configure `REACT_APP_API_URL` and `REACT_APP_API_GRAPHQL_URL` with the public **HTTPS** API. Set `REACT_APP_API_WS` to **WSS** if it differs from the API origin. These are public build-time variables; rebuild after changing them. Never deploy with the example localhost addresses.
2. Configure Firebase's public web values only after the matching backend token/conversation endpoints, database rules and authorized domains are configured. Backend secrets and service-account credentials must stay on the backend.
3. Deploy the matching backend first; current frontend queries require the optional agent type/language fields and the completed Car/Brand contract.
4. Install with `yarn install --frozen-lockfile`, run the checks above, then start the tested artifact with `yarn start`. Configure the hosting platform's port or pass `yarn start -p <port>`.
5. On the deployed origin, check login/refresh/logout, image uploads, admin access, carousel/layout behavior and chat connectivity using test accounts. Local fixtures do not substitute for production configuration checks.

Legacy `/property` and admin property URLs intentionally redirect to Cars and preserve locale/query values. Keep these compatibility routes. Published FAQs are read-only; notices use real NEWS articles and are managed through existing admin Community controls.

Release-audit findings and exact validation results are recorded in `docs/DEPLOY_REVIEW.md`.
