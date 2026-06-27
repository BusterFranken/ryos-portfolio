# ryOS Architecture Map

> Status: **MAPPED** — verified against this repo on 2026-06-26 by reading the actual
> files. Every file:line below was confirmed in this clone (not upstream). Line numbers
> drift as files change; treat them as "look here", and re-grep the named symbol if a
> reference looks off.

## 1. Mental model
The app is a single-page "desktop OS" shell. `src/main.tsx` → `src/App.tsx` mounts an
`AppManager` (`src/apps/base/app-manager/`) that is the **window manager**: every "app" is
a lazy-loaded React component declared once in a central **registry**
(`src/config/appRegistry.tsx`) and opened as one or more **window instances** tracked in a
Zustand store (`src/stores/useAppStore.ts`). A separate **theme store**
(`src/stores/useThemeStore.ts`) skins the entire UI between 4 OS looks (Mac OS X Aqua,
System 7, Windows XP, Windows 98) by writing `data-os-*` attributes on `<html>` that drive
the CSS in `src/styles/themes.css`. For this portfolio, each "app" becomes one project
window, and two project windows are just iframes (see §7).

## 2. Window manager
- **Where window state is owned:** `src/stores/useAppStore.ts`. There is no separate
  "WindowManager" store — a window **is** an "app instance".
  - Per-window object: `interface AppInstance` — `src/stores/useAppStore.ts:24-33`
    (`instanceId`, `appId`, `title`, `createdAt`, `isMinimized`, `launchOrigin`, …). It
    extends `AppState` (`src/apps/base/types.ts:77-83`) which adds
    `isOpen`/`position`/`size`/`isForeground`/`initialData`.
  - Collections: `instances: Record<string, AppInstance>` (`:50`), `instanceOrder: string[]`
    ("END = TOP", `:51`), `foregroundInstanceId` (`:52`).
- **Lifecycle actions** (all in `src/stores/useAppStore.ts`):
  - Open (high-level): `launchApp` — `:639-722` (restores if minimized, reuses single-window
    apps, else creates). Create: `createAppInstance` — `:289-397` (staggers position, pulls
    default size from `getWindowConfig`).
  - Focus / raise: `bringInstanceToForeground` — `:472-507` (moves id to end of `instanceOrder`).
  - Minimize / restore: `minimizeInstance` — `:558-591` / `restoreInstance` — `:592-624`.
  - Close: `closeAppInstance` — `:432-470`.
  - Resize / move (commit): `updateInstanceWindowState` — `:509-527`.
  - z-index is **derived**, not stored: `getZIndexForInstance(id, instanceOrder)` —
    `src/apps/base/app-manager/instanceHelpers.ts:4-11`.
- **Rendering & interaction:**
  - Renderer: `AppManagerView` (`src/apps/base/app-manager/AppManagerView.tsx`) maps open
    instance ids → one `WindowFrame` each.
  - Window chrome: `WindowFrame` — `src/components/layout/window-frame/WindowFrame.tsx`.
  - Live drag/resize (decoupled from React via Framer motion values, commits to the store on
    pointer-up): `useWindowManager` — `src/hooks/useWindowManager.ts` (`handleMove` resize math
    `:279-429`, `handleEnd` commit `:431-508`).
- **Persistence:** `useAppStore` uses `persist`, localStorage key **`ryos:app-store`**
  (`src/stores/useAppStore.ts:743`), store version 6.

## 3. App registry — how an app is defined and registered
- **Where apps are registered:** `src/config/appRegistry.tsx` — the `appRegistry` object,
  `:218-565`. Each entry's lazy component is created with `createLazyComponent(...)`
  (`src/config/lazyAppComponent.tsx`), declared at `:43-171`.
- **The canonical id list / `AppId` type:** `src/config/appRegistryData.ts` — `appIds`
  array `:7-34` and `appNames` map `:57-84`. `AppId = (typeof appIds)[number]` (`:36`).
  `src/config/appIds.ts` just re-exports these.
- **A single app definition contains** (example: Finder, `appRegistry.tsx:219-231`):
  | field | type | notes |
  |---|---|---|
  | `id` | `AppId` | must exist in `appIds` |
  | `name` | string | shown in titlebar / menus (`"Finder"`) |
  | `icon` | `{ type: "image"; src }` | usually `metadata.icon` (a `/icons/default/<app>.png` path) |
  | `description` | string | one-liner |
  | `component` | lazy `ComponentType<AppProps>` | the window body |
  | `helpItems` / `metadata` | from the app's `index`/`metadata` | Help + About dialog content |
  | `windowConfig` | `WindowConstraints` | `defaultSize` (required) + optional `minSize`/`maxSize`/`mobileDefaultSize`/`mobileSquare` |
  - `WindowConstraints` / `WindowSize` types: `appRegistry.tsx:17-29`. The fallback when an
    app omits `windowConfig` is `defaultWindowConstraints` (`:32-35`, 730×475).
  - The full app contract (props an app component receives, and the `BaseApp` shape) lives in
    `src/apps/base/types.ts`: `AppProps` `:3-20`, `BaseApp` (incl. the `id` union) `:22-75`.
- **Simplest app to copy as a template: `minesweeper`** (`src/apps/minesweeper/`, 4 files).
  It exercises the *entire* standard scaffolding — `AppWindowShell`, `AppHelpAboutDialogs`,
  a menu bar, a logic hook, an `index` exporting `appMetadata` + `helpItems`, and a registry
  entry — with **zero** coupling to a Zustand store of its own, the file system, or the
  network. (Stickies needs `useStickiesStore`; Soundboard needs the VFS/audio; Photo Booth
  needs the camera — all heavier.) Its only quirk: metadata lives in `index.ts` rather than a
  separate `metadata.ts` (both patterns are valid — Soundboard/Photo Booth use `metadata.ts`).

## 4. How to add a new app/window (the recipe)
Copying **minesweeper**. Say the new app id is `myproject`.

1. **Register the id.** In `src/config/appRegistryData.ts` add `"myproject"` to the `appIds`
   array (`:7-34`) and to the `appNames` map (`:57-84`). Then add `"myproject"` to the
   `BaseApp["id"]` union in `src/apps/base/types.ts:23-49` (TypeScript will error until you do).
2. **Create the app module** `src/apps/myproject/` (copy minesweeper's 4 files, rename):
   - `index.ts` — export `appMetadata` (`name`, `version`, `creator`, `github`, `icon:
     "/icons/default/myproject.png"`) and `helpItems` (see `src/apps/minesweeper/index.ts:1-47`).
   - `components/MyProjectAppComponent.tsx` — a function component taking `AppProps`
     (`src/apps/base/types.ts:3`) that returns `<AppWindowShell …>` (the shared shell at
     `src/components/shared/AppWindowShell.tsx`) wrapping your content, plus
     `<AppHelpAboutDialogs …>` (`src/components/shared/AppHelpAboutDialogs.tsx`). Pattern:
     `src/apps/minesweeper/components/MinesweeperAppComponent.tsx:159-352`. Pass
     `windowFrameProps={{ title, onClose, isForeground, appId: "myproject", instanceId, … }}`.
   - `components/MyProjectMenuBar.tsx` — copy `MinesweeperMenuBar.tsx` (`AppMenuBarShell` +
     `AppMenuBarMenus` + `useAppMenuBarChrome("myproject")`). Keep just File ▸ Close, or add items.
   - `hooks/useMyProjectLogic.ts` — optional; only if you have state. A static/iframe project
     window may not need one.
3. **Add the registry entry** in `src/config/appRegistry.tsx`:
   - Declare the lazy component near `:43-171`:
     `const LazyMyProjectApp = createLazyComponent(() => import("@/apps/myproject/components/MyProjectAppComponent").then(m => ({ default: m.MyProjectAppComponent })), "myproject");`
   - Import its metadata/help near `:178-209`:
     `import { appMetadata as myprojectMetadata, helpItems as myprojectHelpItems } from "@/apps/myproject";`
   - Add an entry to the `appRegistry` object (`:218-565`) with `id/name/icon/description/
     component/helpItems/metadata/windowConfig` (copy minesweeper's at `:312-325`).
4. **Add the icon.** Drop `public/icons/default/myproject.png` (always — it's the fallback),
   plus optional themed variants `public/icons/macosx/myproject.png`, `.../xp/`, `.../win98/`,
   `.../system7/`. Then run `bun run generate:icons` to refresh `public/icons/manifest.json`
   (otherwise the themed variant silently falls back to default). See §6.
5. **(Optional) i18n.** Minesweeper's menu/title use translation keys (`t("apps.minesweeper.…")`,
   `getTranslatedAppName(...)`). For a quick app you can hardcode the title string and plain
   menu labels; for parity, add `apps.myproject.*` keys under `src/lib/locales/en/translation.json`.

**What you do NOT need to touch:** the desktop, dock, Apple menu, app switcher, and Spotlight
all read the registry dynamically (`getNonFinderApps`, `appRegistry.tsx:582-604`), so the new
app appears in launchers automatically. A deep-link route `/<myproject>` also works with no
extra code via the generic matcher in `src/apps/base/appRouteRegistry.ts:218-237`. **One
exception:** the Mac OS X desktop only shows a curated set of desktop icons
(`displayedApps` = ipod + applet-viewer) — `src/components/layout/desktop/useDesktop.ts:387-392`;
edit that filter if you want project icons sitting on the Aqua desktop. (Windows themes already
show every app on the desktop.) For static prod hosting, add a `/<myproject>` rewrite in
`vercel.json` (the dev server's SPA fallback handles it automatically).

## 5. Theme system (the Mac OS ⟷ Windows XP switch)
- **Where the 4 themes are defined:** `src/themes/` — one file each: `system7.ts`,
  `macosx.ts`, `xp.ts`, `win98.ts`, assembled into the `themes` map in
  `src/themes/index.ts:14-19`. **The 4 ids are `system7`, `macosx`, `xp`, `win98`**
  (`OsThemeId` type in `src/themes/types.ts`). "Mac OS X Aqua" = `macosx`; "Windows XP" = `xp`.
- **Where the active theme is stored:** Zustand store `useThemeStore`
  (`src/stores/useThemeStore.ts`), under the key **`current: OsThemeId`** (`:171`, initial
  `:458`). It persists **manually** (not via `persist` middleware) to localStorage
  **`ryos:theme`** (`THEME_KEY` `:262`, written in `setTheme` `:472`). Related keys:
  `ryos:theme:dark`, `ryos:theme:accent`, `ryos:theme:aqua-material`, `ryos:theme:system-font`.
- **Where it's switched at runtime:** the **Appearance** panel inside **Control Panels**.
  Two parallel UIs (one per chrome): `AppearancePaneContent.tsx` (Mac chrome) and
  `AppearanceTabContent.tsx` (Windows chrome), both under
  `src/apps/control-panels/components/control-panels-app/`. The theme `<Select>`'s
  `onValueChange` → `handleThemeChange` calls **`setTheme(...)`**: the "Mac OS X" option maps
  to `setTheme("macosx") + setAquaMaterial("glass")` (`AppearancePaneContent.tsx:62-63`); every
  other option maps to `setTheme(value) + setAquaMaterial("classic")` (`:65-66`). The store
  action is `useThemeStore.setTheme` (`src/stores/useThemeStore.ts:465-493`), wired through
  `src/apps/control-panels/hooks/useControlPanelsLogic.ts` (imports the store at `:25`). Theme
  option labels are built in `appearancePaneShared.tsx` (`buildThemeSelectOptions`).
- **Where to set the DEFAULT theme on first load:** **`DEFAULT_OS_THEME_ID` in
  `src/themes/index.ts:21`** (currently `"macosx"`). It is the store's initial value
  (`useThemeStore.ts:458`) and the fallback in `sanitizeStoredTheme` (`:28-33`). ⚠️ A returning
  visitor's saved `localStorage["ryos:theme"]` overrides it — `hydrate()` reads it on boot
  (`:615-624`). So "first-load default for a fresh visitor" = line 21; to force it for everyone,
  also clear/ignore the stored key.
- **How it applies:** `applyRootThemeAttributes` (`:372-410`) sets `data-os-theme` /
  `data-os-platform` / `data-os-mac-chrome` / `data-os-aqua-material` on `<html>`; CSS in
  `src/styles/themes.css` keys off those. XP/98 additionally lazy-load
  `public/css/xp-custom.css` / `public/css/98-custom.css` via `ensureLegacyCss` (`:224-259`).

## 6. Desktop & icons
- **Desktop icons:** rendered by
  `src/components/layout/desktop/DesktopIconGrid.tsx`. The app→icon path comes from
  `getAppIconPath(appId)` (`src/config/appRegistry.tsx:572-578`). Which apps show on the desktop
  is decided by `displayedApps` in `src/components/layout/desktop/useDesktop.ts:387-392` — on
  the Mac OS X theme only `ipod` + `applet-viewer`; on Windows themes, all apps (and only when
  there are no user desktop shortcuts).
- **Icon assets:** `public/icons/`, organized by **theme subfolder**: `default/` (canonical
  fallback set), `macosx/`, `system7/`, `xp/`, `win98/`, plus a generated `manifest.json`.
  Metadata stores the `default` path (e.g. `/icons/default/soundboard.png`,
  `src/apps/soundboard/metadata.ts`); at render time `ThemedIcon`
  (`src/components/shared/ThemedIcon.tsx`) re-themes it via `src/utils/icons.ts`
  (`pickIconPath` `:55-77`) — swapping `/icons/default/x.png` → `/icons/<theme>/x.png` when the
  manifest says that theme has the icon.
- **Add an Apple-style icon for a new app:** (1) put `public/icons/default/<app>.png`; (2) for
  the Aqua look add `public/icons/macosx/<app>.png` (and optionally other themes); (3) point the
  app's `metadata.icon` at the `default` path; (4) run **`bun run generate:icons`** to update the
  manifest so the macosx variant is picked up.

## 7. External web content / iframes
- **How IE renders a URL:** the actual element is in
  `src/apps/internet-explorer/components/internet-explorer-app/InternetExplorerContentPane.tsx:125-136`:
  ```tsx
  <iframe
    ref={iframeRef}
    src={finalUrl || ""}
    sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-pointer-lock"
    onLoad={handleIframeLoad}
    onError={handleIframeError}
  />
  ```
  `finalUrl` comes from the IE store/navigation logic. A separate branch
  (`:104-123`) renders **AI-generated HTML** through `HtmlPreview` instead of the live iframe —
  that branch is the backend-dependent "Time Machine" path (`/api/ie-generate`,
  `/api/iframe-check`) and is out of scope for project windows. A `!isForeground` transparent
  overlay (`:139-149`) sits over the iframe so a click focuses the **window** instead of being
  swallowed by the iframe — keep this when reusing.
- **Reuse for a "Project" iframe window:** YES, easily. The bare iframe + foreground-overlay is
  ~15 lines and needs none of IE's store/toolbar/time-machine/AI machinery. A project iframe
  window = a new app (per §4) whose component renders just that `<iframe>` with a fixed `src`
  (or a `src` taken from `initialData`), wrapped in `AppWindowShell`. Don't fork the whole IE
  app; lift the iframe snippet.
- **Where iframe sandbox/header issues surface:** the target site must permit framing
  (`X-Frame-Options` / CSP `frame-ancestors`). IE probes this server-side via
  `/api/iframe-check` (`.../time-machine-view/useTimeMachineView.ts:393,419,437`). For a static,
  backendless portfolio there's no such proxy — so for the two live project iframes, either host
  sites you control / that allow framing, or detect a blocked load (`onError` / a load-timeout)
  and fall back to a static screenshot + an "Open in new tab" link.

## 8. Client-only vs backend (what must be disabled)
- **Does it boot with NO backend env? YES.** `src/main.tsx` / `src/App.tsx` do only local work
  at boot (load local `/data/filesystem.json` + `/data/applets.json`, i18n, theme hydrate,
  analytics that swallow all failures). Every mount-time backend hook (`AirDropListener`,
  `useBackgroundChatNotifications`, auto cloud-sync) is **auth-gated** and no-ops without a
  session. Backend calls happen lazily, only when a network-bearing app opens.
- **Apps that make network calls (guard or remove for a static build):** `chats`
  (`/api/chat`, Pusher, AI), `admin` (`@/api/admin`, Redis browser), `applet-viewer` app store
  (`/api/share-applet`, `/api/applet-ai`), `maps` (`/api/mapkit-token` + `VITE_MAPKIT_TOKEN`),
  `ipod` (Apple Music + `/api/songs`, `VITE_MUSICKIT_DEVELOPER_TOKEN`), `tv`
  (`/api/tv/create-channel`), `internet-explorer` **AI-gen path only** (`/api/ie-generate`),
  `terminal` (`/api/auth/login` + AI delegation to chats).
- **Purely client-side (safe to keep as-is):** `finder`, `textedit`, `paint`, `minesweeper`,
  `soundboard`, `stickies`, `photo-booth`, `synth`, `winamp`, `contacts`, `calendar`, `books`,
  `infinite-mac`, `pc` (latter two stream external emulator assets, no ryOS API). The IE **URL /
  iframe rendering** itself is client-side (only its AI generation is backend).
- **Client env vars** (all read via `import.meta.env`, all optional — features degrade if unset):
  `VITE_MAPKIT_TOKEN` (`src/apps/maps/hooks/useMapKit.ts:60`),
  `VITE_MUSICKIT_DEVELOPER_TOKEN` (`src/hooks/useMusicKit.ts:69`), and the realtime/origin set
  in `src/utils/runtimeConfig.ts` (`VITE_PUSHER_KEY` `:143`, `VITE_PUSHER_CLUSTER` `:145`,
  `VITE_REALTIME_PROVIDER` `:53`, `VITE_APP_PUBLIC_ORIGIN` `:76`, `VITE_VERCEL_ENV` `:63`).
  ⚠️ `runtimeConfig.ts` has **hardcoded prod fallbacks** (`DEFAULT_PUBLIC_ORIGIN =
  "https://os.ryo.lu"` `:22`, a default Pusher key `:26`) — so with no env the client still
  points at ryo.lu's backend. Neutralize these for a true no-backend fork.
- **The backend itself** lives in the repo-root **`api/`** (≈180 Vercel serverless functions)
  + `scripts/api-standalone-server.ts`. It needs Redis/Upstash (`api/_utils/redis.ts`), Pusher
  (`api/_utils/realtime.ts`), AI keys (`api/_utils/_aiModels.ts`), and Vercel Blob / S3
  (`api/_utils/storage.ts`). None of this is required to **build** the static client.
- **STRIP_LIST.md path corrections (confirmed against this repo):** there is **no `src-tauri/`**
  (only `electron/`); the "AI app" is **`chats`** (not a separate Chat app); the realtime client
  facade is `src/services/chat/ChatRealtimeService.ts` + `src/lib/pusherClient.ts`; Cloud Sync is
  `src/sync/` + `src/stores/useCloudSyncStore.ts`; the object-storage client is
  `src/utils/storageUpload.ts`. Also backend-coupled but unlisted: `admin`, `applet-viewer` store,
  `maps`, `ipod`, `tv`, analytics (`/api/analytics/events`), and the `runtimeConfig.ts` defaults.

## 9. State management
All stores are Zustand under `src/stores/`; most use `persist` → localStorage. Most-central:

| Store | Owns | Persist key |
|---|---|---|
| `useAppStore.ts` | Window/app **instances**, `instanceOrder`, foreground id, recent apps | `ryos:app-store` (`:743`) |
| `useThemeStore.ts` | Active OS theme (`current`), dark mode, accents, aqua material, font | `ryos:theme` (+ `…:dark/accent/aqua-material/system-font`) — manual writes |
| `useFilesStore.ts` | Virtual file system: path→`FileSystemItem` map, trash (content in IndexedDB) | `ryos:files` |
| `useFinderStore.ts` | Finder window instances + per-path view prefs | `ryos:finder` |
| `useDisplaySettingsStore.ts` | Wallpaper, display options, `showResizers` | `ryos:display-settings` |
| `useDockStore.ts` | Dock pinned items, scale, auto-hide, magnification | `dock-storage` |
| `useInternetExplorerStore.ts` | IE history, favorites, time-travel year, cached pages | `ryos:internet-explorer` |
| `useChatsStore.ts` | Chat rooms/messages, username/auth, AI chat state | `ryos:chats` |
| `useTextEditStore.ts` | TextEdit per-instance documents | `ryos:textedit` |
| `useIpodStore.ts` | iPod library, tracks, playlists, playback | `ryos:ipod` |

(There is one store per app — see `src/stores/`. Theme persistence is the notable exception that
bypasses the `persist` middleware and writes raw localStorage keys.)

## 10. Build & deploy
- **Build:** `bun run build` = `tsc -b && vite build` (a `prebuild` writes
  `public/version.json` first). **Output dir: `dist/`** (Vite default — `vite.config.ts` sets no
  `build.outDir`).
- **Tests:** runner is **`bun test`** (Bun's built-in, not Vitest). `bun run test:unit` runs an
  explicit list of `tests/*.test.ts`.
- **Static SPA?** Yes — no SSR anywhere; the client build is fully static. `vercel.json` provides
  SPA `rewrites` (every `/<app>` route → `/`), long-cache headers for `/icons/*` & `/fonts/*`,
  and crons. The repo-root `api/` server is needed only at **runtime** for backend features, not
  to produce `dist/`. Once §8's network apps are stripped/guarded, `dist/` deploys to any static
  host (add per-route rewrites so deep links resolve).

## 11. Fragile areas (highest churn — avoid casual edits)
From `git log --name-only -n 400` (excluding i18n `translation.json` churn):
- Theming/CSS: `src/styles/themes.css` (57), `src/index.css` (24), `src/styles/themes/aqua-glass.css` (12)
- iPod (by far the most-touched app): `src/apps/ipod/hooks/useIpodLogic.ts` (35),
  `src/stores/useIpodStore.ts` (25), `src/apps/ipod/components/IpodScreen.tsx` (22),
  `src/apps/ipod/types.ts`/`IpodAppComponent.tsx` (11)
- Control Panels: `src/apps/control-panels/hooks/useControlPanelsLogic.ts` (17),
  `.../ControlPanelsAppComponent.tsx` (12) — **relevant to §5, edit carefully**
- Chats/AI: `src/apps/chats/hooks/useAiChat.ts` (16), `.../ChatRoomSidebar.tsx` (11),
  `src/stores/useChatsStore.ts` (10)
- Finder file system: `src/apps/finder/hooks/useFinderLogic.ts` (12), `.../useFileSystem.ts` (12)
- Shell: `src/components/layout/dock/MacDock.tsx` (12), `src/App.tsx` (12)
