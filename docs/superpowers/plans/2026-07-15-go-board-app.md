# Go — 9×9 Go Board App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a self-contained "Go" app — a 9×9 board where the visitor plays Black and a heuristic bot replies as White — opened from a desktop icon.

**Architecture:** A pure, React-free rules engine (`goEngine.ts`) holds all logic (legality, capture, ko, Tromp-Taylor scoring, the bot) and is unit-tested with `bun:test`. A `useGoGame` hook wraps it with local `useState`, driving the human→bot turn flow. An SVG `GoBoard` renders a wooden goban. The app follows the **minesweeper template** exactly (`AppWindowShell` + `AppMenuBarShell` + `AppHelpAboutDialogs`) and registers through the standard app-registry + `AQUA_DESKTOP_APP_IDS` desktop-icon path.

**Tech Stack:** React 19 · TypeScript · Tailwind · Vite · Bun runtime · `bun test` (happy-dom available). No new dependencies.

## Global Constraints

- **License:** AGPL-3.0 — source stays public; no proprietary assets. Any sourced icon must be license/attribution-checked.
- **Static SPA:** no backend, no API keys, no network calls. Engine + UI are fully client-side.
- **New app MUST register through the app-registry pattern** (`appRegistryData.ts` + `appRegistry.tsx`) — never hardcode into the desktop.
- **`AppId` is exhaustively mapped** in three places — adding `"go"` REQUIRES an entry in each or the build fails: `appNames` (`src/config/appRegistryData.ts`), `HELP_KEYS` (`src/hooks/useTranslatedHelpItems.ts`), `helpKeys` (`src/utils/i18n.ts`).
- **Test runner is `bun test`.** `test:unit` runs an **explicit file list** in `package.json` — new test files MUST be appended there to run.
- **Board indexing convention (used everywhere):** flat array of 81, `index = row * 9 + col`, `row`/`col` in `0..8`.
- **Colors/roles:** human = Black and moves first; computer = White. Komi = 5.5 to White. Area (Tromp-Taylor) scoring.
- **Before committing the feature:** `bun run build` and `bun run test:unit` must pass.

---

### Task 1: Engine core — board, groups, `applyMove` (place / capture / suicide / ko)

**Files:**
- Create: `src/apps/go/logic/goEngine.ts`
- Test: `tests/test-go-engine.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces:
  - `BOARD_SIZE = 9`, `KOMI = 5.5` constants.
  - `type Stone = "black" | "white"`, `type Point = Stone | null`, `type Board = Point[]`.
  - `interface GameResult { blackScore: number; whiteScore: number; winner: Stone }`
  - `interface GameState { board: Board; toMove: Stone; koPoint: number | null; captures: { black: number; white: number }; passes: number; lastMove: number | null; status: "playing" | "finished"; result: GameResult | null }`
  - `idx(row, col): number`, `rowOf(i): number`, `colOf(i): number`, `opponent(c: Stone): Stone`, `neighbors(i): number[]`, `groupAndLiberties(board, i): { stones: number[]; liberties: number }`, `createInitialState(): GameState`, `applyMove(state, i): GameState | null`, `isLegalMove(state, i): boolean`.
  - `captures.black` = count of stones **Black has captured** (i.e. White prisoners); `captures.white` likewise.

- [ ] **Step 1: Write the failing tests**

Create `tests/test-go-engine.test.ts`:

```ts
import { describe, test, expect } from "bun:test";
import {
  createInitialState,
  applyMove,
  isLegalMove,
  neighbors,
  idx,
  type Board,
  type GameState,
} from "../src/apps/go/logic/goEngine";

function emptyBoard(): Board {
  return Array(81).fill(null);
}

function stateWith(
  board: Board,
  toMove: "black" | "white" = "black",
  extra: Partial<GameState> = {}
): GameState {
  return {
    board,
    toMove,
    koPoint: null,
    captures: { black: 0, white: 0 },
    passes: 0,
    lastMove: null,
    status: "playing",
    result: null,
    ...extra,
  };
}

describe("goEngine — board & neighbors", () => {
  test("neighbors count: corner 2, edge 3, center 4", () => {
    expect(neighbors(idx(0, 0)).length).toBe(2);
    expect(neighbors(idx(0, 4)).length).toBe(3);
    expect(neighbors(idx(4, 4)).length).toBe(4);
  });

  test("initial state: empty board, black to move", () => {
    const s = createInitialState();
    expect(s.board.every((p) => p === null)).toBe(true);
    expect(s.toMove).toBe("black");
    expect(s.status).toBe("playing");
  });
});

describe("goEngine — captures", () => {
  test("captures a single surrounded stone", () => {
    const b = emptyBoard();
    b[idx(4, 4)] = "white";
    b[idx(3, 4)] = "black";
    b[idx(5, 4)] = "black";
    b[idx(4, 3)] = "black";
    const s = stateWith(b, "black");
    const next = applyMove(s, idx(4, 5)); // last liberty
    expect(next).not.toBeNull();
    expect(next!.board[idx(4, 4)]).toBeNull();
    expect(next!.captures.black).toBe(1);
  });

  test("captures a multi-stone group", () => {
    const b = emptyBoard();
    b[idx(4, 4)] = "white";
    b[idx(4, 5)] = "white";
    // surround both except (4,6)
    b[idx(3, 4)] = "black";
    b[idx(5, 4)] = "black";
    b[idx(4, 3)] = "black";
    b[idx(3, 5)] = "black";
    b[idx(5, 5)] = "black";
    const s = stateWith(b, "black");
    const next = applyMove(s, idx(4, 6));
    expect(next).not.toBeNull();
    expect(next!.board[idx(4, 4)]).toBeNull();
    expect(next!.board[idx(4, 5)]).toBeNull();
    expect(next!.captures.black).toBe(2);
  });
});

describe("goEngine — suicide", () => {
  test("plain suicide is illegal", () => {
    const b = emptyBoard();
    b[idx(0, 1)] = "white";
    b[idx(1, 0)] = "white";
    const s = stateWith(b, "black");
    expect(applyMove(s, idx(0, 0))).toBeNull();
    expect(isLegalMove(s, idx(0, 0))).toBe(false);
  });

  test("suicide that captures is legal", () => {
    const b = emptyBoard();
    // two white stones each with their only liberty at (0,0)
    b[idx(0, 1)] = "white";
    b[idx(1, 0)] = "white";
    b[idx(0, 2)] = "black";
    b[idx(1, 1)] = "black";
    b[idx(2, 0)] = "black";
    const s = stateWith(b, "black");
    const next = applyMove(s, idx(0, 0));
    expect(next).not.toBeNull();
    expect(next!.board[idx(0, 0)]).toBe("black");
    expect(next!.board[idx(0, 1)]).toBeNull();
    expect(next!.board[idx(1, 0)]).toBeNull();
    expect(next!.captures.black).toBe(2);
  });
});

describe("goEngine — ko", () => {
  // Textbook ko around (1,2); black captures the white stone at (1,1).
  //   col: 0 1 2 3
  // row0:  . X O .
  // row1:  X O _ O
  // row2:  . X O .
  function koBoard(): Board {
    const b = emptyBoard();
    b[idx(0, 1)] = "black";
    b[idx(0, 2)] = "white";
    b[idx(1, 0)] = "black";
    b[idx(1, 1)] = "white";
    b[idx(1, 3)] = "white";
    b[idx(2, 1)] = "black";
    b[idx(2, 2)] = "white";
    return b;
  }

  test("ko forbids immediate recapture, clears after another move", () => {
    const s0 = stateWith(koBoard(), "black");
    const s1 = applyMove(s0, idx(1, 2));
    expect(s1).not.toBeNull();
    expect(s1!.board[idx(1, 1)]).toBeNull(); // white captured
    expect(s1!.captures.black).toBe(1);
    expect(s1!.koPoint).toBe(idx(1, 1));
    // white may not immediately retake at (1,1)
    expect(isLegalMove(s1!, idx(1, 1))).toBe(false);
    // but may play elsewhere
    expect(isLegalMove(s1!, idx(8, 8))).toBe(true);
    // after white plays elsewhere the ko is no longer pending
    const s2 = applyMove(s1!, idx(8, 8));
    expect(s2).not.toBeNull();
    expect(s2!.koPoint).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test tests/test-go-engine.test.ts`
Expected: FAIL — cannot resolve `../src/apps/go/logic/goEngine` (module not found).

- [ ] **Step 3: Write the engine core**

Create `src/apps/go/logic/goEngine.ts`:

```ts
export const BOARD_SIZE = 9;
export const KOMI = 5.5;

export type Stone = "black" | "white";
export type Point = Stone | null;
export type Board = Point[]; // length 81, index = row * 9 + col

export interface GameResult {
  blackScore: number;
  whiteScore: number;
  winner: Stone;
}

export interface GameState {
  board: Board;
  toMove: Stone;
  /** Point index forbidden by the ko rule this turn, or null. */
  koPoint: number | null;
  /** Stones each colour has captured (captures.black = White prisoners). */
  captures: { black: number; white: number };
  /** Consecutive passes. */
  passes: number;
  /** Index of the last stone placed (for the board marker); null after a pass. */
  lastMove: number | null;
  status: "playing" | "finished";
  result: GameResult | null;
}

export function idx(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}
export function rowOf(i: number): number {
  return Math.floor(i / BOARD_SIZE);
}
export function colOf(i: number): number {
  return i % BOARD_SIZE;
}
export function opponent(color: Stone): Stone {
  return color === "black" ? "white" : "black";
}

export function neighbors(i: number): number[] {
  const r = rowOf(i);
  const c = colOf(i);
  const res: number[] = [];
  if (r > 0) res.push(i - BOARD_SIZE);
  if (r < BOARD_SIZE - 1) res.push(i + BOARD_SIZE);
  if (c > 0) res.push(i - 1);
  if (c < BOARD_SIZE - 1) res.push(i + 1);
  return res;
}

/** Flood-fill the same-colour group containing `i` and count its liberties. */
export function groupAndLiberties(
  board: Board,
  i: number
): { stones: number[]; liberties: number } {
  const color = board[i];
  if (color === null) return { stones: [], liberties: 0 };
  const stones: number[] = [];
  const seen = new Set<number>([i]);
  const libs = new Set<number>();
  const stack = [i];
  while (stack.length) {
    const cur = stack.pop() as number;
    stones.push(cur);
    for (const n of neighbors(cur)) {
      if (board[n] === null) libs.add(n);
      else if (board[n] === color && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return { stones, liberties: libs.size };
}

export function createInitialState(): GameState {
  return {
    board: Array(BOARD_SIZE * BOARD_SIZE).fill(null),
    toMove: "black",
    koPoint: null,
    captures: { black: 0, white: 0 },
    passes: 0,
    lastMove: null,
    status: "playing",
    result: null,
  };
}

/**
 * Apply a stone placement for `state.toMove` at index `i`.
 * Returns the resulting state, or null if the move is illegal
 * (occupied point, ko, or suicide).
 */
export function applyMove(state: GameState, i: number): GameState | null {
  if (state.status !== "playing") return null;
  if (i < 0 || i >= BOARD_SIZE * BOARD_SIZE) return null;
  if (state.board[i] !== null) return null;
  if (state.koPoint === i) return null;

  const color = state.toMove;
  const opp = opponent(color);
  const board = state.board.slice();
  board[i] = color;

  // Remove any adjacent opponent group that now has zero liberties.
  const captured: number[] = [];
  for (const n of neighbors(i)) {
    if (board[n] === opp) {
      const g = groupAndLiberties(board, n);
      if (g.liberties === 0) {
        for (const s of g.stones) board[s] = null;
        captured.push(...g.stones);
      }
    }
  }

  // Suicide: the placed group has no liberties and nothing was captured.
  const selfGroup = groupAndLiberties(board, i);
  if (selfGroup.liberties === 0 && captured.length === 0) return null;

  // Classic single-point ko: exactly one stone captured and the placing stone
  // is itself a lone stone with a single liberty -> forbid retaking that point.
  let koPoint: number | null = null;
  if (
    captured.length === 1 &&
    selfGroup.stones.length === 1 &&
    selfGroup.liberties === 1
  ) {
    koPoint = captured[0];
  }

  const captures = { ...state.captures };
  captures[color] += captured.length;

  return {
    board,
    toMove: opp,
    koPoint,
    captures,
    passes: 0,
    lastMove: i,
    status: "playing",
    result: null,
  };
}

export function isLegalMove(state: GameState, i: number): boolean {
  return applyMove(state, i) !== null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test tests/test-go-engine.test.ts`
Expected: PASS — all "board & neighbors", "captures", "suicide", and "ko" tests green.

- [ ] **Step 5: Commit**

```bash
git add src/apps/go/logic/goEngine.ts tests/test-go-engine.test.ts
git commit -m "feat(go): rules engine core — capture, suicide, ko"
```

---

### Task 2: Engine — `pass` + Tromp-Taylor `score`

**Files:**
- Modify: `src/apps/go/logic/goEngine.ts`
- Test: `tests/test-go-engine.test.ts` (append)

**Interfaces:**
- Consumes: `GameState`, `Board`, `GameResult`, `neighbors`, `KOMI` (Task 1).
- Produces: `pass(state): GameState`, `score(board): GameResult`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/test-go-engine.test.ts`:

```ts
import { pass, score } from "../src/apps/go/logic/goEngine";

describe("goEngine — pass & game end", () => {
  test("two consecutive passes finish the game and score it", () => {
    const s0 = createInitialState();
    const s1 = pass(s0);
    expect(s1.status).toBe("playing");
    expect(s1.passes).toBe(1);
    const s2 = pass(s1);
    expect(s2.status).toBe("finished");
    expect(s2.result).not.toBeNull();
    // Empty board: no territory owned; White wins on komi alone.
    expect(s2.result!.winner).toBe("white");
  });

  test("a move between passes resets the pass counter", () => {
    const s0 = createInitialState();
    const s1 = pass(s0); // black passes
    const s2 = applyMove(s1, idx(4, 4)); // white plays
    expect(s2).not.toBeNull();
    expect(s2!.passes).toBe(0);
  });
});

describe("goEngine — Tromp-Taylor scoring", () => {
  test("empty region reaching one colour is that colour's area", () => {
    const b = emptyBoard();
    b[idx(0, 0)] = "black";
    const r = score(b);
    expect(r.blackScore).toBe(81); // 1 stone + 80 empty points reaching only black
    expect(r.whiteScore).toBeCloseTo(5.5);
    expect(r.winner).toBe("black");
  });

  test("region reaching both colours is neutral; komi decides", () => {
    const b = emptyBoard();
    b[idx(0, 0)] = "black";
    b[idx(8, 8)] = "white";
    const r = score(b);
    expect(r.blackScore).toBe(1);
    expect(r.whiteScore).toBeCloseTo(6.5);
    expect(r.winner).toBe("white");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test tests/test-go-engine.test.ts`
Expected: FAIL — `pass` and `score` are not exported (import error / not a function).

- [ ] **Step 3: Implement `pass` and `score`**

Append to `src/apps/go/logic/goEngine.ts`:

```ts
/** Pass for the side to move. Two consecutive passes finish and score the game. */
export function pass(state: GameState): GameState {
  if (state.status !== "playing") return state;
  const passes = state.passes + 1;
  const base: GameState = {
    ...state,
    toMove: opponent(state.toMove),
    koPoint: null,
    passes,
    lastMove: null,
  };
  if (passes >= 2) {
    return { ...base, status: "finished", result: score(state.board) };
  }
  return base;
}

/**
 * Tromp-Taylor area scoring: area(colour) = own stones + empty points that
 * reach only that colour. Regions touching both colours are neutral (dame).
 * White receives KOMI. Assumes dead stones have already been captured.
 */
export function score(board: Board): GameResult {
  let black = 0;
  let white = 0;
  for (const p of board) {
    if (p === "black") black++;
    else if (p === "white") white++;
  }

  const seen = new Set<number>();
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== null || seen.has(i)) continue;
    const region: number[] = [];
    const border = new Set<Stone>();
    const stack = [i];
    seen.add(i);
    while (stack.length) {
      const cur = stack.pop() as number;
      region.push(cur);
      for (const n of neighbors(cur)) {
        const p = board[n];
        if (p === null) {
          if (!seen.has(n)) {
            seen.add(n);
            stack.push(n);
          }
        } else {
          border.add(p);
        }
      }
    }
    if (border.size === 1) {
      if (border.has("black")) black += region.length;
      else white += region.length;
    }
    // border.size === 0 (whole board empty) or 2 (dame) -> neutral.
  }

  const blackScore = black;
  const whiteScore = white + KOMI;
  return {
    blackScore,
    whiteScore,
    winner: blackScore > whiteScore ? "black" : "white",
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test tests/test-go-engine.test.ts`
Expected: PASS — pass/end and scoring tests green (plus all Task 1 tests).

- [ ] **Step 5: Commit**

```bash
git add src/apps/go/logic/goEngine.ts tests/test-go-engine.test.ts
git commit -m "feat(go): pass + Tromp-Taylor area scoring"
```

---

### Task 3: Engine — heuristic bot

**Files:**
- Modify: `src/apps/go/logic/goEngine.ts`
- Test: `tests/test-go-engine.test.ts` (append)

**Interfaces:**
- Consumes: `GameState`, `applyMove`, `isLegalMove`, `groupAndLiberties`, `neighbors`, `opponent`, `idx`, `rowOf`, `colOf` (Tasks 1–2).
- Produces: `isTrueEye(board, i, color): boolean`, `bot(state): number | "pass"`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/test-go-engine.test.ts`:

```ts
import { bot } from "../src/apps/go/logic/goEngine";

describe("goEngine — bot", () => {
  test("returns a legal move from the opening position", () => {
    const s = createInitialState();
    const m = bot(s);
    expect(m).not.toBe("pass");
    expect(isLegalMove(s, m as number)).toBe(true);
  });

  test("takes an available capture", () => {
    const b = emptyBoard();
    b[idx(4, 4)] = "black";
    b[idx(3, 4)] = "white";
    b[idx(5, 4)] = "white";
    b[idx(4, 3)] = "white";
    const s = stateWith(b, "white"); // white can capture at (4,5)
    expect(bot(s)).toBe(idx(4, 5));
  });

  test("never fills its own true eye", () => {
    const b = emptyBoard();
    // White wall + diagonals around an empty eye at (4,4).
    for (const [r, c] of [
      [3, 4],
      [5, 4],
      [4, 3],
      [4, 5],
      [3, 3],
      [3, 5],
      [5, 3],
      [5, 5],
    ]) {
      b[idx(r, c)] = "white";
    }
    const s = stateWith(b, "white");
    expect(bot(s)).not.toBe(idx(4, 4));
  });

  test("passes when its only legal points are its own eyes", () => {
    const b: Board = Array(81).fill("black");
    b[idx(0, 0)] = null; // black eye
    b[idx(8, 8)] = null; // black eye
    const s = stateWith(b, "white"); // both empties are suicide for white
    expect(bot(s)).toBe("pass");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun test tests/test-go-engine.test.ts`
Expected: FAIL — `bot` is not exported.

- [ ] **Step 3: Implement `isTrueEye` and `bot`**

Append to `src/apps/go/logic/goEngine.ts`:

```ts
/**
 * True-eye heuristic: an empty point orthogonally surrounded by `color`, whose
 * diagonals are controlled by `color` (all of them on an edge/corner, or all
 * but at most one in the interior). Used so the bot never fills its own eyes.
 */
export function isTrueEye(board: Board, i: number, color: Stone): boolean {
  if (board[i] !== null) return false;
  for (const n of neighbors(i)) {
    if (board[n] !== color) return false;
  }
  const r = rowOf(i);
  const c = colOf(i);
  const diagonals = [
    [r - 1, c - 1],
    [r - 1, c + 1],
    [r + 1, c - 1],
    [r + 1, c + 1],
  ];
  let offBoard = 0;
  let notColor = 0;
  for (const [dr, dc] of diagonals) {
    if (dr < 0 || dr >= BOARD_SIZE || dc < 0 || dc >= BOARD_SIZE) {
      offBoard++;
      continue;
    }
    if (board[idx(dr, dc)] !== color) notColor++;
  }
  const allowed = offBoard > 0 ? 0 : 1;
  return notColor <= allowed;
}

/**
 * Heuristic move for the side to move. Scores every legal, non-eye-filling
 * point (captures >> putting a group in atari > locality; self-atari penalised)
 * and returns the best, or "pass" when nothing is worth playing.
 */
export function bot(state: GameState): number | "pass" {
  if (state.status !== "playing") return "pass";
  const color = state.toMove;
  const opp = opponent(color);

  let bestIdx = -1;
  let bestScore = -Infinity;

  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
    if (state.board[i] !== null) continue;
    if (isTrueEye(state.board, i, color)) continue;
    const next = applyMove(state, i);
    if (!next) continue;

    let s = 0;
    const capturedNow = next.captures[color] - state.captures[color];
    s += capturedNow * 12;

    const myGroup = groupAndLiberties(next.board, i);
    if (myGroup.liberties === 1 && capturedNow === 0) s -= 8; // self-atari

    for (const n of neighbors(i)) {
      if (next.board[n] === opp) {
        const g = groupAndLiberties(next.board, n);
        if (g.liberties === 1) s += 3; // puts opponent group in atari
      }
      if (state.board[n] !== null) s += 1; // locality: play near stones
    }

    s += Math.random() * 0.5; // tiebreak so play isn't deterministic

    if (s > bestScore) {
      bestScore = s;
      bestIdx = i;
    }
  }

  if (bestIdx === -1) return "pass";
  if (bestScore < 0) return "pass"; // only bad (self-atari) moves remain
  return bestIdx;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun test tests/test-go-engine.test.ts`
Expected: PASS — all bot tests green (plus Tasks 1–2).

- [ ] **Step 5: Commit**

```bash
git add src/apps/go/logic/goEngine.ts tests/test-go-engine.test.ts
git commit -m "feat(go): heuristic bot (captures, avoids eye-fill & self-atari)"
```

---

### Task 4: App module — metadata, hook, board, menu bar, component

**Files:**
- Create: `src/apps/go/index.ts`
- Create: `src/apps/go/hooks/useGoGame.ts`
- Create: `src/apps/go/components/GoBoard.tsx`
- Create: `src/apps/go/components/GoMenuBar.tsx`
- Create: `src/apps/go/components/GoAppComponent.tsx`

**Interfaces:**
- Consumes: engine exports (Tasks 1–3); shared UI: `AppWindowShell`, `AppMenuBarShell`, `AppMenuBarMenus`, `useAppMenuBarChrome`, `AppHelpAboutDialogs`, `useAppHelpAboutDialogs`, `useTranslatedHelpItems`, `useThemeFlags`, `useSound`/`Sounds`, `ConfirmDialog`, `Button`, `cn`, `AppProps`.
- Produces: `appMetadata`, `helpItems` (from `index.ts`); `useGoGame()`; `GoBoard`; `GoMenuBar`; `GoAppComponent` (named export). These have no unit test — the engine tests carry logic correctness and the UI is verified by running the app after Task 5. `useTranslatedHelpItems("go", …)` is safe now because Task 5 adds `go: []` to the help-key maps; this task must land together with Task 5 before the app is opened.

- [ ] **Step 1: Create `src/apps/go/index.ts`**

```ts
export const appMetadata = {
  name: "Go",
  version: "1.0.0",
  creator: {
    name: "Buster Franken",
    url: "https://www.busterfranken.com",
  },
  github: "https://github.com/BusterFranken/ryos-portfolio",
  icon: "/icons/default/go.png",
};

export const helpItems = [
  {
    icon: "⚫",
    title: "Place a Stone",
    description:
      "You play Black. Click or tap an empty intersection to place a stone; the computer replies as White.",
  },
  {
    icon: "⚔️",
    title: "Capture",
    description:
      "Surround an opponent group so it has no empty adjacent points (liberties) left, and it is removed from the board.",
  },
  {
    icon: "🚫",
    title: "Illegal Moves",
    description:
      "You cannot play self-capture (suicide) or immediately retake a single stone in a ko.",
  },
  {
    icon: "⏭️",
    title: "Pass",
    description:
      "Use File ▸ Pass when you have no useful move. Two passes in a row end the game.",
  },
  {
    icon: "🏆",
    title: "Scoring",
    description:
      "At the end, area scoring counts your stones plus the empty points only you surround. White gets 5.5 komi.",
  },
  {
    icon: "🔄",
    title: "New Game",
    description:
      "File ▸ New Game clears the board and starts over. You always move first as Black.",
  },
];
```

- [ ] **Step 2: Create `src/apps/go/hooks/useGoGame.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppHelpAboutDialogs } from "@/hooks/useAppHelpAboutDialogs";
import { useTranslatedHelpItems } from "@/hooks/useTranslatedHelpItems";
import { useThemeFlags } from "@/hooks/useThemeFlags";
import { useSound, Sounds } from "@/hooks/useSound";
import { helpItems } from "..";
import {
  createInitialState,
  applyMove,
  pass as passEngine,
  bot,
  isLegalMove,
  type GameState,
} from "../logic/goEngine";

const BOT_DELAY_MS = 400;

export function useGoGame() {
  const translatedHelpItems = useTranslatedHelpItems("go", helpItems || []);
  const {
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
  } = useAppHelpAboutDialogs();
  const { isWindowsTheme, isMacOSTheme } = useThemeFlags();
  const [isNewGameDialogOpen, setIsNewGameDialogOpen] = useState(false);

  const [state, setState] = useState<GameState>(() => createInitialState());
  const [thinking, setThinking] = useState(false);
  const botTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { play: playStone } = useSound(Sounds.CLICK, 0.3);
  const { play: playPass } = useSound(Sounds.BUTTON_CLICK, 0.3);

  const clearBotTimer = useCallback(() => {
    if (botTimer.current) {
      clearTimeout(botTimer.current);
      botTimer.current = null;
    }
  }, []);

  // Schedule White's reply from a given state after a short "thinking" beat.
  const scheduleBot = useCallback(
    (from: GameState) => {
      if (from.status !== "playing" || from.toMove !== "white") return;
      setThinking(true);
      clearBotTimer();
      botTimer.current = setTimeout(() => {
        botTimer.current = null;
        const move = bot(from);
        const next =
          move === "pass" ? passEngine(from) : applyMove(from, move) ?? from;
        playStone();
        setThinking(false);
        setState(next);
      }, BOT_DELAY_MS);
    },
    [clearBotTimer, playStone]
  );

  const place = useCallback(
    (i: number) => {
      if (state.status !== "playing" || state.toMove !== "black" || thinking)
        return;
      if (!isLegalMove(state, i)) return;
      const next = applyMove(state, i);
      if (!next) return;
      playStone();
      setState(next);
      scheduleBot(next);
    },
    [state, thinking, playStone, scheduleBot]
  );

  const doPass = useCallback(() => {
    if (state.status !== "playing" || state.toMove !== "black" || thinking)
      return;
    const next = passEngine(state);
    playPass();
    setState(next);
    scheduleBot(next);
  }, [state, thinking, playPass, scheduleBot]);

  const newGame = useCallback(() => {
    clearBotTimer();
    setThinking(false);
    setState(createInitialState());
  }, [clearBotTimer]);

  useEffect(() => () => clearBotTimer(), [clearBotTimer]);

  return {
    translatedHelpItems,
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
    isNewGameDialogOpen,
    setIsNewGameDialogOpen,
    isWindowsTheme,
    isMacOSTheme,
    state,
    thinking,
    place,
    doPass,
    newGame,
  };
}
```

- [ ] **Step 3: Create `src/apps/go/components/GoBoard.tsx`**

```tsx
import { useState } from "react";
import { BOARD_SIZE, idx, rowOf, colOf, type Board } from "../logic/goEngine";

const GRID = 32; // px spacing between lines
const MARGIN = 24; // px from board edge to first line
const PX = MARGIN * 2 + GRID * (BOARD_SIZE - 1); // full board size in view units
const STONE_R = GRID * 0.46;
const STAR = [
  [2, 2],
  [2, 6],
  [6, 2],
  [6, 6],
  [4, 4],
]; // 9x9 hoshi (3-3 points + tengen)

function cx(col: number) {
  return MARGIN + col * GRID;
}
function cy(row: number) {
  return MARGIN + row * GRID;
}

interface GoBoardProps {
  board: Board;
  lastMove: number | null;
  /** True when it is the human's turn and a move is allowed. */
  canPlay: boolean;
  onPlay: (i: number) => void;
}

export function GoBoard({ board, lastMove, canPlay, onPlay }: GoBoardProps) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <svg
      viewBox={`0 0 ${PX} ${PX}`}
      width="100%"
      height="100%"
      style={{ display: "block", touchAction: "manipulation" }}
      shapeRendering="geometricPrecision"
    >
      <defs>
        <linearGradient id="go-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e9c083" />
          <stop offset="50%" stopColor="#e0b06d" />
          <stop offset="100%" stopColor="#d2a25c" />
        </linearGradient>
        <radialGradient id="go-vignette" cx="50%" cy="45%" r="75%">
          <stop offset="70%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(80,45,10,0.35)" />
        </radialGradient>
        <radialGradient id="go-black" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#6d6d6d" />
          <stop offset="45%" stopColor="#1c1c1c" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
        <radialGradient id="go-white" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#efeae1" />
          <stop offset="100%" stopColor="#cfc7b8" />
        </radialGradient>
        <filter id="go-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="1.2"
            stdDeviation="1.1"
            floodColor="#000000"
            floodOpacity="0.4"
          />
        </filter>
      </defs>

      {/* Wood surface */}
      <rect x="0" y="0" width={PX} height={PX} fill="url(#go-wood)" />
      <rect x="0" y="0" width={PX} height={PX} fill="url(#go-vignette)" />

      {/* Grid */}
      <g stroke="#3a2a12" strokeWidth="1" strokeLinecap="round">
        {Array.from({ length: BOARD_SIZE }, (_, k) => (
          <line key={`h${k}`} x1={cx(0)} y1={cy(k)} x2={cx(BOARD_SIZE - 1)} y2={cy(k)} />
        ))}
        {Array.from({ length: BOARD_SIZE }, (_, k) => (
          <line key={`v${k}`} x1={cx(k)} y1={cy(0)} x2={cx(k)} y2={cy(BOARD_SIZE - 1)} />
        ))}
      </g>

      {/* Star points */}
      <g fill="#3a2a12">
        {STAR.map(([r, c]) => (
          <circle key={`s${r}-${c}`} cx={cx(c)} cy={cy(r)} r="2.6" />
        ))}
      </g>

      {/* Stones */}
      {board.map((p, i) =>
        p ? (
          <circle
            key={`stone${i}`}
            cx={cx(colOf(i))}
            cy={cy(rowOf(i))}
            r={STONE_R}
            fill={p === "black" ? "url(#go-black)" : "url(#go-white)"}
            stroke={p === "white" ? "rgba(0,0,0,0.25)" : "none"}
            strokeWidth={p === "white" ? 0.6 : 0}
            filter="url(#go-shadow)"
          />
        ) : null
      )}

      {/* Last-move marker */}
      {lastMove !== null && board[lastMove] ? (
        <circle
          cx={cx(colOf(lastMove))}
          cy={cy(rowOf(lastMove))}
          r={STONE_R * 0.3}
          fill={board[lastMove] === "black" ? "#e8e8e8" : "#333333"}
        />
      ) : null}

      {/* Ghost stone on hover */}
      {canPlay && hover !== null && board[hover] === null ? (
        <circle
          cx={cx(colOf(hover))}
          cy={cy(rowOf(hover))}
          r={STONE_R}
          fill="#000000"
          opacity={0.35}
        />
      ) : null}

      {/* Interactive hit targets on every intersection */}
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => (
        <circle
          key={`hit${i}`}
          cx={cx(colOf(i))}
          cy={cy(rowOf(i))}
          r={GRID * 0.5}
          fill="transparent"
          style={{ cursor: canPlay && board[i] === null ? "pointer" : "default" }}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover((h) => (h === i ? null : h))}
          onClick={() => {
            if (canPlay && board[i] === null) onPlay(i);
          }}
        />
      ))}
    </svg>
  );
}
```

- [ ] **Step 4: Create `src/apps/go/components/GoMenuBar.tsx`**

```tsx
import { AppMenuBarShell } from "@/components/shared/menubar/AppMenuBarShell";
import { AppMenuBarMenus } from "@/components/shared/menubar/AppMenuBarMenus";
import { useAppMenuBarChrome } from "@/hooks/useAppMenuBarChrome";
import { useTranslation } from "react-i18next";

interface GoMenuBarProps {
  onClose: () => void;
  onShowHelp: () => void;
  onShowAbout: () => void;
  onNewGame: () => void;
  onPass: () => void;
  canPass: boolean;
}

export function GoMenuBar({
  onClose,
  onShowHelp,
  onShowAbout,
  onNewGame,
  onPass,
  canPass,
}: GoMenuBarProps) {
  const { t } = useTranslation();
  const {
    isShareDialogOpen,
    setIsShareDialogOpen,
    isWindowsTheme,
    isMacOSTheme,
    appId,
    appName,
  } = useAppMenuBarChrome("go");

  return (
    <AppMenuBarShell
      isWindowsTheme={isWindowsTheme}
      isMacOSTheme={isMacOSTheme}
      appId={appId}
      appName={appName}
      isShareDialogOpen={isShareDialogOpen}
      setIsShareDialogOpen={setIsShareDialogOpen}
      helpItemLabel="Go Help"
      aboutItemLabel="About Go"
      onShowHelp={onShowHelp}
      onShowAbout={onShowAbout}
    >
      <AppMenuBarMenus
        menus={[
          {
            label: t("common.menu.file"),
            items: [
              { type: "action", label: "New Game", onClick: onNewGame },
              {
                type: "action",
                label: "Pass",
                onClick: onPass,
                disabled: !canPass,
              },
              { type: "separator" },
              {
                type: "action",
                label: t("common.menu.close"),
                onClick: onClose,
                shortcutId: "close",
              },
            ],
          },
        ]}
      />
    </AppMenuBarShell>
  );
}
```

- [ ] **Step 5: Create `src/apps/go/components/GoAppComponent.tsx`**

```tsx
import { AppProps } from "../../base/types";
import { AppWindowShell } from "@/components/shared/AppWindowShell";
import { AppHelpAboutDialogs } from "@/components/shared/AppHelpAboutDialogs";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appMetadata } from "..";
import { GoMenuBar } from "./GoMenuBar";
import { GoBoard } from "./GoBoard";
import { useGoGame } from "../hooks/useGoGame";
import type { GameResult } from "../logic/goEngine";

function resultText(r: GameResult): string {
  const margin = Math.abs(r.blackScore - r.whiteScore).toFixed(1);
  return `${r.winner === "black" ? "Black" : "White"} wins by ${margin}`;
}

export function GoAppComponent({
  isWindowOpen,
  onClose,
  isForeground,
  skipInitialSound,
  instanceId,
  onNavigateNext,
  onNavigatePrevious,
}: AppProps) {
  const {
    translatedHelpItems,
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
    isNewGameDialogOpen,
    setIsNewGameDialogOpen,
    isWindowsTheme,
    isMacOSTheme,
    state,
    thinking,
    place,
    doPass,
    newGame,
  } = useGoGame();

  const humanTurn =
    state.status === "playing" && state.toMove === "black" && !thinking;

  const statusText =
    state.status === "finished" && state.result
      ? resultText(state.result)
      : thinking
        ? "White is thinking…"
        : humanTurn
          ? "Your move (Black)"
          : "White to play";

  const menuBar = (
    <GoMenuBar
      onClose={onClose}
      onShowHelp={() => setIsHelpDialogOpen(true)}
      onShowAbout={() => setIsAboutDialogOpen(true)}
      onNewGame={() => setIsNewGameDialogOpen(true)}
      onPass={doPass}
      canPass={humanTurn}
    />
  );

  return (
    <AppWindowShell
      isWindowOpen={isWindowOpen}
      isWindowsTheme={isWindowsTheme}
      isForeground={isForeground}
      menuBar={menuBar}
      windowFrameProps={{
        title: "Go",
        onClose,
        isForeground,
        appId: "go",
        material: isMacOSTheme ? "brushedmetal" : "default",
        skipInitialSound,
        instanceId,
        onNavigateNext,
        onNavigatePrevious,
        windowConstraints: {
          minWidth: 360,
          maxWidth: 360,
          minHeight: 460,
        },
      }}
    >
      <div
        className={cn(
          "flex flex-col h-full w-full gap-1.5 p-2",
          isMacOSTheme ? "bg-transparent" : "bg-[#c0c0c0]"
        )}
      >
        {/* Status bar */}
        <div
          className={cn(
            "flex items-center justify-between text-xs px-2 py-1 rounded-sm",
            isMacOSTheme
              ? "bg-black/5 text-black/80"
              : "bg-[#d9d9d9] text-black border border-t-white border-l-white border-r-neutral-600 border-b-neutral-600"
          )}
        >
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-black" />
            {state.captures.black}
          </span>
          <span className="font-medium truncate px-1">{statusText}</span>
          <span className="flex items-center gap-1">
            {state.captures.white}
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-white border border-black/40" />
          </span>
        </div>

        {/* Board */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div
            className="w-full max-w-[340px] aspect-square rounded-[3px] overflow-hidden"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.35)" }}
          >
            <GoBoard
              board={state.board}
              lastMove={state.lastMove}
              canPlay={humanTurn}
              onPlay={place}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={isMacOSTheme ? "secondary" : "default"}
            size="sm"
            onClick={() => setIsNewGameDialogOpen(true)}
          >
            New Game
          </Button>
          <Button
            variant={isMacOSTheme ? "secondary" : "default"}
            size="sm"
            onClick={doPass}
            disabled={!humanTurn}
          >
            Pass
          </Button>
        </div>
      </div>

      <AppHelpAboutDialogs
        appId="go"
        helpItems={translatedHelpItems}
        metadata={appMetadata}
        isHelpOpen={isHelpDialogOpen}
        onHelpOpenChange={setIsHelpDialogOpen}
        isAboutOpen={isAboutDialogOpen}
        onAboutOpenChange={setIsAboutDialogOpen}
      />
      <ConfirmDialog
        isOpen={isNewGameDialogOpen}
        onOpenChange={setIsNewGameDialogOpen}
        onConfirm={newGame}
        title="New Game"
        description="Start a new game? The current board will be cleared."
      />
    </AppWindowShell>
  );
}
```

- [ ] **Step 6: Verify the module type-checks**

Run: `bunx tsc --noEmit`
Expected: No errors from `src/apps/go/**`. (Ignore any pre-existing errors elsewhere; there should be none introduced by these files. `AppMenuBarMenus` item fields used — `type`, `label`, `onClick`, `disabled`, `shortcutId`, `separator` — match the minesweeper menu bar usage.)

- [ ] **Step 7: Commit**

```bash
git add src/apps/go/index.ts src/apps/go/hooks src/apps/go/components
git commit -m "feat(go): app module — hook, SVG goban board, menu bar, window"
```

---

### Task 5: Wire the app into the registry and desktop

**Files:**
- Modify: `src/config/appRegistryData.ts` (add `"go"` to `appIds`; add `go: "Go"` to `appNames`)
- Modify: `src/apps/base/types.ts` (add `"go"` to the `BaseApp["id"]` union)
- Modify: `src/hooks/useTranslatedHelpItems.ts` (add `go: []` to `HELP_KEYS`)
- Modify: `src/utils/i18n.ts` (add `go: []` to `helpKeys` in `getTranslatedHelpItems`)
- Modify: `src/config/appRegistry.tsx` (lazy import + `["go"]` registry entry)
- Modify: `src/components/layout/desktop/aquaDesktopApps.ts` (add `"go"`)
- Modify: `package.json` (append the two new test files to `test:unit`)
- Test: `tests/test-go-app-wiring.test.ts`

**Interfaces:**
- Consumes: `AQUA_DESKTOP_APP_IDS`, `appIds`, `appNames`, `GoAppComponent`, `appMetadata`/`helpItems` from `@/apps/go`.
- Produces: `go` as a fully registered, desktop-launchable app.

- [ ] **Step 1: Write the failing wiring test**

Create `tests/test-go-app-wiring.test.ts`:

```ts
import { describe, test, expect } from "bun:test";
import { AQUA_DESKTOP_APP_IDS } from "../src/components/layout/desktop/aquaDesktopApps";
import { appIds, appNames } from "../src/config/appRegistryData";

describe("Go app wiring", () => {
  test("go is a registered app named Go", () => {
    expect(appIds).toContain("go");
    expect(appNames.go).toBe("Go");
  });

  test("go has a desktop icon", () => {
    expect(AQUA_DESKTOP_APP_IDS).toContain("go");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test tests/test-go-app-wiring.test.ts`
Expected: FAIL — `appIds`/`appNames`/`AQUA_DESKTOP_APP_IDS` do not include `"go"` yet (and `appNames.go` is a type error until Step 3).

- [ ] **Step 3: Add `"go"` to the registry data**

In `src/config/appRegistryData.ts`, add `"go"` to the `appIds` array (place it after `"minesweeper"`):

```ts
  "minesweeper",
  "go",
  "videos",
```

And add the name to the `appNames` map (after the `minesweeper` line):

```ts
  "minesweeper": "Minesweeper",
  "go": "Go",
  "videos": "Videos",
```

- [ ] **Step 4: Add `"go"` to the `BaseApp` id union**

In `src/apps/base/types.ts`, add `| "go"` to the `BaseApp["id"]` union (after `"minesweeper"`):

```ts
    | "minesweeper"
    | "go"
    | "finder"
```

- [ ] **Step 5: Add `go` to both help-key maps**

In `src/hooks/useTranslatedHelpItems.ts`, add to `HELP_KEYS` (next to the other project apps with `[]`):

```ts
  "buster-barn": [],
  go: [],
```

In `src/utils/i18n.ts`, add to the `helpKeys` object inside `getTranslatedHelpItems` (next to the `[]` entries):

```ts
    "buster-barn": [],
    go: [],
```

(Empty arrays make `useTranslatedHelpItems("go", helpItems)` fall back to the English `helpItems` from `src/apps/go/index.ts` — no locale files needed.)

- [ ] **Step 6: Register the component in `appRegistry.tsx`**

Add the lazy component next to `LazyMinesweeperApp` (near the top lazy-component block):

```ts
const LazyGoApp = createLazyComponent<unknown>(
  () =>
    import("@/apps/go/components/GoAppComponent").then((m) => ({
      default: m.GoAppComponent,
    })),
  "go"
);
```

Add the metadata import next to the minesweeper metadata import:

```ts
import { appMetadata as goMetadata, helpItems as goHelpItems } from "@/apps/go";
```

Add the registry entry inside the `appRegistry` object, immediately after the `["minesweeper"]` entry:

```ts
  ["go"]: {
    id: "go",
    name: appNames["go"],
    icon: { type: "image", src: goMetadata!.icon },
    description: "Play 9×9 Go against the computer",
    component: LazyGoApp,
    helpItems: goHelpItems,
    metadata: goMetadata,
    windowConfig: {
      defaultSize: { width: 360, height: 460 },
      minSize: { width: 360, height: 460 },
      maxSize: { width: 360, height: 460 },
    },
  },
```

- [ ] **Step 7: Add `"go"` to the desktop icon list**

In `src/components/layout/desktop/aquaDesktopApps.ts`, add `"go"` to `AQUA_DESKTOP_APP_IDS` (in the "Fun extras" section with the other classic games):

```ts
  "pc",
  "minesweeper",
  "go",
  "synth",
  "winamp",
```

- [ ] **Step 8: Register the new test files in `package.json`**

In `package.json`, append both new test files to the end of the `test:unit` script's file list (before the closing quote):

```
 tests/test-go-engine.test.ts tests/test-go-app-wiring.test.ts"
```

- [ ] **Step 9: Run the wiring test and the full unit suite**

Run: `bun test tests/test-go-app-wiring.test.ts`
Expected: PASS — go is registered and on the desktop.

Run: `bun run test:unit`
Expected: PASS — all suites green, including `test-aqua-desktop-apps` (it only checks a subset plus "every id is valid", and `go` is now a valid id) and both new go suites.

- [ ] **Step 10: Commit**

```bash
git add src/config/appRegistryData.ts src/apps/base/types.ts \
  src/hooks/useTranslatedHelpItems.ts src/utils/i18n.ts \
  src/config/appRegistry.tsx src/components/layout/desktop/aquaDesktopApps.ts \
  package.json tests/test-go-app-wiring.test.ts
git commit -m "feat(go): register app + desktop icon"
```

---

### Task 6: Fitting image (desktop icon) + build & play verification

**Files:**
- Create: `public/icons/default/go.png` (sourced Apple-style icon, ≥512 px)

**Interfaces:**
- Consumes: the registry entry's `icon` reference `/icons/default/go.png` (Task 5).
- Produces: a visible desktop icon and a verified, playable app.

- [ ] **Step 1: Source a fitting icon**

Find an Apple-style Go icon (a goban with black/white stones) at ≥512 px:
- Preferred: macosicons.com — search "Go" / "goban" / "baduk" / "weiqi". Check the license/attribution and record it.
- Save as `public/icons/default/go.png`.
- **Fallback if nothing cleanly licensable:** render the app's own SVG goban (a few stones on a wood square) to a 512×512 PNG and save it there. Any square PNG that reads as a Go board at desktop-icon size is acceptable.

- [ ] **Step 2: Regenerate the themed icon manifest (if the repo requires it)**

Run: `bun run generate:icons`
Expected: completes without error. (The `default` icon is the cross-theme fallback; this step refreshes any icon manifest/cache. If the script is absent or errors on unrelated icons, note it and continue — the `/icons/default/go.png` reference works directly.)

- [ ] **Step 3: Build**

Run: `bun run build`
Expected: build succeeds (static SPA output), no type errors.

- [ ] **Step 4: Verify by running the app**

Run: `bun dev`, open the app in the browser, and confirm end-to-end:
1. A **Go** icon appears on the desktop; opening it launches the window.
2. Clicking an empty intersection places a **black** stone; after ~400 ms the computer replies with a **white** stone.
3. Surrounding a white stone removes it and the Black prisoner counter increments.
4. **Pass** twice (File ▸ Pass, or the button, then let White pass) ends the game and shows a result banner ("Black/White wins by N.N").
5. **New Game** clears the board.
6. Switch OS theme (Control Panels ▸ Appearance, macOS X ⟷ Windows XP) and confirm the board and window still render correctly.

Use the `/verify` or `/run` skill to drive this if available; otherwise verify manually in the browser.

- [ ] **Step 5: Commit**

```bash
git add public/icons/default/go.png
git commit -m "feat(go): desktop icon art"
```

---

## Self-Review

**1. Spec coverage** — every spec section maps to a task:
- Module layout (`goEngine`, `useGoGame`, `GoAppComponent`, `GoBoard`, `GoMenuBar`, `index.ts`) → Tasks 1–4.
- Engine: board/`applyMove`/capture/suicide/ko → Task 1; `pass` + Tromp-Taylor `score` + komi 5.5 → Task 2; heuristic `bot` (no eye-fill, avoid self-atari, prefer captures/atari, pass when done) → Task 3.
- Hook turn-flow, sounds, help/about, no undo, ~400 ms delay → Task 4.
- Drawn wooden goban (grid, 5 star points, gradient stones, ghost hover, last-move dot, status bar, result banner) → Tasks 3–4 (`GoBoard`/`GoAppComponent`).
- Wiring (appIds/appNames, `BaseApp` union, both help-key maps, registry entry, `AQUA_DESKTOP_APP_IDS`, fixed window) → Task 5.
- The "fitting image" (sourced icon + fallback) → Task 6.
- Tests: engine cases + wiring test, added to `test:unit` → Tasks 1–3, 5. `bun run build` + `bun run test:unit` gate → Tasks 5–6.

**2. Placeholder scan** — no "TBD"/"add error handling"/"similar to Task N". Every code step shows complete, copy-pasteable code.

**3. Type consistency** — `GameState`/`GameResult`/`Board`/`Stone` field names (`board`, `toMove`, `koPoint`, `captures.{black,white}`, `passes`, `lastMove`, `status`, `result`) are used identically across engine, hook, board, and component. Function names are stable: `applyMove`, `isLegalMove`, `pass`(imported as `passEngine` in the hook), `score`, `bot`, `isTrueEye`, `neighbors`, `groupAndLiberties`, `idx`, `rowOf`, `colOf`, `createInitialState`. The registry entry uses `appNames["go"]` and `goMetadata!.icon`, matching existing entries.

## Execution Handoff

Choose how to execute (offered to the user after this plan is saved).
