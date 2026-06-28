# ryOS Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the ryOS fork into Buster's client-only, static portfolio OS — each project an app window, live ones in iframes, with a curated-chaos boot and a few Easter eggs.

**Architecture:** "One icon per project, shared engine" (see `docs/SPEC.md` §3). A few reusable components — `ProjectIframe`, `Gallery`, `DocViewer` — are each registered many times via per-project entries in the app registry, driven by a single `projectConfig` map. Existing apps (Contacts, TextEdit, Videos, Terminal, iPod, Stickies) are reused. Backend subsystems from upstream are stripped so the app is a pure static SPA.

**Tech Stack:** React 19 · TypeScript · Zustand · Vite · Bun (`bun test`, `bun run build`). Architecture anchors are in `docs/ARCHITECTURE.md`; the approved design is `docs/SPEC.md`; the stripping method is `docs/STRIP_LIST.md`.

## Global Constraints
_Every task implicitly includes these. Values copied verbatim from `docs/SPEC.md`._
- **Client-only / static. No backend, no API keys, no new env.** Contact CTA = `mailto:` + booking link only (§8, §11).
- **Keep all 4 themes**; default `macosx` (`DEFAULT_OS_THEME_ID`, `src/themes/index.ts:21` — do NOT change). Appearance switcher unchanged (§10).
- **Register every project through the app registry** (never hardcode into the desktop) — follow the §4 recipe in `docs/ARCHITECTURE.md`: `appRegistryData.ts` (`appIds`+`appNames`) → `base/types.ts` `BaseApp["id"]` union → `appRegistry.tsx` entry → icon + `bun run generate:icons`.
- **Live projects are iframed at their deployed URL**, not re-integrated from source.
- **Verify gate after every task:** `bun run build` must pass; new unit tests via `bun test tests/<file>`; the curated suite via `bun run test:unit`. Commit after each green task.
- **At most one live iframe opens on boot** (`mpoftheweek`); `casefile` (cold start) and `buster-barn` (full-screen) are launch-on-click only (§7).
- **Deferred content** (`docs/SPEC.md` §13) ships as empty shells with placeholders; never block a task waiting on it.

---

## File Structure (created / modified across the whole plan)

**New — shared engines & config**
- `src/apps/projects/projectConfig.ts` — `ProjectConfig` type + `projectConfig` map + `resolveProjectConfig()`
- `src/apps/projects/components/ProjectIframeWindow.tsx` — the shared iframe/preview/fullscreen component
- `src/apps/projects/registerProjectApps.tsx` — binds each project `AppId` to the shared component for the registry
- `src/apps/projects/metadata.ts` — shared `appMetadata`/`helpItems` defaults for project apps
- `src/apps/gallery/` — new Gallery app (component, albums config, metadata) [M4]
- `src/apps/docviewer/` — new DocViewer app (rich-text + PDF modes) [M4]
- `src/config/bootLayout.ts` — default first-run open-window set [M7]
- `src/components/layout/desktop/aquaDesktopApps.ts` — `AQUA_DESKTOP_APP_IDS` constant [M1]
- `scripts/fetch-substack.ts` — build-time RSS → `public/data/substack.json` [M5]
- `public/icons/default/<id>.png` (+ themed variants) — one per project/app

**Modified — registry & wiring**
- `src/config/appRegistryData.ts` — add project/app ids to `appIds` (`:7-34`) + `appNames` (`:57-84`)
- `src/apps/base/types.ts` — add ids to `BaseApp["id"]` union (`:23-49`)
- `src/config/appRegistry.tsx` — add registry entries (`:218-565`)
- `src/components/layout/desktop/useDesktop.ts` — replace the Aqua `displayedApps` filter (`:387-392`) with `AQUA_DESKTOP_APP_IDS`
- `src/stores/useAppStore.ts` — seed `bootLayout` on first run (no persisted state) [M7]
- `src/apps/terminal/…` — add bio commands [M6]
- `package.json` — `prebuild` chains `fetch-substack`; add new test files to `test:unit`

**Removed — backend subsystems** (per `docs/STRIP_LIST.md`) [M0]

---

## Milestones (each independently shippable & testable)

| # | Milestone | Spec ref | Detail level here |
|---|---|---|---|
| **M0** | Strip backend → clean static SPA | §11, STRIP_LIST | task-level (method already in STRIP_LIST) |
| **M1** | `ProjectIframe` engine + register live/preview project apps + Aqua icons | §3–§6 | **full bite-sized** |
| **M2** | Buster-Barn full-screen "escape the OS" mode | §5.1, §9 | task-level |
| **M3** | Preview-card projects polish (tarot art-card, pawnshop) | §4.2 | task-level |
| **M4** | `Gallery` app + `DocViewer` (+ PDF) | §5.2–§5.3 | task-level |
| **M5** | Native storytelling: Contacts card, Notes, Videos, Substack Reader | §4.5 | task-level |
| **M6** | Easter eggs: Terminal commands, hidden Stickies, iPod playlist | §9 | task-level |
| **M7** | Curated-chaos boot layout + reset affordance | §7 | task-level |

> **Recommended sequencing note:** `docs/SPEC.md` §14 lists stripping first. M1 does **not** depend on M0 (the iframe engine is orthogonal to chat/sync/realtime), so M1 can begin in parallel. M0 **must** complete before the final static deploy. Pick per appetite; this plan presents M0 first to match the spec, but starting on M1 to see early value is reasonable. **Surface this choice — don't silently reorder.**

---

## M0: Strip backend subsystems → clean static SPA

**Objective:** Reach a build that boots with **no env** and deploys static, by removing upstream's backend-coupled subsystems. The *method* is already specified in `docs/STRIP_LIST.md` (remove one subsystem, `bun run build && bun run test:unit`, commit). This milestone sequences it against the **real paths** confirmed in `docs/ARCHITECTURE.md` §8.

**Files (remove/guard) — confirmed real paths from ARCHITECTURE.md §8:**
- Electron: `electron/`, `scripts/build-electron.ts`, `scripts/bundle-electron.ts`, `scripts/electron-*` + their `package.json` scripts. *(No `src-tauri/` exists.)*
- AI "Ryo"/chat: `src/apps/chats/`, registry entry `chats` in `appRegistry.tsx:258-270`, `src/apps/terminal/commands/ai.ts` delegation.
- Realtime: `src/services/chat/ChatRealtimeService.ts`, `src/lib/pusherClient.ts`, `src/api/{rooms,irc,listen,telegram}.ts`.
- Cloud Sync: `src/sync/`, `src/stores/useCloudSyncStore.ts`, `src/hooks/useDeferredAutoCloudSync.ts`/`useAutoCloudSync.ts`.
- Object storage: `src/utils/storageUpload.ts` (+ blob callers).
- `admin` app + `src/api/admin.ts`; `maps` app; `tv` channel-creation; `applet-viewer` share/store calls.
- Neutralize prod fallbacks in `src/utils/runtimeConfig.ts:22,26`.

**Tasks** (each = remove one subsystem → `bun run build && bun run test:unit` → commit; stop & map imports if the build breaks, per STRIP_LIST):
- [ ] M0.1 Remove Electron shell + scripts (lowest risk first).
- [ ] M0.2 Remove `chats` app + AI delegation; drop its registry entry, `appIds`/`appNames`/`BaseApp` id.
- [ ] M0.3 Remove realtime (Pusher/Redis) facade + `src/api/*` realtime clients.
- [ ] M0.4 Remove Cloud Sync engine + store + hooks.
- [ ] M0.5 Remove object-storage uploader + disable upload affordances.
- [ ] M0.6 Remove/hide `admin`, `maps`; guard `tv`/`applet-viewer`/`ipod` backend hooks (keep client-only playback).
- [ ] M0.7 Neutralize `runtimeConfig.ts` prod fallbacks; prune now-unused `test:unit` entries (chat/pusher/sync/admin tests).
- [ ] M0.8 **Verify gate:** `bun run build` green, `bun run test:unit` green, `bun dev` loads desktop with NO env, theme switch Mac⟷XP works, no fatal console errors. Commit `chore: strip backend subsystems for static portfolio`.

**Note:** M0 is removal-heavy (not TDD-shaped); its "test" is the build + curated suite + the STRIP_LIST §"After stripping" checklist. Expand each task inline against the live import graph when executing (couplings only surface on removal).

---

## M1: `ProjectIframe` engine + register project apps + Aqua icons  ⟵ keystone, full detail

**Objective:** A shared component renders any project as a **live iframe**, a **preview card**, or **full-screen**, driven by a typed `projectConfig`. Register the 7 live + 2 preview projects as real apps with icons, and surface a curated set on the Aqua desktop.

**Files:**
- Create: `src/apps/projects/projectConfig.ts`
- Create: `src/apps/projects/components/ProjectIframeWindow.tsx`
- Create: `src/apps/projects/registerProjectApps.tsx`
- Create: `src/apps/projects/metadata.ts`
- Create: `src/components/layout/desktop/aquaDesktopApps.ts`
- Create (tests): `tests/test-project-config.test.ts`, `tests/test-aqua-desktop-apps.test.ts`
- Modify: `src/config/appRegistryData.ts` (`appIds` `:7-34`, `appNames` `:57-84`)
- Modify: `src/apps/base/types.ts` (`BaseApp["id"]` union `:23-49`)
- Modify: `src/config/appRegistry.tsx` (entries `:218-565`)
- Modify: `src/components/layout/desktop/useDesktop.ts` (Aqua filter `:387-392`)
- Modify: `package.json` (add the two test files to `test:unit`)

**Interfaces:**
- Produces:
  - `type ProjectMode = "live" | "preview" | "fullscreen"`
  - `interface ProjectConfig { mode: ProjectMode; url: string; previewImage?: string; previewBlurb?: string; ctaHref?: string }`
  - `const projectConfig: Partial<Record<AppId, ProjectConfig>>`
  - `function resolveProjectConfig(appId: AppId): ProjectConfig | undefined`
  - `const AQUA_DESKTOP_APP_IDS: AppId[]`
  - `function makeProjectApp(appId: AppId): React.ComponentType<AppProps>` (binds the shared window to one id)
- Consumes: `AppProps` (`src/apps/base/types.ts:3`), `AppWindowShell` (`src/components/shared/AppWindowShell.tsx`), the IE iframe pattern (`InternetExplorerContentPane.tsx:125-136`).

**Project ids (added to `appIds`/`appNames`/`BaseApp`):**
`buster-barn`, `casefile`, `hush`, `kafka-form`, `eigenvector`, `mpoftheweek`, `dnd-cv`, `tarot`, `pawnshop`.

### M1.a — `projectConfig` (pure data + resolver, TDD)

- [ ] **Step 1: Write the failing test** — `tests/test-project-config.test.ts`

```ts
import { describe, test, expect } from "bun:test";
import { projectConfig, resolveProjectConfig } from "../src/apps/projects/projectConfig";

describe("projectConfig", () => {
  const LIVE = ["buster-barn","casefile","hush","kafka-form","eigenvector","mpoftheweek","dnd-cv"] as const;
  const PREVIEW = ["tarot","pawnshop"] as const;

  test("every project id has a config", () => {
    for (const id of [...LIVE, ...PREVIEW]) {
      expect(resolveProjectConfig(id as any)).toBeDefined();
    }
  });
  test("live projects are mode 'live' with an http(s) url (buster-barn is fullscreen)", () => {
    for (const id of LIVE) {
      const c = resolveProjectConfig(id as any)!;
      const expected = id === "buster-barn" ? "fullscreen" : "live";
      expect(c.mode).toBe(expected);
      expect(c.url).toMatch(/^https?:\/\//);
    }
  });
  test("preview projects are mode 'preview' and carry a redirect url", () => {
    for (const id of PREVIEW) {
      const c = resolveProjectConfig(id as any)!;
      expect(c.mode).toBe("preview");
      expect(c.url).toMatch(/^https?:\/\//);
    }
  });
  test("unknown id resolves to undefined", () => {
    expect(resolveProjectConfig("finder" as any)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** — `bun test tests/test-project-config.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement** — `src/apps/projects/projectConfig.ts`

```ts
import type { AppId } from "@/config/appRegistryData";

export type ProjectMode = "live" | "preview" | "fullscreen";

export interface ProjectConfig {
  mode: ProjectMode;
  /** Deployed URL (live/fullscreen) or redirect target (preview). */
  url: string;
  /** Preview-mode hero image (public path). Deferred content ok. */
  previewImage?: string;
  previewBlurb?: string;
  /** Optional "work with me" mailto/booking link. */
  ctaHref?: string;
}

export const projectConfig: Partial<Record<AppId, ProjectConfig>> = {
  "buster-barn": { mode: "fullscreen", url: "https://busterfranken.github.io/Buster-Barn/" },
  "casefile":    { mode: "live", url: "https://court-room-drama.onrender.com" },
  "hush":        { mode: "live", url: "https://busterfranken.github.io/hush/" },
  "kafka-form":  { mode: "live", url: "https://busterfranken.github.io/kafka-form/" },
  "eigenvector": { mode: "live", url: "https://eigenvector.pro/" },
  "mpoftheweek": { mode: "live", url: "https://mpoftheweek.com" },
  "dnd-cv":      { mode: "live", url: "https://busterfranken.github.io/DnD-style-portfolio-cv/" },
  "tarot":       { mode: "preview", url: "https://tarotread.help/",
                   previewBlurb: "A bit-art fortune teller. Start a reading ↗",
                   /* previewImage: "/projects/tarot.png" — deferred */ },
  "pawnshop":    { mode: "preview", url: "https://github.com/BusterFranken/pawnshop",
                   previewBlurb: "AI jewelry-appraisal marketplace (not deployed yet) ↗" },
};

export function resolveProjectConfig(appId: AppId): ProjectConfig | undefined {
  return projectConfig[appId];
}
```

- [ ] **Step 4: Run it, expect PASS** — `bun test tests/test-project-config.test.ts` → PASS.
- [ ] **Step 5: Commit** — `git add src/apps/projects/projectConfig.ts tests/test-project-config.test.ts && git commit -m "feat(projects): typed project config + resolver"`

### M1.b — register ids in the registry data (TDD on consistency)

- [ ] **Step 1: Add to the existing registry test or create** `tests/test-project-config.test.ts` addition:

```ts
import { appIds, appNames } from "../src/config/appRegistryData";
test("all project ids are registered in appIds + appNames", () => {
  for (const id of Object.keys(projectConfig)) {
    expect(appIds).toContain(id);
    expect(appNames[id as keyof typeof appNames]).toBeTruthy();
  }
});
```

- [ ] **Step 2: Run, expect FAIL** (ids not yet in `appIds`).
- [ ] **Step 3: Implement** — add the 9 ids to `appIds` (`src/config/appRegistryData.ts:7-34`) and `appNames` (`:57-84`), e.g. `"buster-barn": "Buster-Barn", "casefile": "Casefile", …`; and to the `BaseApp["id"]` union (`src/apps/base/types.ts:23-49`).
- [ ] **Step 4: Run, expect PASS**; then `bun run build` (typecheck the union).
- [ ] **Step 5: Commit** — `feat(projects): register project app ids`

### M1.c — `ProjectIframeWindow` shared component + `makeProjectApp`

- [ ] **Step 1: Implement** `src/apps/projects/components/ProjectIframeWindow.tsx` — lift the iframe from `InternetExplorerContentPane.tsx:125-136` (sandbox + `!isForeground` overlay + loading state); branch on `config.mode`:
  - `live`: `<iframe src={config.url} sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-pointer-lock" onLoad onError>` + overlay + loading spinner + onError/timeout → preview card.
  - `preview`: hero (`previewImage`/blurb) + primary button → `window.open(config.url, "_blank")`.
  - `fullscreen`: handled in **M2** (for now render `live` inside the window; M2 adds the takeover).
  Wrap in `AppWindowShell` with a minimal menu bar (File ▸ Open in new tab, Close).
- [ ] **Step 2: Implement** `src/apps/projects/registerProjectApps.tsx`:

```tsx
import type { AppProps } from "@/apps/base/types";
import type { AppId } from "@/config/appRegistryData";
import { resolveProjectConfig } from "./projectConfig";
import { ProjectIframeWindow } from "./components/ProjectIframeWindow";

export function makeProjectApp(appId: AppId) {
  return function ProjectApp(props: AppProps) {
    const config = resolveProjectConfig(appId);
    if (!config) return null;
    return <ProjectIframeWindow appId={appId} config={config} {...props} />;
  };
}
```

- [ ] **Step 3: Verify build** — `bun run build` (typecheck only; visual check deferred to M1.e run).
- [ ] **Step 4: Commit** — `feat(projects): shared ProjectIframeWindow + makeProjectApp`

### M1.d — wire registry entries + icons

- [ ] **Step 1:** In `src/config/appRegistry.tsx`, add a lazy component per project id pointing at the shared engine (via `makeProjectApp(id)` wrapped in `createLazyComponent`), with `name` from `appNames`, `icon: { type: "image", src: "/icons/default/<id>.png" }`, `metadata`/`helpItems` from `src/apps/projects/metadata.ts`, and a `windowConfig` (e.g. `defaultSize: { width: 800, height: 600 }`).
- [ ] **Step 2:** Add `public/icons/default/<id>.png` for each id (temporary placeholder art ok; real icons are deferred content) and run `bun run generate:icons`.
- [ ] **Step 3: Verify** — `bun run build` green.
- [ ] **Step 4: Commit** — `feat(projects): register project apps in registry + icons`

### M1.e — Aqua desktop icon set (TDD + wire)

- [ ] **Step 1: Write the failing test** — `tests/test-aqua-desktop-apps.test.ts`

```ts
import { describe, test, expect } from "bun:test";
import { AQUA_DESKTOP_APP_IDS } from "../src/components/layout/desktop/aquaDesktopApps";
import { appIds } from "../src/config/appRegistryData";

describe("AQUA_DESKTOP_APP_IDS", () => {
  test("contains the curated portfolio set and only valid ids", () => {
    const expected = ["buster-barn","casefile","mpoftheweek","eigenvector","contacts"];
    for (const id of expected) expect(AQUA_DESKTOP_APP_IDS).toContain(id);
    for (const id of AQUA_DESKTOP_APP_IDS) expect(appIds).toContain(id);
  });
});
```

- [ ] **Step 2: Run, expect FAIL** (module missing).
- [ ] **Step 3: Implement** `src/components/layout/desktop/aquaDesktopApps.ts`:

```ts
import type { AppId } from "@/config/appRegistryData";
// Curated icons shown on the Mac OS X desktop (Windows themes show all). See SPEC §6.
export const AQUA_DESKTOP_APP_IDS: AppId[] = [
  "buster-barn", "casefile", "mpoftheweek", "eigenvector", "contacts",
];
```

- [ ] **Step 4:** Modify `src/components/layout/desktop/useDesktop.ts:387-392` — replace the inline `app.id === "ipod" || app.id === "applet-viewer"` filter with `AQUA_DESKTOP_APP_IDS.includes(app.id)`.
- [ ] **Step 5: Run** `bun test tests/test-aqua-desktop-apps.test.ts` → PASS; `bun run build` green.
- [ ] **Step 6:** Add both new test files to `package.json` `test:unit`; run `bun run test:unit` → green.
- [ ] **Step 7: Commit** — `feat(desktop): curated Aqua desktop icon set`

### M1.f — manual run verification (component visuals can't be unit-tested)

- [ ] **Step 1:** `bun run dev:vite`; open each project app from the desktop/Apple menu.
- [ ] **Step 2:** Confirm: live ones render the iframe and focus-on-click works; `mpoftheweek`/`eigenvector`/GH-Pages games load; `casefile` shows a loading state then loads; preview ones (`tarot`, `pawnshop`) show the card + "Open ↗" opens a new tab.
- [ ] **Step 3:** Note any framing surprise (re-run the §7 header check). Commit nothing (verification only).

**M1 done = 9 project apps registered, live/preview rendering verified, curated Aqua icons, green build + suite.**

---

## M2: Buster-Barn full-screen "escape the OS" mode
**Objective:** Opening `buster-barn` takes over the full viewport (desktop chrome hidden), Esc/close returns. **Highest-risk** task — isolate.
**Files:** `ProjectIframeWindow.tsx` (fullscreen branch), likely a portal/overlay in `src/components/layout/` + a flag in `useAppStore`. **Leverage the existing `tests/test-ryos-fullscreen.test.ts` + whatever fullscreen primitive it covers** before inventing a new one.
**Tasks:** (a) find the existing fullscreen mechanism the test exercises; (b) render `buster-barn` as a chromeless full-viewport portal over the desktop; (c) Esc + a small close button restore the desktop; (d) ensure it's excluded from boot; (e) wiring test that `resolveProjectConfig("buster-barn").mode === "fullscreen"` and the overlay mounts. **Expand to bite-sized when starting.**

## M3: Preview-card polish
**Objective:** Make `tarot` (fortune-teller art + "Start reading ↗") and `pawnshop` (screenshots/blurb + "Open ↗") look intentional, not like a fallback. **Files:** `ProjectIframeWindow.tsx` preview branch + `projectConfig` `previewImage`. Content (tarot art, pawnshop shots) is deferred — ship the layout with placeholders. **Tasks:** style the preview card per theme; wire CTA; placeholder image slot. Expand to bite-sized when starting.

## M4: `Gallery` app + `DocViewer`
**Objective:** The missing Photos app (§5.2) + native doc/PDF windows (§5.3). **Files:** `src/apps/gallery/*`, `src/apps/docviewer/*`, registry entries + ids + icons (§4 recipe). **Tasks:** (Gallery) album data type `{ id, title, images: string[], cta?: string }`, flick-through UI (prev/next/keyboard/swipe), per-theme chrome, "Want something similar?" `mailto:` CTA; albums `workout`/`jdog`/`speaking` with placeholder images. (DocViewer) rich-text window + PDF `<embed>` mode; `cv-pdf` entry. TDD the album/config + doc-source resolution as pure units; verify visuals via dev run. Expand to bite-sized when starting.

## M5: Native storytelling
**Objective:** Contacts "reach me" card, `read_me_first` Notes (TextEdit), Videos (curated FruitPunch IDs), Substack Reader (build-time RSS). **Files:** seed a vCard/contact into Contacts' store/data; seed a TextEdit doc; seed Videos with hardcoded video IDs; `scripts/fetch-substack.ts` → `public/data/substack.json` wired into `prebuild`; a Reader view (reuse Books or DocViewer). **Tasks:** TDD `fetch-substack` parsing against a fixture RSS; seed data; verify each app shows the content. Substack publication URL + video IDs are deferred — script tolerates an empty/missing feed. Expand to bite-sized when starting.

## M6: Easter eggs
**Objective:** Terminal bio commands, hidden Stickies note, personal iPod playlist (§9). **Files:** `src/apps/terminal/commands/*` (add `whoami`/`projects`/`contact`/`help`), Stickies seed (off-screen note), iPod seed (fixed YouTube-ID playlist). **Tasks:** TDD each Terminal command's output (pure string), seed Stickies/iPod data. Track list + final copy deferred. Expand to bite-sized when starting.

## M7: Curated-chaos boot layout
**Objective:** First-run desktop opens ~7 overlapping windows (§7). **Files:** `src/config/bootLayout.ts` (default instances: appId + position + size), wired into `useAppStore` first-run seed (only when no persisted `ryos:app-store`); a "reset desktop" affordance. **Tasks:** TDD `bootLayout` data (1 live-iframe cap; excludes `buster-barn`/`casefile`; includes notes/contacts/mpoftheweek/videos/gallery/luma-popup/visitor gag); seed-on-empty logic; reset action. Expand to bite-sized when starting.

---

## Self-Review (plan vs spec)

**Spec coverage:** §3 architecture → M1 (engine) + recipe used throughout. §4.1 live → M1. §4.2 preview → M1+M3. §4.3 galleries → M4. §4.4 docs/PDF → M4. §4.5 native apps → M5. §5.1 fullscreen → M2. §6 Aqua icons → M1.e. §7 boot → M7. §8 contact CTA → M4 (gallery) + M5 (contacts). §9 easter eggs → M2 (buster-barn) + M6. §10 theme → Global Constraints (no change). §11 strip → M0. §12 build/deploy/RSS → M0 + M5. §13 deferred → handled as placeholders across M1/M3/M4/M5/M6. **No uncovered spec section.**

**Placeholder scan:** Deferred *content* (icons, tarot art, screenshots, video IDs, Substack URL, CV PDF) is intentional per §13 and shipped as empty shells — not plan gaps. M2–M7 are deliberately task-level per the scope-check decomposition (each expands to bite-sized at execution).

**Type consistency:** `ProjectConfig`/`ProjectMode`/`resolveProjectConfig`/`makeProjectApp`/`AQUA_DESKTOP_APP_IDS` are defined in M1 and reused identically in M2–M7. Project ids match across `projectConfig`, `appIds`, `appNames`, `BaseApp` union.

---

## Execution Handoff
Per the original request, **no app code is written yet** — this is the plan artifact. When you're ready to build, two options:
1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.
2. **Inline Execution** — batch tasks in-session with checkpoints.

Recommended starting point: **M0** (strip, matches spec order) or **M1** (keystone, early visible value) — your call per the sequencing note above.
