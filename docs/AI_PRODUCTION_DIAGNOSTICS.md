# AI assistant production diagnosis — 2026-10-18

Production infrastructure supplied by the user: Hostinger Ubuntu VPS, Docker Compose at `/opt/anorcar`, API container `anorcar-api`, internal port 3007, Caddy proxy, public frontend `https://anorcar.io` and GraphQL `https://api.anorcar.io/graphql`.

No SSH connection, production file edit, restart or deployment was performed. Production changes require the user's explicit approval.

## Confirmed evidence

- The deployed public frontend bundle points to `https://api.anorcar.io/graphql`, includes `askAiAssistant` and sends `X-Anorcar-Client: web`.
- Production CORS preflight returns 204, allows `https://anorcar.io`, requested headers and credentials. The mutation exists in the production schema.
- An anonymous request with the real frontend Origin returns the generic `AI assistant is temporarily unavailable` GraphQL error. The equivalent local request succeeds with the configured local key and model.
- This rules out a missing mutation and confirms that the tested origin/transport works. It does **not** establish which production provider/configuration failure occurred.
- The previous service intentionally discarded all provider exceptions and emitted the same public error for missing keys, exhausted application budgets, empty output, provider failures and timeout. Existing production logs cannot recover the discarded provider status retroactively.

## Safe local correction

The existing backend `AiService` now emits only fixed server-side reason codes: `missing_key`, `daily_limit`, `concurrency_limit`, `timeout`, `empty_response`, `provider_failure`. A provider exception's numeric HTTP status is included only when it is an integer between 400 and 599. No exception message, stack, payload, API key, prompt, answer, viewer ID/IP or configuration value is logged. The public GraphQL response, model choice, request parameters, retry count, limits, resolver/auth/CORS rules and Nestar architecture remain unchanged. No new dependencies or fallback models.

Regression coverage verifies distinct failure reasons, provider statuses 400/401/402/403/404/429/500/503, invalid/untrusted status values, unchanged public failures and absence of sensitive sentinel strings in logs. All 34 AI tests, both backend TypeScript checks and the local Nest production build passed.

This corrects the known diagnostic blind spot. It is not a confirmed repair of the production outage; that requires the running container's configuration/provider evidence below. The patch has not been deployed.

## Read-only VPS command — works with the current deployment

Run manually over the user's SSH session:

```bash
cd /opt/anorcar
docker exec -i anorcar-api node <<'NODE'
const fs = require('fs');
let file = {};
if (fs.existsSync('.env')) file = require('dotenv').parse(fs.readFileSync('.env'));
const value = name => process.env[name] ?? file[name] ?? '';
const key = value('GEMINI_API_KEY').trim();
const model = value('GEMINI_MODEL').trim() || 'gemini-3.5-flash-lite';
const validModel = /^gemini-[a-z0-9.-]*flash(?:-lite)?(?:-[a-z0-9.-]+)?$/.test(model);
console.log({
  workingDirectory: process.cwd(),
  environmentKeyPresent: Boolean(process.env.GEMINI_API_KEY?.trim()),
  envFileKeyPresent: Boolean(file.GEMINI_API_KEY?.trim()),
  model: validModel ? model : '[invalid model format]'
});
(async () => {
  if (!key || !validModel) return;
  try {
    const r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model),
      { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(15000) }
    );
    console.log({ modelMetadataHTTP: r.status });
  } catch {
    console.log({ modelMetadataRequestFailed: true });
  }
})().catch(() => console.log({ diagnosticFailed: true }));
NODE
```

Share only this command's boolean/model/status output. It reads environment/configuration and performs a GET for model metadata; it does not generate content, modify files or restart services. The API key is sent only to Google's HTTPS API in a header and is never printed.

Interpretation: both key booleans false means no key was found through these configuration sources in the container working directory. Metadata HTTP 200 confirms this metadata request succeeded, **not** that generation, billing, quota, application budgets or generation parameters work. 400/401/403/404 require further investigation; a numeric status alone does not prove a specific key/model/restriction cause. A failed metadata request can be DNS/network/TLS/timeout and is not proof of a bad key. The fresh diagnostic process may differ from a long-running app if its `.env` was edited after startup; do not change/restart production merely to test a guess.

Do not share `docker inspect` environment dumps, `docker compose config`, `.env` contents or unfiltered logs; they can contain unrelated secrets. After a separately approved deployment of the safe logging patch, the following read-only command extracts only its bounded diagnostic fields:

```bash
docker logs --since 30m anorcar-api 2>&1 \
  | grep -Eo 'AI_FAILURE reason=(missing_key|daily_limit|concurrency_limit|timeout|empty_response|provider_failure)( status=[45][0-9]{2})?'
```

No output from that command on the **current unpatched** image is expected and is not evidence of health.

Reference: Google's [model metadata GET](https://ai.google.dev/api/models#method:-models.get) and [Gemini troubleshooting guide](https://ai.google.dev/gemini-api/docs/troubleshooting). Production model/secret/Compose changes remain pending evidence and explicit deployment approval.
