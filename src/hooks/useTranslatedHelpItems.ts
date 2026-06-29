import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { MAPS_HELP_I18N_KEYS } from "@/apps/maps/helpKeys";
import type { AppId } from "@/utils/i18n";

const HELP_KEYS: Record<AppId, string[]> = {
  finder: [
    "browseNavigate",
    "fileManagement",
    "quickAccess",
    "airdropSharing",
    "dropToImport",
    "trashUndo",
  ],
  soundboard: [
    "recordSlot",
    "keyboardPlay",
    "waveformView",
    "customizeSlot",
    "multipleBoards",
    "importExport",
  ],
  "internet-explorer": [
    "browseWeb",
    "travelThroughTime",
    "historyReimagined",
    "saveFavorites",
    "exploreTimeNodes",
    "shareJourney",
  ],
  textedit: [
    "slashCommands",
    "formatting",
    "listsTasks",
    "aiCoEditor",
    "voiceDictation",
    "fileManagement",
  ],
  paint: [
    "drawingTools",
    "strokeWidth",
    "patterns",
    "cutCopyPaste",
    "filters",
    "autoSaveExport",
  ],
  "photo-booth": [
    "takingPhoto",
    "quickSnaps",
    "applyingEffects",
    "viewingPhotos",
    "downloadingPhotos",
    "switchingCameras",
  ],
  minesweeper: [
    "desktopControls",
    "mobileControls",
    "chordReveal",
    "mineCounterTimer",
    "smileyStatus",
    "quickRestart",
  ],
  videos: [
    "addVideo",
    "playback",
    "loop",
    "shuffle",
    "shareDeepLinks",
  ],
  ipod: [
    "addSongs",
    "wheelNavigation",
    "lyricsPronunciation",
    "coverFlow",
    "shareSongs",
    "displayFullscreen",
  ],
  synth: [
    "virtualKeyboard",
    "controlsPanel",
    "presets",
    "waveform3d",
    "effects",
    "octaveShift",
  ],
  terminal: [
    "basicCommands",
    "navigation",
    "fileEditing",
    "commandHistory",
    "terminalSounds",
  ],
  "control-panels": [
    "appearance",
    "shaderEffects",
    "sounds",
    "sync",
    "backupRestore",
  ],
  stickies: [
    "createNote",
    "colors",
    "moveResize",
    "ryoCanEdit",
    "clearAll",
    "autoSave",
  ],
  "infinite-mac": [
    "classicMacEmulator",
    "selectSystem",
    "displayScaling",
    "pauseResume",
    "captureScreenshot",
  ],
  pc: [
    "pcEmulator",
    "dosGames",
    "mouseCapture",
    "keyboardInput",
    "screenshotFullscreen",
    "backToSystems",
  ],
  winamp: [
    "playMusic",
    "equalizer",
    "playlist",
    "skins",
    "shuffleRepeat",
    "controls",
  ],
  calendar: [
    "navigateMonths",
    "createEvents",
    "todosSidebar",
    "icalImportExport",
    "ryoSchedules",
    "undoAutoSave",
  ],
  contacts: [
    "browseContacts",
    "createContacts",
    "importVCards",
    "smartGroups",
  ],
  dashboard: [
    "openDashboard",
    "widgetLibrary",
    "weatherWidget",
    "moveWidgets",
    "layoutPersists",
    "closeDashboard",
  ],
  maps: [...MAPS_HELP_I18N_KEYS],
  books: [
    "bookshelf",
    "import",
    "pageTurn",
    "progress",
    "fonts",
    "darkMode",
  ],
};

/**
 * Hook to get translated help items for an app
 * Merges translated text with original icons
 */
export function useTranslatedHelpItems<TIcon extends ReactNode = string>(
  appId: AppId,
  originalHelpItems: Array<{ icon: TIcon; title: string; description: string }>
) {
  const { t } = useTranslation();

  return useMemo(() => {
    const keys = HELP_KEYS[appId] || [];
    return originalHelpItems.map((item, index) => {
      const key = keys[index];
      if (!key) return item; // Fallback to original if no key

      const titleKey = `apps.${appId}.help.${key}.title`;
      const descKey = `apps.${appId}.help.${key}.description`;

      return {
        icon: item.icon, // Keep original icon
        title: t(titleKey, { defaultValue: item.title }),
        description: t(descKey, { defaultValue: item.description }),
      };
    });
  }, [appId, originalHelpItems, t]);
}

