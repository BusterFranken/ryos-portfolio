# EVE-264 — IE FruitPunch page on boot

**Linear:** EVE-264 (None) — Internet Explorer with the FruitPunch project page
should be open by default.

## Status
Largely satisfied already by the merged EVE-267 boot work: IE boots to
`busterfranken.com/projects.html`, which is the FruitPunch AI project board.

## Change
`bootLayout.ts`: retitle that IE window "Projects — busterfranken.com" →
**"FruitPunch AI — Projects"** so the FruitPunch framing is explicit on boot
(the URL is unchanged).

## Delivery
Branch off `main` → PR → comment + In Review.
