# Google and Kakao login/signup

Both providers appear on `/account/join` and `/account/join?mode=signup`. The first successful provider login creates an ACTIVE USER (buyer) account; subsequent logins reuse that provider's subject. Generated nicknames and optional names can be edited through the existing profile form. Social signup does not use the password form's seller selection. Existing phone/password signup still supports USER/AGENT.

Google retains its existing backend OAuth flow, verified ID token, nonce and PKCE. Kakao uses server-side authorization-code exchange, client secret, state and PKCE; access-token metadata must match `KAKAO_APP_ID`, remain unexpired and identify the same user as `/v2/user/me`. Email/profile consent is not required for identity. Optional nickname is only display metadata. Provider tokens/secrets never reach frontend storage. Accounts are not automatically linked by email, phone or display name.

Both flows use signed ten-minute HttpOnly flow cookies, separate provider cookies/collections, one-minute hashed browser/origin-bound tickets, atomic consumption, ACTIVE-member rechecks and the existing fifteen-minute JWT/thirty-day rotating refresh session. Callback pages erase ticket fragments before exchange. Local return paths exclude both authentication callbacks. Password authentication and GraphQL/Apollo integration remain.

## Kakao setup (Uzbek)

1. [Kakao Developers](https://developers.kakao.com/) saytida Kakao akkauntingiz bilan kiring va ilova yarating. Ilova nomi va egasi haqidagi talab qilingan ma'lumotlarni to'ldiring.
2. Ilova boshqaruvida **Kakao Login** funksiyasini yoqing. Web platform/site domain sozlamasiga `http://localhost:3000` kiriting.
3. Kakao Login uchun redirect URI ni aynan `http://localhost:3007/auth/kakao/callback` qilib ro'yxatdan o'tkazing. Bu backend callback manzili; frontenddagi `/account/kakao-callback` emas.
4. **REST API key** va unga tegishli **Client secret** ni oling. Client secret yoqilgan bo'lishi kerak. JavaScript key yoki Admin key ni ishlatmang. Ilovaning raqamli **App ID** qiymatini ham yozib oling; App ID REST API key dan boshqa qiymat.
5. Faqat backend `anorcar/.env` fayliga quyidagilarni qo'shing. Haqiqiy maxfiy qiymatlarni chatga, Git'ga yoki frontend muhitiga yozmang:

```dotenv
KAKAO_CLIENT_ID=your-rest-api-key
KAKAO_CLIENT_SECRET=your-client-secret
KAKAO_APP_ID=your-numeric-app-id
KAKAO_REDIRECT_URI=http://localhost:3007/auth/kakao/callback
```

6. Backend qayta ishga tushgach login yoki signup sahifasidan **Continue with Kakao** ni bosing va o'z akkauntingiz bilan tasdiqlang. Ilova test rejimida bo'lsa, uning ruxsat etilgan jamoa/test foydalanuvchilarini tekshiring. Oddiy login uchun email, telefon yoki boshqa ortiqcha consent talab qilinmaydi. Profil nickname ruxsati ixtiyoriy.
7. Birinchi kirishda akkaunt yaratilishini, chiqib qayta kirishda shu akkaunt ochilishini tekshiring. Google bilan yaratilgan akkaunt va Kakao akkaunti alohida hisoblanadi.

Console menu labels may change. Follow the official [Kakao prerequisites](https://developers.kakao.com/docs/en/kakaologin/prerequisite) and [REST API guide](https://developers.kakao.com/docs/en/kakaologin/rest-api).

## Google setup

Existing backend-only `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI=http://localhost:3007/auth/google/callback` remain. Register `http://localhost:3000` and the exact backend callback in the Google Web OAuth application. If the app is restricted to test users, allow the intended account. See [GOOGLE_LOGIN.md](GOOGLE_LOGIN.md).

## Production

Deploy the additive backend before the frontend. Register the real frontend origin and exact HTTPS backend callback URI separately with each provider. Set `CLIENT_ORIGINS`, provider secrets and existing refresh-cookie options for that deployment. Both providers must be configured for their production applications; localhost credentials/URIs are insufficient. No production deployment is included in this change.

Kakao application creation, credentials and personal provider consent are manual setup steps. Missing Kakao configuration fails closed with a localized retry message; it does not prevent server startup or password/Google login.

## Checks

Verified on 2026-11-05:

- Frontend strict typecheck and zero-warning ESLint passed. Existing refresh/session regression and the new actual social-helper transport/session fixtures passed.
- Headless Chrome passed login/signup at 320/390/768/1024/1440px, KR/RU layouts, both enabled providers in both modes, pending locks/double-click suppression, failed start/retry, callback completion/session/fragment removal, missing ticket, and existing password/signup validations/redirects. Screenshots refreshed; desktop and mobile previews reviewed. These are isolated GraphQL fixtures, with no personal provider consent or live account writes.
- Frontend production build passed all 88 static-generation tasks, including both localized callback routes. Existing Sass/cache/autoprefixer and translated page-data warnings remain.
- Backend API/batch typecheck, focused zero-warning ESLint, both production builds and 96 focused tests across five suites passed in a staged source copy. The exact verified file contents were then copied into `anorcar` after checking original hashes, preserving earlier user edits. The real backend was not started against MongoDB during validation; personal account consent and deployed cookie behavior remain unverified.

- Frontend: `yarn typecheck`, `yarn lint`, `yarn test:auth`, `yarn node scripts/check-social-auth.cjs`, `yarn node scripts/qa-login.cjs`, `yarn build`.
- Backend: API/batch typecheck, non-mutating ESLint and Google/Kakao/session/member-auth tests. Provider and database fixtures isolate authentication tests; they create no real accounts or sessions.
- Real personal consent, production cookies and repeated login with actual provider accounts require configured applications and a manual final check.
