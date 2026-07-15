# EVE-265 — Scrub ryOS "signs"

**Linear:** EVE-265 (Medium) — the Internet Explorer bookmarks and other places
still carry ryOS/Ryo's branding; make it read as Buster's portfolio. Remove the
IE tabs: friends, ryOS docs, work, tools, sites.

## Decisions (confirmed)
- **IE bookmarks:** replace Ryo's set with Buster's own.
- **Scope:** also neutralize the per-app About-dialog creator credits (→ Buster),
  while keeping the required ryOS attribution in the "About this site" doc (AGPL).

## Changes
- **`useInternetExplorerStore.ts`:** rewrite `DEFAULT_FAVORITES` to Apple, Buster
  (busterfranken.com), a **Projects** folder (Eigenvector, MP of the Week, Tarot,
  Pawnshop, jDog), FruitPunch AI, GitHub, LinkedIn. Bump `CURRENT_IE_STORE_VERSION`
  6→7 **and** `RESET_IE_STORE_BEFORE_VERSION` 5→7 so existing visitors (incl.
  Buster) get the new defaults, not the persisted Ryo set. (Internal
  `DIRECT_PASSTHROUGH_DOMAINS` left as-is — not a visible sign.)
- **Per-app About metadata (22 files):** `creator.name` "Ryo Lu"/"Ryo" → "Buster
  Franken", `url` ryo.lu → busterfranken.com, `github` ryokun6/ryos →
  BusterFranken/ryos-portfolio.
- **About-dialog "View Docs / Changelog" links** (AboutDialog, AboutFinderDialog,
  Control-Panels VersionDisplay): `os.ryo.lu/docs/…` → busterfranken.com (frames
  cleanly, no ryOS, no 404). Removed the now-unused `APP_DOC_NAMES`.

## Kept (intentional)
The "About this site" doc still credits ryOS / Ryo Lu / github.com/ryokun6/ryos —
required by AGPL and honest for a fork.

## Delivery
Branch off `main` → PR → comment + In Review.
