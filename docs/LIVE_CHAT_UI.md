# Live Chat UI — 2026-10-13

- Refreshed the existing shared Live Chat panel with ANORCAR colors, a compact header, sender names, readable message bubbles, avatars and a focused composer. Existing GraphQL/authentication and WebSocket send protocol remain.
- Online count uses the server's `info.totalClients`: show 0–30 directly and `30+` above 30. Full count remains in the accessible label and tooltip. Show a dash until server information arrives; removed the fabricated initial 4.
- This counts connections, not unique accounts. Backend connection limits and five-message history are unchanged.
- WebSocket reception uses a cleaned-up event listener and functional state updates, preserving rapid consecutive messages. Invalid online counts are ignored.
- EN/KR/RU labels and responsive panel sizing remain supported. The browser fixture covers online-count boundaries, rapid messages, four viewport widths and existing AI/live interaction without sending real messages.

Validation: frontend typecheck and browser fixtures passed at 320/390/768/1440px, including AI/live exclusivity, sending, keyboard behavior and KR/RU localization. Visual screenshots reviewed at 390px and 1440px. Run `node scripts/qa-ai-assistant.cjs` against the local app; set `QA_BASE_URL` for an alternate port (this run used 3020 because port 3000 returned 404).
