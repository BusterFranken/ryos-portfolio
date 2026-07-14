# Deferred / revisit later

Things intentionally parked during the portfolio build. None block deploy.

## Substack reader
**Status:** deferred — not enough content on Substack yet.
The `substack` app is still registered and built (ships "No posts yet"), but it's
been removed from the desktop featured set (`aquaDesktopApps.ts`) so visitors
don't open an empty reader. To bring it back:
1. Set a real publication feed URL in `scripts/fetch-substack.ts` (`FEED_URL`).
2. Re-add `"substack"` to `AQUA_DESKTOP_APP_IDS`.
3. (Optional) add it back to the boot layout.

## Tarot & Pawnshop — DONE (now live)
`tarotread.help` is back online and `pawnshop-qw60.onrender.com` went live, so
both are `mode: "live"` in `projectConfig.ts` and render as interactive iframes.
Pawnshop also opens on startup (`bootLayout.ts`).

## iPod — live Spotify feed
**Status:** needs an architecture decision. Buster wants the iPod to feature the
songs/albums he's been listening to lately, live. A static, no-backend SPA can't
poll Spotify's `/me/player/recently-played` (needs OAuth). Options:
- **Vercel serverless function** proxying Spotify recently-played, with Buster's
  refresh token stored as a Vercel env var (genuinely live; reintroduces one
  small secret + a function — we're on Vercel anyway).
- **Spotify embed iframe** of a public playlist Buster curates (no backend; he
  updates the playlist).
- **Static snapshot** — bake in a recent list at build time (not live).

## Maps — token-free base location
**Status:** deferred. The Maps app is built on Apple MapKit JS and needs a token
it doesn't have, so it currently shows a graceful no-map state. Buster wants a
simple "where I'm based" view centered on **Nieuwegrachtje, Amsterdam**. Cleanest
token-free path: replace the MapKit view with an **OpenStreetMap embed iframe**
(`openstreetmap.org/export/embed.html?bbox=…&marker=…`) centered on that spot, or
a Leaflet + OSM tiles map. This is a small feature build, not a config tweak.

## jDog & Workout — becoming live iframe apps (not gallery albums)
Buster is putting up **one-pager** sites for **jDog** and **Workout** on their own
domains, to be rendered as **live iframe project windows** (like tarot/pawnshop),
NOT as Gallery screenshot albums.
- **jDog:** one-pager coming soon → add a `jdog` live entry in `projectConfig.ts`
  + register the app + desktop icon, and remove the empty `jdog` gallery album.
- **Workout:** Buster has the domain, still needs to generate + publish the
  one-pager → then same treatment as jDog.
Once both are iframe apps, drop the empty `workout`/`jdog` albums from
`galleryConfig.ts` (Gallery then holds only Speaking + FruitPunch photos).

## Gallery — per-photo captions
- The 5 speaking/team photos are wired but the Gallery has no per-image caption
  field, so their rich context (European Commission talk, World Summit AI, etc.)
  lives only in album blurbs. Adding per-image captions is a small UI addition.

## Videos — descriptions
The Videos player only shows title + artist. If Buster wants the full FruitPunch
project descriptions (e.g. AI for Bears / Sea Turtles) surfaced, add a
`description?` field to `Video` and a details line/panel in the player.
