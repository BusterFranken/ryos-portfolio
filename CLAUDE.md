# Project: ryos-portfolio

A personal portfolio built as a retro web OS, forked from ryOS (github.com/ryokun6/ryos).
Each app/window is one of my projects. Visitors can switch the OS theme
(Mac OS X Aqua ⟷ Windows XP). Two projects run live inside iframe windows.
A few Easter eggs. Apple-style desktop icons.

## Commands
- Install:  `bun install`
- Dev:      `bun dev`
- Build:    `bun run build`
- Tests:    `bun run test:unit`

(Confirm exact script names in `package.json`; upstream uses Bun.)

## Stack
React 19 · TypeScript · Tailwind CSS · Zustand (state) · IndexedDB (virtual file system) · Vite · Bun runtime.
License: **AGPL-3.0** (inherited from upstream) — keep source public, credit ryOS.

## Architecture
The detailed map lives in `docs/ARCHITECTURE.md` (verified against this repo). Read it
before any structural change. Confirmed pointers:
- App registry:   `src/config/appRegistry.tsx` (entries) + `src/config/appRegistryData.ts` (`appIds`/`AppId`)
- App contract:   `src/apps/base/types.ts` (`AppProps`, `BaseApp`)
- App modules:    `src/apps/<id>/` — **template to copy: `src/apps/minesweeper/`** (self-contained, 4 files)
- Window manager: instances live in `src/stores/useAppStore.ts`; rendered by `src/apps/base/app-manager/` + `src/components/layout/window-frame/WindowFrame.tsx`
- Themes:         `src/themes/` (ids: `macosx`, `system7`, `xp`, `win98`); **default = `DEFAULT_OS_THEME_ID` in `src/themes/index.ts:21`**
- Theme switch:   active theme in `src/stores/useThemeStore.ts` (`current`, localStorage `ryos:theme`); UI = Appearance pane in Control Panels (`src/apps/control-panels/components/control-panels-app/AppearancePaneContent.tsx`)
- Iframe render:  `src/apps/internet-explorer/components/internet-explorer-app/InternetExplorerContentPane.tsx:125` (reuse this `<iframe>`+overlay for project windows)
- State stores:   `src/stores/` (Zustand, one per app)
- Static assets/icons: `public/icons/<theme>/` (`default` is the fallback; run `bun run generate:icons` after adding)
- Backend (NOT in the static SPA): repo-root `api/` + `scripts/api-standalone-server.ts`. Note: there is **no `src-tauri/`** in this fork (only `electron/`).

## Conventions
- Use the simplest approach that works. No premature abstraction (YAGNI).
- A new app/window MUST register through the existing app-registry pattern — never hardcode it into the desktop.
- Match the file layout and naming of existing apps; copy the closest existing app as a template.
- Every new app/component gets a test (red → green → refactor).
- Keep the build deployable as a static Vite SPA at all times.

## Do NOT touch / actively removing
We are stripping this to a client-only portfolio with **no backend and no API keys**.
Do not extend these — they are being DISABLED (see `docs/STRIP_LIST.md`):
- AI assistant (Ryo) and tool calling
- Chats / chat rooms / voice / realtime (Pusher, Redis)
- Cloud Sync
- Object storage (Vercel Blob / S3)
- Electron and Tauri desktop shells

**One approved backend exception:** `api/spotify-recent.ts` (Vercel Edge Function)
serves Buster's recently-played Spotify feed for the iPod. Secrets live in Vercel
env vars only (`docs/SPOTIFY_SETUP.md`). Keep the rest of the app static.

## Gotchas
- OS switch = a value in the theme Zustand store + the **Appearance** panel in the **Control Panels** app. Set the initial/default theme there.
- iframes: target sites must allow framing (`X-Frame-Options` / CSP `frame-ancestors`), or fall back to a static preview + "open in new tab" button.
- **Icons — two kinds, handled differently:** the OS chrome (window buttons, menu bar, Start button, default app icons) ships with ryOS's themes — nothing to download. Only the **project** icons need sourcing: grab Apple-style PNGs from macosicons.com **before** building Project windows (see Phase 3.5), keep them ≥512px in `public/icons/projects/`, and check each icon's license/attribution.
- Expect console errors from disabled backend features during dev until they're fully removed.
- After removing any subsystem, run `bun run build` and `bun run test:unit` before committing.

## Workflow
- Explore in plan mode before editing. Plan multi-file changes before coding.
- Commit early and often; one logical change per commit.
- Update this file as conventions emerge (type `#` in Claude Code to quick-add a line).
