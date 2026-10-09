# solidarity_overthrow - patch package

Generated because the GitHub connector only has read access right now (every
write attempt returned `403 Resource not accessible by integration`). These
are the actual patched files, ready to drop into the repo once you have a
session with proper git/write access. Paths below mirror the repo exactly.

## How to apply

From the repo root, copy each file in this package to the same path, then:

```bash
git add -A
git commit -m "Fix city visual sync, chat double-init, coupPlanner wiring; replace GitHub OAuth with local accounts; dedup city roster; add missing leaderboard/admin panels"
git push
```

Then apply the new D1 migration (only needs to run once, against your real
database):

```bash
npx wrangler d1 execute solidarity-leaderboard --file=migrations/0002_users.sql
```

After deploying, register an account in the app once, then promote it to
admin directly in D1:

```bash
npx wrangler d1 execute solidarity-leaderboard --command "UPDATE users SET is_admin = 1 WHERE username = 'yourname';"
```

**Delete `src/js/additionalCities.js` after verifying the merge** - every
city from it is now folded into `src/js/globalCities.js` (see below), so the
old file is dead weight. Nothing imports it either before or after this
patch, so deleting it is safe but not urgent.

## Files in this package, and what changed in each

### Bug fixes (Phase 1 from the checklist)
- **`src/js/cityInteractions.js`** - `updateCityVisuals(city)` was passing
  the whole city object instead of `city.name`; the lookup silently failed
  so marker color/sidebar never refreshed after a direct city action. Fixed.
  Also added `refreshAllCityVisuals()` (exported) for the save/load fix
  below, and made the marker click handler look up current city data by
  name each click instead of closing over a stale object reference.
- **`README.md`** - IPI description corrected to match the actual game
  logic/UI/tutorial (low IPI = win), removed GitHub OAuth references, added
  the coup-planning win condition and setup steps for the new D1 migration.
- **`src/js/chat-client.js`** - `initializeChat()` had no guard against
  being called twice, and it *was* being called twice (once from `auth.js`
  via a confirmed session, once from `main_new.js` off a possibly-stale
  `localStorage` value) - meaning every logged-in user on a repeat page
  load got two live WebSockets, sent every chat message twice, and saw
  every incoming message rendered twice. Now guarded, and also only
  attaches the Enter-to-send keydown listener once per input element.
- **`src/js/saveLoad.js`** - loading a save only ever updated the stats
  panel numbers; map markers, their colors, and their click-popup data all
  stayed on pre-load state because `placeStaticMarker()`'s closures pointed
  at the old (pre-load) city objects. Now calls the new
  `refreshAllCityVisuals()` after every load.
- **`src/js/gameLogic.js`** - removed a dead no-op conditional block in
  `checkGameState()` that duplicated the coup-victory condition check but
  did nothing with the result (the real check lives in
  `coupPlanner.executeCoup()`). Also now resets any in-progress coup plan
  on `restartGame()` (previously leftover plan state could bleed into a new
  playthrough), and gives a clearer toast when a score submission fails
  specifically because the player isn't logged in, vs. a real server error.

### Reviving orphaned code (Phase 4-5 from the checklist)
- **`src/js/coupPlanner.js`** - this ~20KB subsystem (the entire
  "Revolutionary Victory" win path) was never initialized anywhere, so the
  "Plan Revolution" button never appeared. Even if it had been:
  - `resetCoupPlan()` called `updateGlobalMetrics()`, which was never
    imported in this file - a guaranteed `ReferenceError` on every coup
    win, loss, exposure, or cancellation. Fixed with a proper import.
  - The panel's action buttons used inline `onclick="coupPlanner.X()"`
    HTML attributes, which require a `window.coupPlanner` global that
    never existed (this is a plain ES module export) - every click would
    have thrown "coupPlanner is not defined". Replaced with real
    `addEventListener` calls, matching the pattern used elsewhere in the
    same file.
  - Added `resetPlan` to the public API so `gameLogic.restartGame()` can
    clear it.
  - `main_new.js` now imports `coupPlanner` and calls `.initialize()`.
- **`src/js/mapUtilities.js`** - `addResetViewButton()` and
  `setupOfflineStorage()` were both fully written but never exported or
  called from anywhere. Now exported and wired up from `main_new.js`. Note:
  `setupOfflineStorage()` only *initializes* the IndexedDB store - actually
  routing weather/location fetches through it as a cache is a follow-up,
  not something this patch adds.

### Auth rewrite (Phase 2 from the checklist)
GitHub OAuth is fully replaced with local username/password accounts.
- **`migrations/0002_users.sql`** (new) - `users` table: id, username,
  password_hash, salt, is_admin, created_at.
- **`src/workers/authHandlers.js`** - rewritten. Passwords are hashed with
  PBKDF2 (100,000 iterations, SHA-256, random 16-byte salt per user) via
  the Web Crypto API already available in the Workers runtime - no
  third-party auth library or dependency added. `/api/register` and
  `/api/login` are now POST JSON endpoints; `/api/me` and `/api/logout`
  keep their old shape (sessions still live in the same `SESSIONS` KV
  namespace, unchanged).
- **`_worker.js`** - routes updated: `/api/auth/callback` removed,
  `/api/register` added, `/api/login` now points at the new handler.
- **`src/js/auth.js`** - rewritten to submit the login/register forms via
  `fetch()` instead of redirecting to GitHub, and to drive the new
  logged-in/logged-out DOM structure (see `index.html` below).
- **`index.html`** - the old "Login with GitHub" link is replaced with
  actual login/register `<form>` elements (toggle between them in the same
  panel), following the existing `.control-block`/`.control-panel`
  pattern used by every other control.

### Missing frontend components (also Phase 3 from the checklist, plus one
extra bug found while building it)
- **Admin panel HTML was completely absent.** `adminPanel.js` expected
  `[data-target="admin-panel"]` and `#admin-chat-users`; `auth.js` expected
  `#admin-controls` to unhide. None of these existed in `index.html`, so
  the entire moderation UI (view chat sessions, unmute users) was
  unreachable for the site's actual admin account - and worse, the missing
  `#admin-controls` element made `auth.js` throw on the `.style.display`
  line for any admin login, aborting before `initializeAdminPanel()` could
  even run. Added the full control block, hidden by default, shown by
  `auth.js` once a session confirms `isAdmin: true`.
- **Leaderboard panel HTML was also completely absent - this one was
  found while building the admin panel fix, not caught in the earlier
  review.** `uiControls.js`'s `initializeLeaderboard()` did
  `document.querySelector('.control-toggle[data-target="leaderboard-panel"]').addEventListener(...)`
  with **no null-check**, and there was no `leaderboard-panel` control
  block or `#leaderboard-list` element anywhere in `index.html`. Since
  `initializeLeaderboard()` is called synchronously from inside `auth.js`'s
  `checkUserSession()` try block (right before the admin-controls check),
  every logged-in user triggered an uncaught `TypeError` there - which
  silently aborted the rest of that try block. In practice this meant the
  admin-controls bug above was actually *unreachable* until this one was
  fixed first, since execution never got that far. Added the full
  leaderboard control block to `index.html`, and added a defensive
  null-check in `uiControls.js` itself so this class of bug can't silently
  recur if the HTML ever drifts from the JS again.
- **`src/css/main.css`** - added styling for the coup-planning panel,
  selection dialogs, cell lists, execute/cancel buttons, the admin panel's
  user list and mute/unmute badges, and the new auth forms - none of this
  had any CSS before, so even with every JS bug above fixed, the coup panel
  in particular would have rendered as an unstyled white block anchored at
  the top of the page.
- **Also found and fixed in `main.css` while working on this: mobile view
  had `#user-profile-controls { display: none; }`, which hid the entire
  login control on phones - mobile users had no visible way to log in at
  all, independent of anything else in this patch. Changed to `display:
  block` to match every other control on mobile.**

### City roster dedup and merge (Phase 6 from the checklist)
- **`src/js/globalCities.js`** - merged with `src/js/additionalCities.js`
  programmatically (see the merge script output below for exact numbers).
  309 original cities + 63 from the orphaned file, 16 exact-name collisions
  found and resolved by keeping `globalCities.js`'s values (it's the
  dataset actually tuned for the live game), 47 non-colliding cities
  appended - mostly better coverage of Russia, China, Central Asia, Canada,
  Australia, and Mongolia. **356 total cities** in the merged file.
  - Collisions dropped from `additionalCities.js`: Toronto, Vancouver,
    Montreal, Moscow, Warsaw, Bangalore, Kolkata, Stockholm, Oslo,
    Helsinki, Tehran, Riyadh, Sydney, Ottawa, Tokyo, Seoul.
  - `additionalCities.js` itself is left in place but is now fully
    redundant - see the delete note above.

## Not included in this package
- Rate limiting and server-side score validation on
  `/api/leaderboard/submit`, and re-checking `isAdmin` per WebSocket
  message rather than baking it in at connect time - these were flagged
  earlier in the conversation as real gaps in the Cloudflare Worker, but
  are separate from the frontend/game-logic work this package covers and
  weren't part of what got prioritized to fix in this pass.
- Actually routing weather/location fetches through the newly-wired-up
  IndexedDB cache in `mapUtilities.js` (the store now initializes, but
  `fetchAndIntegrateWeather()` in `cityInteractions.js` still always hits
  the network directly).
