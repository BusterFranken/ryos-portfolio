import { describe, test, expect } from "bun:test";
import {
  createInitialState,
  applyMove,
  isLegalMove,
  pass,
  score,
  bot,
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
