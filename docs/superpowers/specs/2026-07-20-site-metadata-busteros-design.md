# busterOS site metadata

**Date:** 2026-07-20
**Status:** Approved

## Problem

Link previews for `ryos-portfolio.vercel.app` still show the upstream ryOS branding:
title **ryOS**, description **"An AI OS experience, made with Cursor"**, and a preview
image served from `https://os.ryo.lu/`. The site is Buster's portfolio, not ryOS, and it
should not depend on the upstream author's domain for its preview assets.

## Goal

Every user-facing name and description identifies the site as **busterOS**, a portfolio,
and all preview assets are served from this project's own origin.

## Changes

### 1. `index.html` — `<head>` metadata

| Tag | New value |
|---|---|
| `<title>` | `busterOS` |
| `og:title` | `busterOS` |
| `twitter:title` | `busterOS` |
| `og:site_name` | `busterOS` |
| `apple-mobile-web-app-title` | `busterOS` |
| `description` | `A retro macOS desktop where every window is one of my projects.` |
| `og:description` | same as `description` |
| `twitter:description` | same as `description` |
| `og:url` | `https://portfolio.busterfranken.com/` |
| `og:image` | `https://portfolio.busterfranken.com/icons/mac-512.png` |
| `twitter:image` | `https://portfolio.busterfranken.com/icons/mac-512.png` |

All three descriptions must be byte-identical.

`twitter:card` stays `summary` (square card). The preview image stays the classic Mac
face — `public/icons/mac-512.png` already exists in this repo, so no new asset is added;
only the host in the absolute URL changes from `os.ryo.lu` to this project's origin.

### 2. `vite.config.ts` — VitePWA manifest block (~line 428)

`name`, `short_name`, and `description` currently read `ryOS` / `ryOS` /
`An AI OS experience, made with Cursor`. They become `busterOS` / `busterOS` / the
description above.

This block generates `dist/manifest.json`, which drives the Add-to-Home-Screen name. If
it is not updated the PWA still installs as "ryOS" even after `index.html` is fixed.

### 3. `tests/test-site-metadata.test.ts` — new regression test

Reads `index.html` and `vite.config.ts` as text and asserts:

- no `<meta>` tag's `content` value and no `<title>` text contains `ryOS` or `os.ryo.lu`.
  Scoped to the metadata tags, **not** the whole `<head>` — the inline stale-bundle boot
  script lives inside `<head>` (lines 71–208) and its `[ryOS]` console prefixes are
  deliberately out of scope.
- `<title>`, `og:title`, `twitter:title`, `og:site_name`, `apple-mobile-web-app-title` all equal `busterOS`
- `description`, `og:description`, `twitter:description` are all present and byte-identical
- `og:image` and `twitter:image` are absolute URLs on the site's own origin and point at a
  file that exists under `public/`
- the VitePWA manifest `name` / `short_name` equal `busterOS` and its `description` matches
  the HTML description

Written red-first (assert the new values before editing; confirm the test fails for the
right reason). Registered in the explicit `test:unit` file list in `package.json` —
that script names each test file individually, so a new file is not picked up automatically.

## Out of scope

- The `[ryOS]` console prefixes in the inline boot script in `index.html` (below `</head>`)
  and `ryOS` / `ryos:` identifiers throughout `src/`. These are internal and several are
  localStorage / IndexedDB key prefixes; renaming them would orphan existing user state
  for no user-visible benefit.
- Any change to `twitter:card` type or to the preview image artwork.

## Custom domain `portfolio.busterfranken.com` — DONE (2026-07-20)

DNS is live (Namecheap CNAME `portfolio` -> `cname.vercel-dns.com`, resolving via
`90522deb97e08464.vercel-dns-017.com`; verified HTTP 200). The metadata URLs now use
this origin, and the regression test asserts the origin is consistent, so a future
partial swap fails the suite.

Steps taken, kept as a record (the `.vercel.app` URL still serves the site too):

1. **Vercel** → the project → Settings → Domains → *Add* → `portfolio.busterfranken.com`.
2. Vercel shows the record to create. For a subdomain this is a **CNAME**:
   `portfolio` → `cname.vercel-dns.com`.
3. **DNS provider for `busterfranken.com`** (wherever the zone is hosted) → add that CNAME.
   TTL of 300–3600 is fine. Do not add an A record; the CNAME is sufficient for a subdomain.
4. Wait for Vercel's domain row to go green ("Valid Configuration"). Propagation is usually
   minutes; SSL is issued automatically once verification passes.
5. Then update `og:url`, `og:image`, `twitter:image` to `https://portfolio.busterfranken.com/…`
   and redeploy.

## Verification

- `bun run test:unit` passes, including the new test.
- `bun run build` succeeds and `dist/manifest.json` contains `busterOS`.
- `grep -n ryOS dist/index.html` finds only the internal `[ryOS]` console-prefix
  occurrences inside the boot script, and nothing in any `<meta>` or `<title>` tag.

## Note on preview caching

WhatsApp, iMessage and Slack cache Open Graph data per-URL, often for days. After deploying,
an existing chat may still render the old ryOS card. Appending a cache-buster
(`?v=2`) to the link forces a fresh scrape when confirming the fix.
