# Signup/login Apollo development overlay fix — 2026-10-13

Reported symptom: after USER signup, Next.js shows `TypeError: Cannot convert object to primitive value`, with `console.warn`, Apollo `warnAboutDataLoss` and `writeToStore` in the stack.

The same stack/error is reproduced with the installed Apollo 3.8.3 cache by replacing a cached member's nonempty `meLiked`/`meFollowed` arrays with empty arrays and formatting warning arguments using `String`, as the development overlay does. Apollo's internal records have null prototypes, so this formatting can throw. This is a cache warning that becomes a runtime error; it does not by itself establish that backend signup failed. The screenshot does not identify the exact field; the regression test demonstrates the relevant personalized-field transition.

`apollo/cache.ts` adds explicit replacement policies (`merge: false`) for `Member.meLiked`, `Member.meFollowed`, `Car.meLiked` and `BoardArticle.meLiked`. These fields reflect the current viewer; empty results must remove previous likes/follows. `apollo/client.ts` uses the reusable cache factory. No global warning suppression, library upgrade, JWT/auth/backend changes or Firebase transport changes.

`scripts/check-apollo-cache.cjs` reproduces the original error with the default cache, then verifies the fixed cache for all three entity types, empty/nonempty transitions, preserved entity identity and absence of replacement warnings. Run with `yarn.cmd test:cache`.

After restarting/reloading the frontend, repeat USER signup/login and confirm the overlay no longer appears and likes/follows reflect the current account. No real account was created in the isolated regression test.
