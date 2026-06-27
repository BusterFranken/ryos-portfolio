# Strip List — reducing ryOS to a client-only portfolio

**Goal:** remove backend-dependent subsystems so the site runs with NO server and NO API
keys, and deploys as a static Vite SPA.

**Method:** do this as a planned task (plan mode / Superpowers). Remove ONE subsystem at a
time. After each removal run:

    bun run build && bun run test:unit

then commit. If a removal breaks the build, that subsystem is more entangled than expected —
stop and map its imports before continuing.

> All paths/app names below are first-pass guesses from upstream docs. Confirm each against
> YOUR repo during exploration (`docs/ARCHITECTURE.md` §8) before deleting anything.

## Remove / disable (start at the bottom — lowest risk first)

1. **Electron + Tauri desktop shells** — *lowest risk, do first*
   - Why: not needed for a web portfolio.
   - Approach: delete `electron/` and `src-tauri/`; remove their build scripts from `package.json`. These are separate from the web build.

2. **AI assistant "Ryo" + tool calling**
   - Why: needs AI-provider keys + API endpoints.
   - Approach: remove the Chat/AI app from the app registry; delete its app module; remove related API clients (`src/api/…`) and any env reads.

3. **Chats / chat rooms / voice / realtime**
   - Why: needs Pusher and/or Redis.
   - Approach: remove the Chats app from the registry; delete the realtime service facade and Pusher/Redis clients; strip `REALTIME_*` / `PUSHER_*` / `REDIS_*` env usage.

4. **Cloud Sync**
   - Why: needs backend + storage.
   - Approach: remove the sync engine/client; keep ONLY the local IndexedDB file system.

5. **Object storage (Vercel Blob / S3)**
   - Why: needs cloud storage + keys.
   - Approach: remove upload/storage API clients; disable any "upload" affordances in apps.

6. **Internet Explorer "Time Machine" AI site generation**
   - Why: the Wayback URL browsing can stay, but AI-generated-site features need a backend.
   - Approach: KEEP the URL/iframe rendering (we reuse it for project windows); remove only the AI-generation path.

## Keep (the core you're building on)
- Window manager (drag/resize/minimize)
- App registry + a few apps: Finder, TextEdit, Paint
- Theme system + all 4 themes (required for the Mac ⟷ XP switch)
- Desktop + icons
- IndexedDB virtual file system (client-only — fine to keep)
- The URL/iframe rendering from IE (reused for Project windows)

## After stripping — verification checklist
- [ ] `bun run build` succeeds
- [ ] `bun run test:unit` passes
- [ ] `bun dev` loads the desktop with NO backend env set
- [ ] Console has no fatal errors (warnings ok)
- [ ] Theme switch Mac OS X ⟷ Windows XP still works
- [ ] Commit: `chore: strip backend subsystems for static portfolio`
