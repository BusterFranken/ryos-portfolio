# EVE-269 — Extra desktop icons

**Linear:** EVE-269 (None) — also add Virtual PC, Minesweeper, Synth, Winamp
icons to the desktop.

## Change
`aquaDesktopApps.ts`: append `pc`, `minesweeper`, `synth`, `winamp` to
`AQUA_DESKTOP_APP_IDS`. All four are registered apps with existing icons, so they
render on the desktop like the project/featured apps.

## Delivery
Branch off `main` → PR → comment + In Review.
