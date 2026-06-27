# ryOS Portfolio — Specification

> Status: **APPROVED DESIGN** (2026-06-27). Derived from `docs/ARCHITECTURE.md` (verified
> against this repo) and a brainstorming pass with Buster. Implementation plan follows
> separately. No app code is written yet.
>
> Architecture anchors referenced throughout use file:line from `docs/ARCHITECTURE.md`.

## 1. Concept
A personal portfolio built as a retro web OS (fork of ryOS). A visitor lands on what feels
like **Buster's actual running machine, mid-session** — a deliberately cluttered desktop of
overlapping windows. Each app/window is one of Buster's projects or profiles. The OS theme
switches between **Mac OS X Aqua** (default), **System 7**, **Windows XP**, and **Windows 98**.
A few Easter eggs reward poking around. Fully **client-only / static** — no backend, no API
keys, deployable as a static Vite SPA.

## 2. Goals & non-goals
**Goals**
- Each featured project = a first-class ryOS "app" (own icon, window, title, deep-link),
  registered through the existing app registry (never hardcoded). See `ARCHITECTURE.md` §3–§4.
- Live-render projects in iframe windows where the site allows framing; graceful
  preview-card + "Open ↗" fallback where it doesn't (`ARCHITECTURE.md` §7).
- A "curated chaos" boot layout (many overlapping windows).
- Tell the fuller story via native apps (Contacts, TextEdit notes, Videos, a Reader, Terminal).
- Stay a static SPA: strip the original's backend subsystems (AI chat, realtime, sync, etc.).

**Non-goals**
- No AI assistant / chat / realtime / cloud sync / object storage / Electron (all stripped —
  `docs/STRIP_LIST.md`).
- No backend of our own. The contact CTA uses `mailto:` + an external booking link.
- Not re-integrating each project's source — live projects are **iframed at their deployed URL**.

## 3. Architecture — shared engines + per-project registry entries
Approach chosen: **"one icon per project, shared engine."** Every featured project is its own
registry entry (own `AppId`, icon, window, `/id` route via `appRouteRegistry.ts:218-237`), but
they share a few reusable components, so adding a project later is ~config + an icon.

Three reusable building blocks:
1. **`ProjectIframe` engine** — the project-window component (one file, many registry entries).
2. **`Gallery` app** — screenshot/photo viewer (fills the §6 "no Photos app" gap).
3. **`DocViewer`** — native-styled document + PDF windows.

Plus reuse of existing apps unchanged: **Contacts, TextEdit, Videos, Terminal, iPod, Stickies,
Control Panels**.

**Registration mechanics** (per project app), following the §4 recipe:
- Add the id to `appIds` + `appNames` in `src/config/appRegistryData.ts` (`:7-34`, `:57-84`).
- Add the id to the `BaseApp["id"]` union in `src/apps/base/types.ts:23-49`.
- Add a registry entry in `src/config/appRegistry.tsx` (`appRegistry` object, `:218-565`),
  pointing its lazy component at the shared engine and supplying `name`/`icon`/`windowConfig`.
- Per-project data (URL, mode, full-screen, album, doc) lives in a single **`projectConfig`**
  map keyed by `AppId` that the shared component reads (so the component is written once).
- Add an icon `public/icons/default/<id>.png` (+ themed variants), run `bun run generate:icons`.

## 4. Project → window inventory

### 4.1 Live-iframe windows (verified frameable — `ProjectIframe` live mode)
| App id | Name | URL | Notes |
|---|---|---|---|
| `buster-barn` | Buster-Barn | https://busterfranken.github.io/Buster-Barn/ | **Full-screen "escape the OS" mode** (see §5.1). Not in boot. |
| `casefile` | Casefile (Courtroom Drama) | https://court-room-drama.onrender.com | Render free-tier **cold start** → show loading state. Not in boot. |
| `hush` | Hush | https://busterfranken.github.io/hush/ | live |
| `kafka-form` | Kafka Form | https://busterfranken.github.io/kafka-form/ | live |
| `eigenvector` | Eigenvector | https://eigenvector.pro/ | consulting site |
| `mpoftheweek` | MP of the Week | https://mpoftheweek.com | **opens on boot** (the one live iframe at boot) |
| `dnd-cv` | CV (D&D Character Sheet) | https://busterfranken.github.io/DnD-style-portfolio-cv/ | live |

### 4.2 Preview-card windows (`ProjectIframe` preview mode — intentional, not live)
| App id | Name | Behaviour |
|---|---|---|
| `tarot` | Tarot Reader | Bit-art fortune-teller image *(deferred)* + "Start tarot reading ↗" → redirects to https://tarotread.help/ |
| `pawnshop` | Pawnshop | Screenshots/preview + "Open ↗" — no live deploy yet *(deferred)* |

### 4.3 Gallery albums (`Gallery` app — screenshots, flick-through, "Want something similar?" CTA)
| Album | Content |
|---|---|
| `workout` | Workout (Swift iOS app) screenshots *(deferred)* |
| `jdog` | jDog (WhatsApp digest agent) screenshots *(deferred)* |
| `speaking` | Speaking-events photo album *(deferred)* |

### 4.4 Document windows (`DocViewer`)
| App id | Content |
|---|---|
| `cv-pdf` | Formal CV as PDF (PDF mode) *(deferred — content)* |
| native docs | A couple of native-styled docs, content added later *(deferred)* |

### 4.5 Native apps reused for storytelling
| App | Use |
|---|---|
| **Contacts** | "Reach me" card: email `busterfranken@gmail.com`, LinkedIn `linkedin.com/in/buster-franken`, Substack `substack.com/@busterfranken`, GitHub `BusterFranken`, Luma *(deferred URL)* |
| **TextEdit** | `read_me_first` Notes — "you're on Buster's machine" + current projects (opens on boot) |
| **Videos** | FruitPunch AI talks — hardcoded YouTube video IDs *(deferred — which videos)* |
| **Substack Reader** | Newest posts pulled from `busterfranken.substack.com/feed` at **build time** *(deferred — confirm publication)* |
| **Terminal / iPod / Stickies** | Easter eggs (see §9) |

### 4.6 Dropped
CRPG (per Buster). Group C: `pycman`, `fruitpunch.ai`, `WHtemplates`, `desktop-tutorial`,
`first-cursor-app`, `openclaw-workspace-backup`, `winxp-portfolio`, and the container repo itself.

## 5. Reusable components in detail

### 5.1 `ProjectIframe` engine
Forked from the IE iframe (`InternetExplorerContentPane.tsx:125-136`, `ARCHITECTURE.md` §7).
NOT a fork of the whole IE app — just the ~15-line iframe + overlay snippet.
- **Live mode:** `<iframe src={url} sandbox="allow-scripts allow-forms allow-same-origin
  allow-popups allow-pointer-lock">`, plus the `!isForeground` transparent click-catch overlay
  (so clicks focus the window, not the iframe), plus a **loading state** and an **error/timeout
  fallback** → preview card + "Open in new tab ↗".
- **Preview mode:** renders a static card (image/blurb) + a primary "Open ↗" / "Travel ↗" button.
  Used by `tarot`, `pawnshop`, and as the live-mode fallback.
- **Full-screen mode (`buster-barn`):** opening the app takes over the whole viewport, hiding the
  desktop chrome (the "escape the OS" gag), with **Esc / a small close affordance** to return.
  This is the one piece that needs care with the window manager (a chromeless maximized window or
  a full-viewport portal over the desktop). Flagged as the highest-risk task.
- Reads per-app settings (`url`, `mode`, `fullScreen`) from the `projectConfig` map (§3).

### 5.2 `Gallery` app
New small app built via the §4 recipe (the §6 Photos gap). Flick through an array of images
(prev/next, keyboard, swipe on mobile). Supports multiple **albums** (one per id in §4.3). Each
album may show a **CTA**: "Want something similar? → get in touch" (see §8). Themed: iPhoto-ish on
Mac chromes, Windows Photo Viewer-ish on Windows chromes. Images live under `public/` (static).

### 5.3 `DocViewer`
Native-styled document windows: Pages-ish on Mac chromes, WordPad/Notepad-ish on Windows chromes
(reuse TextEdit's rich-text rendering where practical). A **PDF mode** embeds a PDF via
`<iframe>`/`<embed>` (browsers render PDFs natively) for the formal CV. Content is added later
(deferred) — the windows/plumbing ship now.

## 6. Desktop icons (Aqua filter edit)
The Mac OS X desktop currently shows only `ipod` + `applet-viewer`
(`src/components/layout/desktop/useDesktop.ts:387-392`). Edit that filter to surface a **curated**
set (keeping the desktop readable, not all apps):
> **Buster-Barn · Casefile · MP of the Week · Eigenvector · Contacts · `read_me_first` Notes · a
> "Projects" Finder folder** (holding the remaining project apps).

Windows themes already show all apps on the desktop — no edit needed there (`ARCHITECTURE.md` §6).
Every app remains reachable regardless via the Apple menu, dock, app switcher, and `/id` route.

## 7. Boot layout — "curated chaos"
On first visit (no persisted window state in `ryos:app-store`), seed a **default set of ~7
overlapping, staggered windows** so it reads as a busy, lived-in desktop. Implementation: seed
default open instances in `useAppStore` on first run (`createAppInstance`, `useAppStore.ts:289-397`;
persistence/version at `:743-744`). Default set (Mac OS X), tunable:

1. `read_me_first` Notes (TextEdit) — welcome + current projects, front-most-ish
2. Contacts — reach-me card
3. **mpoftheweek** — the single live iframe at boot
4. Videos — FruitPunch AI, paused on a frame
5. Gallery — speaking-events album, one photo showing
6. "Subscribe to my Luma" popup (Join / Later) — mirrors the reference; wires the Luma CTA
7. A small retro popup gag ("You're visitor #1,000,000!") — harmless

**Performance rules:** at most **one live iframe on boot** (mpoftheweek). `casefile` (cold start)
and `buster-barn` (full-screen) are **excluded from boot** — launched on click only. Returning
visitors get their persisted layout; a "reset desktop" affordance restores the boot mess.

## 8. Contact CTA
`mailto:` + external booking link — **no backend**. The "Want something similar? / work with me"
button (in Gallery albums and the Contacts card) opens a pre-filled email to
`busterfranken@gmail.com` and/or links out to a booking page (Luma/Calendly — *deferred URL*).

## 9. Easter eggs (where each hides)
- **Buster-Barn full-screen takeover** — opening its desktop icon escapes the OS into the
  malware-popup adventure game (§5.1).
- **Terminal bio commands** — `whoami` / `projects` / `contact` / `help` print ASCII bio + links
  (extend the existing Terminal app's command set).
- **Hidden Stickies note** — a sticky parked off-screen / behind a window with a personal message.
- **Personal iPod playlist** — iPod pre-loaded with a fixed YouTube-ID playlist (local only; Apple
  Music sync stripped). *(deferred — track list)*

## 10. Theme
Default **Mac OS X Aqua** — already the default (`DEFAULT_OS_THEME_ID = "macosx"`,
`src/themes/index.ts:21`); **no change needed**. Keep **all 4 themes** and the Appearance switcher
exactly as-is (Control Panels → Appearance, `AppearancePaneContent.tsx` / `AppearanceTabContent.tsx`).

## 11. Backend posture & what to strip
**Fully client-only, static, boots with no env** (`ARCHITECTURE.md` §8/§10). Strip the original's
backend subsystems per `docs/STRIP_LIST.md`: AI assistant "Ryo" + tool calling, chats/rooms/voice/
realtime (Pusher/Redis), Cloud Sync (`src/sync/`), object storage (`src/utils/storageUpload.ts`),
Electron, and the admin app. Disable/guard backend-coupled features in retained apps:
- **Videos** — keep client-side embeds (hardcoded IDs); do not expose the `/api/youtube-search` add flow.
- **iPod** — local/YouTube-ID playback only; strip Apple Music + `/api/songs` sync.
- **maps / tv channel-creation / applet-viewer store** — remove or hide (backend-coupled).
- Neutralize the hardcoded prod fallbacks in `src/utils/runtimeConfig.ts:22,26` (point at ryo.lu).
- **Substack Reader** — RSS pulled at **build time** by a script that emits static JSON; no runtime
  fetch (avoids CORS + keeps it static). Live auto-refresh is explicitly out of scope.

After each subsystem removal: `bun run build && bun run test:unit`, per `STRIP_LIST.md`.

## 12. Build & deploy
Static Vite SPA (`ARCHITECTURE.md` §10). Build: `bun run build` (`tsc -b && vite build`) → `dist/`.
The Substack RSS pull is a **build-time step** (a script under `scripts/`, wired into `prebuild`),
producing a static data file consumed by the Reader. Deploy `dist/` to any static host; add
per-route rewrites (every `/id` → `/`) so deep links resolve (cf. existing `vercel.json`).

## 13. Deferred content — "ping Buster" checklist
Tracked here and to be mirrored into `CLAUDE.md`. None of these block building the shells:
- [ ] CV PDF file → `cv-pdf` DocViewer window
- [ ] Tarot fortune-teller bit-art image → `tarot` preview card
- [ ] Pawnshop deploy URL (→ promote to live iframe) or screenshots
- [ ] Luma URL → Contacts link + boot "Subscribe to my Luma" popup
- [ ] Native-doc window content/text/links
- [ ] Gallery screenshots — Workout, jDog, speaking-events album
- [ ] FruitPunch AI YouTube video IDs → Videos app
- [ ] Confirm Substack publication feed (`busterfranken.substack.com/feed`) for the Reader
- [ ] iPod Easter-egg playlist track list
- [ ] Booking link for the contact CTA (Luma/Calendly)

## 14. Implementation phases (high-level — detailed plan follows)
1. **Strip** backend subsystems to reach a clean static SPA that boots with no env
   (one subsystem at a time, `STRIP_LIST.md` order; build+test after each).
2. **`ProjectIframe` engine** + `projectConfig` + register the 7 live + 2 preview project apps;
   icons; Aqua desktop-filter edit.
3. **Buster-Barn full-screen mode** (highest-risk; isolate and verify).
4. **`Gallery` app** (+ albums, CTA) and **`DocViewer`** (+ PDF mode).
5. **Native storytelling**: Contacts card, `read_me_first` Notes, Videos (curated IDs),
   Substack Reader (+ build-time RSS script).
6. **Easter eggs**: Terminal commands, hidden Stickies, iPod playlist.
7. **Boot layout** (curated-chaos default seed + reset affordance).
8. Wire **deferred content** as Buster supplies it; final build/test; deploy.

## 15. Decisions log
- Projects represented as **one icon per project, shared engine** (not Finder-folder, not bespoke).
- **All 4 themes kept**; default Mac OS X; switcher unchanged.
- Boot = **curated chaos** (~7 overlapping windows), 1 live iframe cap at boot.
- **YouTube** featured via the native **Videos** app (channel pages can't be iframed).
- **Tarot** is an intentional preview-card + redirect (even though frameable) per Buster's design.
- **Contact CTA** = `mailto:` + booking link; **no backend**; site stays fully static.
- Live projects are **iframed at deployed URLs**, not re-integrated from source.
