import { useState } from "react";
import { BOARD_SIZE, rowOf, colOf, type Board } from "../logic/goEngine";

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
          <line
            key={`h${k}`}
            x1={cx(0)}
            y1={cy(k)}
            x2={cx(BOARD_SIZE - 1)}
            y2={cy(k)}
          />
        ))}
        {Array.from({ length: BOARD_SIZE }, (_, k) => (
          <line
            key={`v${k}`}
            x1={cx(k)}
            y1={cy(0)}
            x2={cx(k)}
            y2={cy(BOARD_SIZE - 1)}
          />
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
          style={{
            cursor: canPlay && board[i] === null ? "pointer" : "default",
          }}
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
