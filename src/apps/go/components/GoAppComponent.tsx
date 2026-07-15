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
