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
