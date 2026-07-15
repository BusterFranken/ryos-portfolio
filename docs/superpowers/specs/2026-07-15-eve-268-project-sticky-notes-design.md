# EVE-268 — Project-info sticky notes

**Linear:** EVE-268 (None) — add a few sticky notes with info about the projects
/ anything interesting; a suggestion for viewers.

## Change
`useStickiesStore.ts`: add three seeded notes (stable ids) alongside the existing
hidden easter-egg note:
- welcome / OS-switch tip
- Eigenvector (current live project)
- FruitPunch AI (founded; talks in the Videos app)

Seed them in the initial state and add a v1→2 migration so existing visitors get
them too (idempotent by id). Notes render when the Stickies app is opened.

## Note
Notes are visible when the Stickies app is open. If they should show on startup,
Stickies can be added to the boot layout / desktop set — left out for now to avoid
crowding the boot.

## Delivery
Branch off `main` → PR → comment + In Review.
