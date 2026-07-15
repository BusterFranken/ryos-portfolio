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
