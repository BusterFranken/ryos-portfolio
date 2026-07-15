# EVE-263 — DnD CV: bigger, but behind

**Linear:** EVE-263 (Medium) — the DnD CV looks nicer at a large size, but it
should sit *behind* a few smaller windows, not in front of the other projects.

## Change
`bootLayout.ts`: the `dnd-cv` entry stays the first/back-most window; enlarge it
660×560 → **900×680** at ~`{100, 56}`. Because it's back-most and the later
entries (README/textedit, Videos, Gallery, jDog) render in front and overlap its
bounds, it reads as a large hero that's overlapped by smaller windows — never in
front.

## Note
Exact size is a judgment call (no live preview here); easy to nudge after eyeballing
the deploy.

## Delivery
Branch off `main` → PR → comment + In Review.
