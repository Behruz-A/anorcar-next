# Gemini AI Assistant — 2026-10-13

ANORCAR now has adjacent AI Assistant and Live Chat launchers on the existing home/basic/full layouts, including mobile. Only one panel opens at a time. Existing WebSocket chat messages, authentication and transport remain; the wrapper controls visibility. FAQ's existing Ask AI Assistant action opens the same panel.

## Architecture and files

Backend repository: `../anorcar`.

Created:

- `apps/anorcar-api/src/components/ai/ai.module.ts`, `ai.resolver.ts`, `ai.service.ts`, `ai.spec.ts`.
- `apps/anorcar-api/src/libs/dto/ai/ai-chat.input.ts`, `ai-chat.response.ts`.
- `apps/anorcar-api/src/libs/config/ai.config.ts`.
- `.env.ai.example`.

Modified:

- `components/components.module.ts`: register the AI module using existing DI conventions.
- `libs/interceptor/Logging.intercepter.ts`: AI request logs contain only operation name/duration, never input/output. This handles inline GraphQL and operations combining AI with another mutation too.
- `package.json` and `package-lock.json`: official backend-only `@google/genai` 2.28.0; installed with the backend's existing npm lockfile workflow. No frontend dependency added.
- `docs/COMPLETED_TASKS.md`: handoff entry in the existing docs directory (`docs/ai` does not exist).

Frontend created:

- `libs/components/AiAssistant.tsx`: typed Apollo panel, suggestions, user/AI messages, pending state, inline errors, retry, Enter/Shift+Enter, IME support, scrolling and bounded local history.
- `libs/components/SupportChat.tsx`: two launchers, mutually exclusive panels, Escape/close focus restoration and FAQ open event.
- `libs/types/ai/ai-chat.ts`, `scss/support-chat.scss`, `scripts/qa-ai-assistant.cjs` and screenshots under `docs/screenshots/ai-*`.

Frontend modified:

- `apollo/user/mutation.ts`: `AskAiAssistant` document.
- `apollo/client.ts`: this operation uses inline panel errors instead of global SweetAlert, retaining existing auth-refresh behavior.
- `libs/components/Chat.tsx`: optional controlled visibility and hidden launcher, close button/accessibility/localization; existing human/community chat transport remains.
- `libs/components/layout/{LayoutHome,LayoutBasic,LayoutFull}.tsx`: shared widget in existing desktop/mobile branches; full layout's `showChat` option remains.
- `pages/_app.tsx`, `pages/cs/index.tsx`, EN/KR/RU common translations.

## Configuration

Merge into **backend** `anorcar/.env`; never put a key in frontend files or a `NEXT_PUBLIC_*` variable:

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_MAX_OUTPUT_TOKENS=200
GEMINI_TIMEOUT_MS=12000
AI_IP_REQUESTS_PER_MINUTE=10
AI_USER_REQUESTS_PER_MINUTE=10
AI_DAILY_REQUEST_LIMIT=500
AI_MAX_CONCURRENT_REQUESTS=4
```

Obtain a key from [Google AI Studio's API key page](https://aistudio.google.com/api-keys), select/create your project and configure access/quota for that project. [Google's key guide](https://ai.google.dev/gemini-api/docs/api-key) describes setup. Restart the backend after editing environment values; frontend restart is unnecessary for the key.

The default is Google's stable [Gemini 3.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite). Model choice is explicit and Flash-only; there is no expensive fallback. Other configured models must be available to the Google project. The SDK is configured for one attempt (no automatic provider retry).

## API, cost and security

```graphql
mutation AskAiAssistant($input: AiChatInput!) {
  askAiAssistant(input: $input) { answer }
}
```

The only input is `message`, limited to 1–1000 characters and rejecting blank text. No conversation collection or ID is necessary. Only the current trimmed message and compact server-controlled platform instructions go to Gemini. UI retains up to 40 messages locally for display; server receives no history, profile, token, inventory document or private account data.

System instructions request the user's language, including Uzbek; 1–3 short sentences, usually below 60 words. Output defaults to 200 tokens and minimal thinking on the default model. Actual generated text length/language cannot be guaranteed by a prompt; live quality evaluation is still required after configuring the key. No tools, external search, embeddings, RAG or account actions are enabled. Instructions are separate from untrusted user text, reducing prompt-injection risk; model output is rendered as escaped plain text. The model is told not to invent policies/prices/inventory, claim human status, request credentials or make legal/financial guarantees.

Anonymous users are allowed with the same IP limit. Optional bearer credentials use the existing AuthService; invalid/expired credentials are rejected, not silently treated as anonymous. Signed-in users receive both IP and verified-user quotas. A client header and trusted Origin check follow existing auth configuration. Untrusted forwarding headers are ignored.

Fixed one-minute buckets, an aggregate UTC-day request cap and a concurrent-request cap prevent uncontrolled provider usage. Buckets are hashed and bounded to 10,000 entries. Controls are in memory **per API process** and reset on process restart; multiple replicas need a shared gateway limiter/aggregate quota before production scaling. Behind a proxy, configure Express trust proxy for known proxies only, or clients will share that proxy's conservative IP quota. Google project quotas should also be configured.

Timeout aborts the SDK request and returns the same short unavailable error for missing/invalid key, timeout, blocked/empty response or upstream failure. Provider error objects are never logged or returned. Client timeout is 18 seconds. An abort does not guarantee cancellation of Google-side billing; [SDK documentation](https://googleapis.github.io/js-genai/release_docs/interfaces/types.GenerateContentConfig.html) notes this.

## Testing and activation

Backend checks:

```powershell
node node_modules/typescript/bin/tsc -p apps/anorcar-api/tsconfig.app.json --noEmit --incremental false
node node_modules/typescript/bin/tsc -p apps/anorcar-batch/tsconfig.app.json --noEmit --incremental false
node node_modules/@nestjs/cli/bin/nest.js build
node node_modules/jest/bin/jest.js --runInBand apps/anorcar-api/src/components/ai/ai.spec.ts
```

Frontend checks:

```powershell
yarn typecheck
yarn test:auth
yarn check:graphql
yarn node scripts/qa-ai-assistant.cjs
yarn build
```

AI tests use spies and an isolated real-SDK transport response. Browser tests stub Gemini responses and WebSocket messages: no paid Gemini requests, real messages or account/database mutations. After setting the key, open any public page, use the robot button and test EN/KR/RU/Uzbek questions, brevity, current-inventory limitations and an adversarial role-change request. Switch to Live Chat to verify exclusive visibility. Keep production limits enabled.

## Remaining limitations

- At implementation time `GEMINI_API_KEY` was not configured; key-free missing-key handling was verified. The later activation check below records actual provider results. Comprehensive response-quality/adversarial evaluation is still recommended.
- Chat is stateless on the AI backend: include needed details in each question. No inventory/account access or actions.
- Existing Live Chat is a shared WebSocket conversation, not a guaranteed dedicated human support agent. This integration does not create staffing, private operator routing or support guarantees.
- No deployment or commit was performed. Existing unrelated backend changes were preserved. Installation reported existing dependency audit findings; no broad dependency upgrade/audit-fix was attempted.

## Verification results

- API and batch TypeScript checks and Nest build passed.
- 18 AI tests passed, covering validation, anonymous/user limits, daily/concurrent caps, timeout/abort, no expensive fallback, missing key, simulated invalid-key/provider error, empty output, actual SDK transport with a fixture, GraphQL headers/origin/auth and private-message log redaction.
- 10 existing backend auth/session tests and frontend auth-session checks passed.
- Final frontend typecheck and 91-page production build passed. Existing project lint warnings remain.
- Live schema validation passed for 48 operations, three uploads and enums. The real local mutation returned the expected safe missing-key error.
- Final browser suite passed 320/390/768/1440px, adjacent launchers, panel bounds/exclusivity, preserved WebSocket sends, pending lock, Enter/Shift+Enter/Escape, retained input/error retry, no global error popup, localized KR/RU UI, Uzbek text rendering with a fixture, home/mobile and FAQ action. No uncaught runtime errors. Screenshot previews were reviewed after opening animations settled.
- Initial implementation verification used no actual Gemini calls, live chat messages or database writes. Subsequent live activation results are recorded below.

## Activation troubleshooting — 2026-10-13

- A key was subsequently configured, but `.env` selected `gemini-2.5-flash-lite`. Google returned HTTP 404 / NOT_FOUND, explicitly stating that this model is unavailable to new users and recommending `gemini-3.5-flash-lite`.
- Changed only backend `GEMINI_MODEL` to the integration's original `gemini-3.5-flash-lite` choice; the key was preserved and never printed. Triggered the existing Nest watch reload.
- A short actual SDK request succeeded with STOP finish reason. The application's real `askAiAssistant` mutation also returned an answer.
- Clarified the knowledge prompt to direct sellers to choose Agent during signup, rather than inventing a self-service User-to-Agent upgrade.
