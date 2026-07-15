# EVE-266 — Eigenvector on boot, scrolled to the photo

**Linear:** EVE-266 (None) — Eigenvector should open on boot, scrolled to Buster's
picture + description "if possible".

## Feasibility
Cross-origin iframes can't be scrolled from the parent (browser security). But
eigenvector.pro serves an `id="about"` anchor (the "WHO" section with Buster's
photo/bio) in its initial HTML, so loading the iframe at `eigenvector.pro/#about`
makes the browser scroll there on load — works cross-origin.

## Changes
- `projectConfig.ts`: eigenvector url `https://eigenvector.pro/` →
  `https://eigenvector.pro/#about`.
- `bootLayout.ts`: add an `eigenvector` entry (760×580 at ~{430,110}) so it opens
  by default on the WHO section.

## Note
Boot is now 10 windows (the test cap) with 6 live iframes — heavier on first
paint. Flag for Buster; easy to trim later.

## Delivery
Branch off `main` → PR → comment + In Review.
