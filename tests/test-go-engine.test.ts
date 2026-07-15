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
