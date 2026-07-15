# EVE-270 — Delay the millionth-visitor gag

**Linear:** EVE-270 (High) — "Only trigger the timed message of 'you're the
millionth visitor' after a couple of minutes."

## Problem
The Buster-Barn easter-egg gag (`src/components/BusterBarnGag.tsx`) fires its
fake millionth-visitor **prize** popup at 10s and escalates to a fake
"Run BusterBarn_Setup.exe" **warning** at 30s. That's too eager — it catches a
new visitor's eye before they've explored the portfolio.

## Change
Delay both timers so the gag only surfaces for a lingering visitor:
- `PRIZE_DELAY_MS`: 10_000 → **120_000** (2 min)
- `EXE_DELAY_MS`: 30_000 → **150_000** (2:30)

Update the file's docstring comment to match (currently "~10s" / "~30s").

## Unchanged
- Once-per-session `sessionStorage` guard (`ryos:barn-gag-shown`).
- The looping "offer expires" fake countdown inside the prize popup.
- Z-index and accept → launch-Buster-Barn-fullscreen behavior.

## Testing
Export the two delay constants and add a small unit test asserting the intent:
the prize waits at least "a couple of minutes" (`PRIZE_DELAY_MS >= 120_000`) and
the escalation lands **after** the prize (`EXE_DELAY_MS > PRIZE_DELAY_MS`). This
guards against a regression back to the eager 10s/30s timing. Build + full
`test:unit` green.

## Delivery
Branch `busterfranken/eve-270-…` off `main` → PR (no merge) → one comment on
EVE-270 with the summary + PR link.
