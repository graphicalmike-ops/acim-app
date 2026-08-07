# Technical QA Report — ACIM App (MSP)

**Date:** 2026-08-07
**Scope:** Read-only audit of `acim-app MSP` at commit `ff5e388` ("Continue reader/contents/search NativeWind migration, hide donation icon, add in-app review"), branch `main`.

## Executive summary

Overall, this codebase is in good shape and there is nothing that would stop a release build today. TypeScript compiles with **zero errors**, there are **no broken imports** left over from the recent file deletions/renames, and there are **no secrets or API keys** accidentally left in the code. The one item that genuinely needs a decision before you submit to Google Play is the "ask for a review" popup that currently fires for every single person 10 seconds after they open the app — the code comment even says this is temporary test wiring that was never swapped out for the real trigger. Everything else found is small: a couple of leftover dev-only bits of code, a few spots that don't use the app's official design system numbers, and some routine warnings a linter always produces. None of it is urgent, but it's listed below so you can decide what to tackle before or after this release.

---

## Blockers

*(Things that would break the build or corrupt user data.)*

**None found.** TypeScript compiles cleanly, no dangling imports of the deleted components, no lockfile/dependency conflicts, and the bookmarks/last-read/search storage code all fails safely (try/catch around every read and parse) rather than crashing or wiping data.

---

## Should fix before release

1. **In-app "rate this app" popup fires for every user, every time they open the app** — `app/_layout.tsx:69-76`. The code itself is labeled `// TEMPORARY (testing): fires 10s after every app open, no gating.` Right now, anyone who opens the app will see Android's "rate us" prompt 10 seconds in, on every single launch (Android does throttle how often it will actually show the dialog, but the app is still requesting it every time, which isn't the intended behavior and reads as unfinished/test code). This should either be wired to a real trigger (e.g., after finishing a lesson) or gated to "ask once, then stop asking for a long while" before shipping to real users.

2. **Two drag-handle "pill" shapes use hand-typed pixel numbers instead of the app's official design-token numbers** — `app/reader.tsx:1921-1922` and `app/reader.tsx:1989-1990` (`width: 60, height: 6`). The project's own rule (in `AGENTS.md`) says every size value under `app/` must come from the shared token list in `constants/Tokens.ts`, and if no existing token matches exactly, someone should be asked before leaving a raw number in. These two spots have a raw `60` and `6` with no comment explaining why they're an exception (elsewhere in this same file, a similar situation *is* explained with a comment — see `reader.tsx:2000-2004` — so this looks like an oversight, not a deliberate choice). Not a visible bug, just a quiet rule violation worth a quick decision (snap to nearest token or approve as a one-off).

3. **App version number wasn't bumped for this round of changes** — `app.json:5` still reads `"version": "1.0.1"`, the same version already live on Google Play (per project notes, released as build 10). The Android build number (`versionCode`) is managed remotely by EAS (`eas.json` has `"appVersionSource": "remote"` with `"autoIncrement": true` on production builds), so the *build number* Google Play sees should auto-increment fine and this alone won't block a submission. However, the user-facing version name (the "1.0.1" people would see) hasn't moved, which is worth a deliberate bump (e.g., to 1.1.0) so this MSP release is distinguishable from the original launch. Worth double-checking the actual next build number on the EAS dashboard before submitting, since `app.json`'s local `"versionCode": 2` is stale/unused under the remote-source setting and could be confusing to read.

---

## Nice to have / cleanup

1. **Dead code: `handleResetAll` function is now unreachable** — `app/home.tsx:57-73`. This was a dev-only "wipe all saved data" helper. Its only trigger was a donation/tip icon button that was just commented out (`app/home.tsx:120-125`). Confirmed this is the *only* place it was wired to — no other button or menu calls it. Since it's dead, ESLint already flags it (`'handleResetAll' is assigned a value but never used`). Fine to leave for now since it's a useful dev tool to keep around commented-in-place, just flagging it's officially unreachable code today.

2. **Two commented-out JSX blocks left in `app/home.tsx`** — lines 98-104 (old top bar with tip/theme-toggle buttons) and lines 120-125 (donation/tip icon in the hero card). Both are intentionally commented out per the latest commit message ("hide donation icon... may be restored later"), not accidental leftovers — just noting they're there per the audit checklist.

3. **Two unused imports flagged by the linter** in `app/home.tsx`: `Pressable` (line 2) and `TipLightIcon` (line 9) — both are leftovers from the now-commented-out donation button code above.

4. **Leftover NativeWind test screen still in the app** — `app/_nw-test.tsx`. This was the throwaway screen used to verify NativeWind rendering worked when it was first set up (per `MSP-PLAN.md` Step 1's verification gate). It's not reachable through normal navigation (files starting with `_` are excluded from Expo Router's routes), so it's harmless, but it's still shipped inside the app bundle. Safe to delete once you're sure you won't need it for future NativeWind debugging.

5. **`@react-native-menu/menu` package is now fully unused** — confirmed via `package.json` vs. actual imports: `components/UIMenu.tsx` no longer imports anything from this package (it now uses `@rn-primitives/dropdown-menu` instead). This matches what `MSP-PLAN.md` already flagged as a planned cleanup item ("remove from package.json in this cleanup pass if it's still unused by then") — just confirming here that condition is now true. Removing it would also shrink the app and drop a permission it likely contributes (see item 8 below).

6. **`@expo-google-fonts/merriweather-sans` is installed but never imported anywhere** — also a previously-known, already-planned cleanup item per `MSP-PLAN.md` ("Typography actually uses Noto Sans"). Confirmed still true; safe to drop from `package.json` whenever convenient.

7. **ESLint warnings (13 total, 0 errors)** — none are urgent, listed for the punch list:
   - `app/home.tsx:2` — unused `Pressable` import (see #3 above)
   - `app/home.tsx:9` — unused `TipLightIcon` import (see #3 above)
   - `app/home.tsx:57` — unused `handleResetAll` (see #1 above)
   - `app/index.tsx:34` — `useEffect` missing `opacity` in its dependency list (harmless here — `opacity` is a stable ref value that never changes identity, so this won't cause a bug, just a lint nag)
   - `app/reader.tsx:645` — `useCallback` missing `setNavBarHidden` dependency
   - `app/reader.tsx:1131` and `app/reader.tsx:1168` — `useMemo` missing `bookId` dependency (worth a quick look since `bookId` is a value that does change when the user navigates between books — if a stale `bookId` value ever leaked into these memoized calculations it could show wrong content, though nothing observed in this audit suggests it's currently causing an actual bug)
   - `components/AppScrollView.tsx:201,206,211` and `components/AppSectionList.tsx:46,51,56` — `useCallback` missing `thumb` dependency (repeated pattern across both files, likely intentional given they're companion scroll components, but worth a second look together)

8. **Android permissions worth a second look** — a previously-generated (and possibly stale, since it wasn't regenerated after the latest code changes) copy of the Android manifest under the gitignored `android/` folder declares `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, and `SYSTEM_ALERT_WINDOW` permissions in addition to the expected `INTERNET`/`VIBRATE`. Nothing in the current `app.json` plugin list or app code obviously asks for storage or "draw over other apps" access — `SYSTEM_ALERT_WINDOW` in particular is a permission commonly pulled in automatically by menu/overlay native libraries, and lines up with the now-unused `@react-native-menu/menu` package (see #5). Since this isn't the authoritative source (it's prebuild output, not source config), it's worth re-checking with a fresh `expo prebuild` or on the next real EAS build rather than treating this as confirmed — but if it still shows up after removing the unused package, it's worth investigating why the app is requesting storage/overlay access at all, since Play Store review can flag permissions that don't match visible app functionality.

9. **No TODO/FIXME/XXX/HACK comments found anywhere in `app/`, `components/`, `utils/`, `constants/`, `hooks/`, or `lib/`** — nothing outstanding on that front.

10. **No console.log/warn/error or debugger statements found in `app/`, `utils/`, or `components/`** — the codebase is clean of debug logging noise.

11. **Design-token compliance in `app/` is otherwise excellent** — apart from the two spots noted above (item 2), a full scan of `app/*.tsx` found no hex colors, no `rgba()`/`rgb()` literals, and no other raw padding/margin/gap/border/font-size numbers outside the token system. (Per your instructions, raw values inside `components/` were intentionally not flagged — that's expected mid-redesign.)

12. **`metro.config.js` still correctly pins `inlineRem: 16`** in the `withNativeWind()` call (line with `module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });`) — confirmed no regression on this known gotcha. Both required `assetExts.push('db')` and `assetExts.push('wasm')` lines are also still present.

---

## Details on checks that came back clean

- **TypeScript** (`npx tsc --noEmit -p .`): 0 errors, 0 warnings, across the whole project.
- **Broken imports**: grepped the whole repo for `BookSectionHeading`, `NoteInput`, `SavedItemRow`, and `SearchBar` (the four files deleted in the last commit) — every remaining match is a code comment referencing the old filename for context (e.g., "replaces components/SearchBar.tsx"), not an actual import. No dangling imports anywhere.
- **Secrets/keys scan**: no API keys, tokens, or credentials found hardcoded anywhere in source.
- **Tracked secret-shaped files**: no `.env`, keystore, `.jks`, `google-services.json`, or similar files are tracked in git.
- **package.json health**: no duplicate/conflicting versions of React, React DOM, or React Native in the lockfile (all single-version: React 19.1.0, RN 0.81.5). `expo-store-review` (recently added) is present and correctly wired to `utils/storeReview.ts` → `app/_layout.tsx`. `better-sqlite3` (devDependency) is legitimately used by `scripts/build-search-index.js`, not dead weight.
- **Bookmarks/last-read/search storage code** (`utils/bookmarks.tsx`, `utils/lastRead.ts`, `utils/search.ts`): every `AsyncStorage` read and `JSON.parse` call is wrapped in try/catch and fails soft (returns `null`/empty rather than throwing), consistent with the project's hard constraint to never break existing users' saved verses. No migration-shape issues spotted; this matches the documented existing pattern of "old records with missing fields degrade gracefully."
- **List rendering**: spot-checked `.map()` calls across `app/home.tsx`, `app/contents.tsx`, `app/bookmarks.tsx`, `app/search.tsx` — all have proper `key` props; one spot in `contents.tsx` that looked unusual (mapping to plain objects instead of JSX) turned out to be an intentional data-array pattern consumed internally by `IndexAccordionItem`, not a bug.
- **useEffect cleanup**: spot-checked the larger effects in `app/reader.tsx` (hardware back-button listener, drag/pan responders, save-last-read effect) and `app/_layout.tsx`/`app/search.tsx` (timers, async fetch with cancellation flag) — all have proper cleanup/cancellation handling.
