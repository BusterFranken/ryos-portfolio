# Go — 9×9 Go board app

**Source:** direct request (no Linear ticket) — "a small 9×9 Go board with nice
graphics where you start playing and the computer plays back, opened by clicking
a desktop item, with a fitting image."

**Confirmed with Buster:** heuristic bot · casual rules with automatic
Tromp-Taylor scoring · drawn wooden goban (no photo texture).

A new self-contained interactive app that follows the **minesweeper template**
(local `useState` in a hook, no Zustand store, ephemeral game state). You play
**Black** and move first; the computer plays **White**.

## Module layout — `src/apps/go/`
| File | Purpose |
|---|---|
| `logic/goEngine.ts` | **Pure, React-free** rules: legality, capture resolution, ko, Tromp-Taylor scoring, and the bot. The testable core. |
| `hooks/useGoGame.ts` | Local `useState` game state; drives human→bot turn flow, sounds, help/about (mirrors `useMinesweeperLogic`). |
| `components/GoAppComponent.tsx` | Window shell + status bar + New Game / Pass controls; theme-aware menu-bar wiring (see `base/types.ts` note). |
| `components/GoBoard.tsx` | The SVG board view (grid, star points, stones, hover ghost). |
| `components/GoMenuBar.tsx` | File ▸ New Game / Pass, plus Help / About. |
| `index.ts` | `appMetadata` + `helpItems` (same shape as `minesweeper/index.ts`). |

## Engine (`goEngine.ts`) — pure functions
- **Board** = flat `Point[]` of length 81 (`Point = "black" | "white" | null`),
  index `row * 9 + col`. `Stone = "black" | "white"`.
- **GameState** = `{ board, toMove, koPoint, captures: {black, white}, passes,
  status: "playing" | "finished", result? }`. `captures.black` = stones Black
  has captured (White prisoners), and vice-versa.
- `neighbors(idx)` — orthogonal in-bounds neighbours.
- `group(board, idx)` — flood-fill same-colour group + its liberty set.
- `applyMove(state, idx): GameState | null` —
  1. reject if point non-empty;
  2. place `toMove` stone;
  3. remove each adjacent **opponent** group with 0 liberties, adding to the
     mover's capture count;
  4. reject **suicide** — placed group has 0 liberties *and* nothing was
     captured → return `null`;
  5. reject **ko** — playing on `koPoint` is illegal;
  6. recompute `koPoint`: set to the captured point **only** when the move
     captured exactly one stone and the placed stone is a lone stone with one
     liberty (classic single-point ko); otherwise `null`;
  7. flip `toMove`, reset `passes` to 0.
- `pass(state): GameState` — flip `toMove`, clear `koPoint`, `passes + 1`; on the
  **second consecutive pass** set `status = "finished"` and fill `result` via
  `score`.
- `isLegalMove(state, idx): boolean` — wraps `applyMove` (used for hover +
  bot candidate filtering).
- `score(board): { blackScore, whiteScore, winner }` — **Tromp-Taylor area
  scoring**: area(colour) = own stones + empty points that reach *only* that
  colour; regions touching both colours are neutral. **Komi 5.5** added to White.
  No manual dead-stone marking.
- `bot(state): number | "pass"` — from the legal moves for the side to move
  (White): **never fill a true eye** (empty point orthogonally surrounded by own
  stones/edge with own control of the diagonals), avoid self-atari (a move
  leaving the new group on one liberty) unless it captures; score candidates —
  captures (weighted by count) ≫ putting an opponent group in atari > locality
  near existing stones; tiny random tiebreak. If no candidate scores above a
  small threshold, **pass** (guarantees the game can end).

## Hook (`useGoGame.ts`)
- Holds `GameState` (`useState`), initial empty board, Black to move.
- `place(idx)` — ignore unless it's the human's turn and game is live; apply
  move if legal, play a stone sound, then after ~400 ms `setTimeout` (a
  "thinking" beat) apply the bot's reply and its sound.
- `pass()` — human passes, then the bot responds (it may pass → game ends and
  scores).
- `newGame()` — reset to empty board.
- Derived for the view: `toMove`, `koPoint`, `captures`, `lastMove`, `status`,
  `result`, and a `thinking` flag while the bot's timeout is pending.
- Help/About via `useAppHelpAboutDialogs`; sounds via `useSound`; light
  analytics like minesweeper (optional).
- **No undo in v1** (YAGNI). New Game + Pass only.

## Graphics — drawn wooden goban (`GoBoard.tsx`)
Single SVG scaled to the window. Warm wood-tone background (layered CSS/SVG
gradients — no external texture); 9×9 grid; 5 star points (four 3-3 points +
tengen, 0-indexed `(2,2)(2,6)(6,2)(6,6)(4,4)`); stones as radial-gradient
circles (glossy top-left highlight, soft drop shadow) — Black dark, White light
with a faint rim; **ghost stone** on hover over empty legal points (desktop),
tap-to-place on mobile; a small dot marks the last move. Vector → crisp in all
four OS themes. Status bar shows both prisoner counts and whose turn
("Computer thinking…"); result banner on finish ("Black wins by 4.5").

## The "fitting image"
A sourced **Apple-style Go icon** (goban + stones), ≥512 px, license/attribution
checked → `public/icons/default/go.png`, referenced by `appMetadata.icon` and
the registry entry (matches how `minesweeper` uses `/icons/default/`). Board is
drawn, so no board texture asset is needed. **Fallback** if nothing cleanly
licensable is found: an SVG-rendered mini-goban exported to PNG.

## Wiring edits
- `src/config/appRegistryData.ts` — add `"go"` to `appIds` and `appNames`
  (`go: "Go"`).
- `src/apps/base/types.ts` — add `"go"` to the `BaseApp["id"]` union.
- `src/config/appRegistry.tsx` — lazy import of `GoAppComponent` +
  `import { appMetadata, helpItems } from "@/apps/go"`; a `["go"]` registry entry
  with `icon: { type: "image", src: goMetadata.icon }` and a fixed
  `windowConfig` (square, ≈ `{ width: 360, height: 440 }`, min = max like
  minesweeper).
- `src/components/layout/desktop/aquaDesktopApps.ts` — append `"go"` to
  `AQUA_DESKTOP_APP_IDS` so it renders as a **clickable desktop icon**.

## Testing (TDD; runner = `bun test`)
New `tests/test-go-engine.test.ts` (bun:test), **added to the `test:unit` file
list in `package.json`**. Cases:
- neighbours/edges;
- single-stone capture + prisoner count; multi-stone group capture;
- suicide illegal; suicide-that-captures legal (fills opponent's last liberty);
- ko: immediate recapture on `koPoint` illegal, legal after a move elsewhere,
  `koPoint` cleared by a pass;
- two passes → `finished` + scored;
- Tromp-Taylor: sole-colour region owned, mixed region neutral, komi 5.5 to
  White, winner correct;
- bot: returns only legal moves, never fills a true eye, takes an available
  capture, passes when only eye-filling/self-atari remain.
- Keep `tests/test-aqua-desktop-apps.test.ts` green (update its expectations if
  it asserts the exact desktop-app set).

A light hook/component smoke test is optional — engine tests carry correctness.

## Defaults (set, not asked)
Human = Black, moves first · komi 5.5 · area (Tromp-Taylor) scoring · no undo ·
~400 ms bot delay · fixed square window.

## Delivery
Branch off `main` → build (`bun run build`) + `bun run test:unit` green → PR (no
auto-merge), per repo convention.
