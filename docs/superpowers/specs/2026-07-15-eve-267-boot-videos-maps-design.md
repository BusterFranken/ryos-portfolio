# EVE-267 — Videos, iPod & Maps open by default

**Linear:** EVE-267 (High) — "The video player, the iPod, Maps app (with my
location), should also be open by default. The things that don't have to be open
… are: mpoftheweek, hush, kafka form, pawnshop, buster barn, casefile."

## Decisions (confirmed with Buster)
- **Pawnshop:** follow the ticket — remove it from the boot layout (it opened on
  startup per an earlier direct request; the ticket supersedes that).
- **FruitPunch browser:** the **Videos app alone is enough** — no separate Finder
  "FruitPunch AI" window. Videos opens with the first FruitPunch talk loaded +
  paused and the full talk playlist to click through, which matches the mockup.

## Change (`src/config/bootLayout.ts`)
- Remove the `pawnshop` entry.
- Add `videos` — opens the Videos app (defaults to the first talk, paused, with
  the playlist). No initialData needed.
- Add `maps` — opens the "based in Amsterdam" OSM view. No initialData needed.
- iPod stays (already boots into Recently on Spotify). dnd-cv, IE-projects, jDog,
  Gallery, Contacts, read_me_first stay — the ticket's don't-open list only
  removes pawnshop from the current layout. Reposition the ~9 windows as curated
  overlapping chaos.

## Tests (`tests/test-boot-layout.test.ts`)
- Raise the window-count upper bound 8 → 10.
- Replace the "hero pairing + pawnshop" assertion with: dnd-cv + IE present, and
  **videos + ipod + maps** present.
- New test: none of `mpoftheweek, hush, kafka-form, pawnshop, buster-barn,
  casefile` appear in the boot layout.

## Out of scope (separate tickets)
EVE-263 (dnd-cv z-order), EVE-266 (Eigenvector scroll), EVE-264 (IE FruitPunch
page) refine the layout further — not touched here.

## Delivery
Branch `busterfranken/eve-267-…` off `main` → PR (no merge) → one comment on
EVE-267; set status to In Review.
