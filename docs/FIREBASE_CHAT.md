# Firebase Live Chat integration — 2026-10-13

Private customer-to-agent messaging is added to the existing Live Chat panel. Pages Router, Apollo, JWT login/signup, MUI/SCSS, community WebSocket chat and the separate Gemini assistant are preserved. No backend code, MongoDB data, dependencies, commits or deployments were changed.

## Files

Created: `apollo/user/firebaseChat.ts`, `libs/firebase/client.ts`, `libs/hooks/useFirebaseChat.ts`, `libs/components/FirebaseChat.tsx`, `.env.example`, `scripts/check-firebase-chat.cjs`, this report and `docs/FIREBASE_CHAT_COMPLETED.md`.

Modified: `apollo/client.ts` (opt-in inline error handling after existing refresh/retry), `libs/auth/session.ts` (Firebase teardown on session replacement), `libs/components/Chat.tsx`, `libs/components/SupportChat.tsx`, `pages/agent/detail.tsx`, `scss/support-chat.scss`, `public/locales/{en,kr,ru}/common.json`, `scripts/check-auth-session.cjs`, `scripts/check-graphql-contract.cjs`, `scripts/qa-ai-assistant.cjs` (explicit community-mode selection and optional screenshot directory), `package.json` (chat test command). Browser regression previews are in `docs/screenshots/firebase-regression/`. Backend handoff belongs in sibling `anorcar/docs/COMPLETED_TASKS.md`; neither repository has `docs/ai`.

## Initialization and configuration

The existing Firebase 13 dependency is reused. A named `anorcar-chat` app is initialized once, lazily in browser effects. `getAuth` and `getDatabase` never run during SSR. Auth persistence is in memory, including Firebase ID tokens; custom tokens are not stored. See [Firebase persistence documentation](https://firebase.google.com/docs/auth/web/auth-state-persistence).

Copy the public Web app config from Firebase Console into the frontend environment and restart/rebuild Next.js:

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=<public Web app API key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=anorcar-chat.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=anorcar-chat
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://anorcar-chat-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_APP_ID=<Web app ID>
```

These are public application identifiers, not Admin credentials. No service account/private key belongs in frontend code or environment. At final verification all five required variables were present/nonempty in ignored `.env.local`; values were neither printed nor changed. Real Firebase sign-in still needs manual verification with an authenticated account and reachable backend.

## Authentication and lifecycle

Only ACTIVE USER/AGENT sessions enable private chat. The existing authenticated Apollo client calls the no-argument `createFirebaseChatToken` mutation with no-cache policy. Its existing JWT refresh flow remains. `signInWithCustomToken` exchanges the returned string. The resulting Firebase UID must match the canonical lowercase ANORCAR member ID; `anorcarChat` and `chatExpiresAt` claims are checked before listeners start.

The hook renews through the backend one minute before the fixed 15-minute grant expires, reauthenticates, and replaces the expiry timer. Firebase ID-token auto-refresh cannot extend the grant. Renewal refusal/errors stop listeners, clear chat data, disconnect the database and sign out; Retry explicitly starts a new attempt. An expiry deadline plus visibility checks prevent a suspended tab from continuing with an expired grant. Auth work is serialized and late async responses are ignored using session/selection generations.

Session replacement dispatches `anorcar:session-changing`, stops listeners immediately and awaits Firebase sign-out. Logout, account changes, unmount and closing/switching away from private chat clean up all listeners. Displayed data is gated to the current account. Database connection state disables sends offline and reports reconnecting; Firebase reconnects existing subscriptions when connectivity returns. Pending network writes wait for server acknowledgement; duplicate submissions are locked.

**Backend limitation:** existing grants cannot be revoked immediately when an account is blocked or its role changes elsewhere. Already-issued access may remain valid until the 15-minute grant expires. Frontend local logout/sign-out is implemented; global immediate revocation is not.

## Conversations and messages

Contracts were checked in backend resolver/DTO/service, rules and `anorcar/docs/FIREBASE_CHAT.md`:

- `createFirebaseChatToken: String!` takes no inputs.
- `createFirebaseConversation(input: FirebaseConversationInput!)` accepts only `{agentId}` and returns `conversationId customerId agentId createdAt`.
- `getFirebaseConversation(conversationId: String!)` returns the same fields after backend membership/current-role checks.

Customers select an agent from a paged existing `getAgents` query or click Live Chat on an agent profile. Backend creation retrieves the deterministic existing customer/agent thread or creates it. Agents open existing threads from their own inbox. Selection verifies authorization with `getFirebaseConversation` before subscribing to messages. Inbox discovery uses only `userConversations/{authenticatedUid}`; no new backend capability is needed.

The frontend reads the current user's conversation index (small metadata) and subscribes to one latest message per indexed thread for previews. Counterparts are shown using their member IDs; no private profile data is copied into Firebase. No server unread/read receipts, typing presence, attachments, editing or deletion are invented. The existing connection counter continues to represent WebSocket connections only in Community chat.

Messages use `orderByChild('createdAt')` and `limitToLast(30)`. Older pages use `endBefore(timestamp, messageId)` and `limitToLast(30)`; ties and overlapping pages are deduplicated by push ID and sorted by timestamp/ID. Loaded older messages stay in memory while the recent window moves. Scroll follows messages only near the bottom; older-page loading restores the previous scroll position. See [Firebase list queries](https://firebase.google.com/docs/database/web/lists-of-data).

Each append uses `push()` and exactly `{senderId: auth.currentUser.uid, text: trimmedText, createdAt: serverTimestamp()}`. Blank and over-2000-character messages are rejected; the composer limits input, disables unauthenticated/disconnected submissions and preserves text after failure. Permission denials stop access. All text is rendered as escaped React text. Clients never write metadata, participants or membership indexes.

## Verification and manual checks

`yarn.cmd test:chat` executes the real hook with isolated React/GraphQL/Firebase fixtures: UID mismatch, renewal denial, listener cleanup, account change, inbox/message subscription, pagination/timestamp ties, duplicate merging, message validation and server timestamp payload. `yarn.cmd test:auth` verifies existing JWT/refresh/logout behavior. `yarn.cmd check:graphql` now includes the four new documents. Typecheck/build results are recorded in `FIREBASE_CHAT_COMPLETED.md`.

Live schema validation could not connect to `http://localhost:3007/graphql` during this session, including a final retry. No real Firebase authentication or database writes were performed. Published-rule status follows the user's supplied deployment information; backend handoff still says undeployed. No rules were deployed or altered here. The isolated browser AI/community suite passed at 320/390/768/1440px, EN/KR/RU, with mocked provider/socket responses and no runtime exceptions; mobile community screenshot was inspected. Private live conversation visual QA remains a manual acceptance check.

Manual acceptance after public Web config and backend availability:

1. Run `yarn.cmd check:graphql`; confirm all existing/new documents validate against the live schema.
2. In two separate browser profiles, log in as an ACTIVE customer and ACTIVE agent. Verify ordinary login and silent JWT refresh still work.
3. Customer: open agent profile > Live Chat, or select the agent in the panel. Agent: open Live Chat > Agent chat and select the matching conversation.
4. Exchange messages in both directions; verify sender/timestamp, previews, Unicode, 2000-character limit and blank rejection. Refresh both browsers and reopen the same persisted conversation.
5. Send enough messages to exceed 30; load older history and confirm order, no duplicates and preserved scroll position. Scroll upward while new messages arrive and confirm the viewport stays put.
6. With a third account, verify another user's index, conversation and message paths are denied under the deployed rules. Verify metadata/membership writes and edits/deletes remain denied.
7. Stay connected past 15 minutes and observe backend renewal. Refuse renewal with a controlled fixture/test account; ensure messages disappear, listeners stop and sending is disabled. Resume a suspended tab after expiry.
8. Toggle network offline/online, verify reconnect status, disabled sends and message reconciliation. Check logout/account switching in the same tab and across tabs without any old messages appearing.
9. Verify desktop/mobile and EN/KR/RU; verify Community chat WebSocket behavior, its connection counter, Gemini responses and mutually exclusive AI/live panels.

No automatic commit or deployment.
