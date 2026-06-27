# Getting Started — ryos-portfolio

A step-by-step from a fresh clone to a running desktop you can build on, using Claude Code +
Superpowers. Work top to bottom.

## 0. Prerequisites
- `git`
- **Bun** (the runtime ryOS uses):
  - macOS / Linux: `curl -fsSL https://bun.sh/install | bash`
  - Windows (PowerShell): `irm bun.sh/install.ps1 | iex`
  - Restart your shell, then check: `bun --version`
- Claude Code installed and working (you already have it).

## 1. Clone your fork and enter it
    git clone https://github.com/BusterFranken/ryos-portfolio.git
    cd ryos-portfolio

## 2. Drop in the project docs
- Put **CLAUDE.md** in the repo ROOT.
- Put **ARCHITECTURE.md**, **STRIP_LIST.md**, and **this file** in a `docs/` folder:

      mkdir -p docs
      # move ARCHITECTURE.md, STRIP_LIST.md, GETTING_STARTED.md into docs/

## 3. Install dependencies
    bun install

## 4. First boot (sanity check)
    bun dev
Open the local URL it prints — the desktop should load. Expect console errors from the
AI/chat/sync features; that's fine, we're removing those. If it refuses to start due to
missing env:
- look for a `.env.example` and copy it: `cp .env.example .env.local`
- leave all backend keys blank; we only need the frontend to start.

## 5. Make a working branch
    git checkout -b portfolio

## 6. Launch Claude Code in the repo
    claude

## 7. Install Superpowers (once per machine, if not already)
    /plugin install superpowers@claude-plugins-official
Verify: in a fresh message say "Help me plan a feature" — it should start by asking
clarifying questions, not coding.

## 8. Phase 1 — explore before touching (paste this in PLAN MODE)
Toggle plan mode (read-only), then paste:

---
Explore this repository WITHOUT making any changes. I'm turning this ryOS fork into a
personal portfolio: each app/window is one of my projects, visitors can switch the OS theme
between Mac OS X Aqua and Windows XP, and two projects will run live inside iframe windows.

Fill in docs/ARCHITECTURE.md by answering each TODO with concrete file paths and line
references from THIS repo (don't assume upstream). Focus especially on:
- the app registry and how a single app is defined/registered
- which existing app is the simplest template to copy for a new app
- the theme system: where themes are defined, where the active theme is stored, where it's
  switched, and where to set the default theme on first load
- how the Internet Explorer app renders an external URL (so I can reuse it for project windows)
- which features need a backend/env and which apps depend on them

Then refine CLAUDE.md's "Architecture" section with the confirmed paths.
Do not write any application code yet.
---

Review the result yourself, fix anything wrong, then commit:
    git add -A && git commit -m "docs: add project memory and architecture map"

## 9. Phase 2 (optional) — find the fragile files
Ask Claude Code to run and summarize:
    git log --format=format: --name-only | grep . | sort | uniq -c | sort -rn | head -30
    git log --oneline -i --grep="fix\|revert\|regression"
Record the hotspots in docs/ARCHITECTURE.md §11 so you avoid casual edits there.

## 10. Phase 3 — lock the spec (Superpowers brainstorm)
New message (NOT plan mode):
"Help me plan a portfolio built on this codebase. Use docs/ARCHITECTURE.md. Here's the
concept: [list your projects; which 2 run live; default OS = Mac OS X or Windows XP; your
Easter-egg ideas; Apple-style icons]. Ask me what you need, then produce a spec and a plan."
Save the resulting spec to docs/SPEC.md and commit.

## 10.5  Phase 3.5 — gather project icons (do this before building windows)
Now that the spec lists exactly which projects exist and what they're called, collect their
icons *before* Phase 5 so there's no mid-build scramble (a Project window needs its icon at
registration time).

- For each project in docs/SPEC.md, grab an Apple-style icon (PNG, ≥512px) from
  **macosicons.com**.
- Save them under `public/icons/projects/` with clear names, e.g. `project-foo.png`.
- In docs/SPEC.md, note each icon's filename next to its project (and the source/attribution).
- Check the license on each icon — macosicons.com is community-uploaded.
- Commit: `chore: add project desktop icons`.

Note: this is ONLY for your project icons. The Mac/XP system icons (window buttons, menu bar,
Start button, default app icons) already ship with ryOS's themes — you don't download those.

## 11. Phase 4 — strip to client-only
"Using docs/STRIP_LIST.md and docs/ARCHITECTURE.md §8, plan the removal of the backend
subsystems. Remove ONE at a time, running `bun run build` and `bun run test:unit` after
each, and commit per removal. Start with the Electron/Tauri shells (lowest risk)."
Finish when the post-strip checklist in STRIP_LIST.md passes.

## 12. Phase 5 — build features, one verified loop each
For each: plan → implement with tests → review → commit. Suggested order:
1. A "Project" app that renders an external URL in an iframe window, registered like the
   existing apps (reuse the IE rendering you mapped in §7).
2. Embed live project #1, then #2 (handle iframe headers; fall back to preview + "open ↗").
3. Wire up the project icons you gathered in Phase 3.5 (already in `public/icons/projects/`) to each Project app.
4. Easter eggs.
5. Set the default theme and verify the Mac OS X ⟷ Windows XP switch both directions.

## 13. Phase 6 — deploy
Build the static SPA and deploy to Vercel / Netlify / GitHub Pages. Keep the AGPL LICENSE
and credit upstream ryOS in your README.

## Habits throughout
- Plan mode before structural changes; commit early and often.
- Keep CLAUDE.md current (type `#` in Claude Code to quick-add a rule).
- Let Superpowers enforce red → green → refactor; only skip review for throwaway code.
