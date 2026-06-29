import { useCallback, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useAppHelpAboutDialogs } from "@/hooks/useAppHelpAboutDialogs";
import { useTranslation } from "react-i18next";
import { useTranslatedHelpItems } from "@/hooks/useTranslatedHelpItems";
import { helpItems } from "..";
import { useFileSystem } from "@/apps/finder/hooks/useFileSystem";
import { clearAllAppStates } from "@/stores/useAppStore";
import { ensureIndexedDBInitialized } from "@/utils/indexedDB";
import {
  flushDebouncedPersistWrites,
  haltDebouncedPersistWrites,
} from "@/utils/debouncedPersistStorage";
import { useAppStoreShallow } from "@/stores/useAppStore";
import { useAudioSettingsStoreShallow } from "@/stores/useAudioSettingsStore";
import { useDisplaySettingsStoreShallow } from "@/stores/useDisplaySettingsStore";
import { DEFAULT_WALLPAPER_PATH } from "@/stores/useDisplaySettingsStore";
import { setNextBootMessage, clearNextBootMessage } from "@/utils/bootMessage";
import { clearPrefetchFlag, forceRefreshCache } from "@/utils/prefetch";
import { AI_MODEL_METADATA } from "@/types/aiModels";
import { v4 as uuidv4 } from "uuid";
import { useThemeFlags } from "@/hooks/useThemeFlags";
import { useThemeStore } from "@/stores/useThemeStore";
import { getTranslatedAppName } from "@/utils/i18n";
import { normalizeControlPanelClassicTabId } from "@/apps/control-panels/components/control-panels-app/controlPanelsCategories";
import { saveBlobToDevice } from "@/utils/nativeFileDialogs";
import { getTabStyles } from "@/utils/tabStyles";
import { useLanguageStore } from "@/stores/useLanguageStore";
import type { ControlPanelsInitialData } from "@/apps/base/types";
import { triggerRuntimeCrashTest } from "@/utils/errorReporting";
import { SETTINGS_ANALYTICS, track } from "@/utils/analytics";
import {
  readStoreItems,
  restoreStoreItems,
  serializeStoreItems,
  type IndexedDBStoreItemWithKey as StoreItemWithKey,
} from "@/utils/indexedDBBackup";

type PhotoCategory =
  | "3d_graphics"
  | "convergency"
  | "foliage"
  | "landscapes"
  | "nostalgia"
  | "objects"
  | "structures";

const PHOTO_WALLPAPERS: Record<PhotoCategory, string[]> = {
  "3d_graphics": [
    "capsule",
    "capsule_azul",
    "capsule_pistachio",
    "tub",
    "tub_azul",
    "tub_bondi",
    "ufo_1",
    "ufo_2",
    "ufo_3",
  ],
  convergency: Array.from({ length: 15 }, (_, i) => `convergence_${i + 1}`),
  foliage: [
    "blue_flowers",
    "cactus",
    "golden_poppy",
    "red_cyclamens",
    "red_tulips",
    "rose",
    "spider_lily",
    "waterdrops_on_leaf",
    "yellow_tulips",
  ],
  landscapes: [
    "beach",
    "clouds",
    "french_alps",
    "ganges_river",
    "golden_gate_at_dusk",
    "mono_lake",
    "palace_on_lake_in_jaipur",
    "rain_god_mesa",
    "refuge-col_de_la_grasse-alps",
    "zabriskie_point",
  ],
  nostalgia: [
    "acropolis",
    "beach_on_ko_samui",
    "birds_in_flight",
    "cancun_sunset",
    "cliffs_of_moher",
    "fish_eagle",
    "galway_bay",
    "glacier_national_park",
    "highway_395",
    "hong_kong_at_night",
    "islamorada_sunrise",
    "lily_pad",
    "long_island_sound",
    "mac_os_background",
    "midsummer_night",
    "moraine_lake",
    "oasis_in_baja",
    "red_clouds",
    "toronto_skyline",
    "tuolumne_meadows",
    "yosemite_valley",
    "yucatan",
  ],
  objects: [
    "alpine_granite",
    "bicycles",
    "bottles",
    "burmese_claypots",
    "burning_candle",
    "chairs",
    "faucet_handle",
    "neon",
    "salt_shaker_top",
    "shamus",
  ],
  structures: [
    "gate",
    "gate_lock",
    "glass_door_knob",
    "padlock",
    "rusty_lock",
    "shutters",
    "stone_wall",
    "wall_of_stones",
  ],
};

// Transform photo paths
Object.entries(PHOTO_WALLPAPERS).forEach(([category, photos]) => {
  PHOTO_WALLPAPERS[category as PhotoCategory] = photos.map(
    (name) => `/wallpapers/photos/${category}/${name}.jpg`
  );
});

// Use shared AI model metadata
const AI_MODELS = AI_MODEL_METADATA;

const BACKUP_INDEXEDDB_STORES = [
  "documents",
  "images",
  "trash",
  "custom_wallpapers",
  "applets",
] as const;

function upgradeLegacyBackupStoreValue(
  backupVersion: number,
  storeName: string,
  value: Record<string, unknown>
): Record<string, unknown> {
  if (
    backupVersion >= 2 ||
    (storeName !== "documents" && storeName !== "images")
  ) {
    return value;
  }

  const nextValue = { ...value };
  if (!nextValue.uuid) {
    nextValue.uuid = uuidv4();
  }
  if (!nextValue.contentUrl && nextValue.content instanceof Blob) {
    nextValue.contentUrl = URL.createObjectURL(nextValue.content);
  }
  return nextValue;
}

export interface UseControlPanelsLogicProps {
  initialData?: ControlPanelsInitialData;
}

export function useControlPanelsLogic({
  initialData,
}: UseControlPanelsLogicProps) {
  const { t } = useTranslation();
  const translatedHelpItems = useTranslatedHelpItems(
    "control-panels",
    helpItems
  );
  const {
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
  } = useAppHelpAboutDialogs();
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [isConfirmFormatOpen, setIsConfirmFormatOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileToRestoreRef = useRef<File | null>(null);
  const { formatFileSystem } = useFileSystem();
  // AI model settings from app store
  const { aiModel, setAiModel } = useAppStoreShallow((s) => ({
    aiModel: s.aiModel,
    setAiModel: s.setAiModel,
  }));

  // Display settings from display settings store
  const {
    debugMode,
    setDebugMode,
    showResizers,
    setShowResizers,
    shaderEffectEnabled,
    setShaderEffectEnabled,
    setCurrentWallpaper,
  } = useDisplaySettingsStoreShallow((s) => ({
    debugMode: s.debugMode,
    setDebugMode: s.setDebugMode,
    showResizers: s.showResizers,
    setShowResizers: s.setShowResizers,
    shaderEffectEnabled: s.shaderEffectEnabled,
    setShaderEffectEnabled: s.setShaderEffectEnabled,
    setCurrentWallpaper: s.setCurrentWallpaper,
  }));

  // Audio settings from audio settings store
  const {
    terminalSoundsEnabled,
    setTerminalSoundsEnabled,
    uiSoundsEnabled,
    setUiSoundsEnabled,
    uiVolume,
    setUiVolume,
    speechEnabled,
    setSpeechEnabled,
    chatSynthVolume,
    setChatSynthVolume,
    speechVolume,
    setSpeechVolume,
    ttsModel,
    setTtsModel,
    ttsVoice,
    setTtsVoice,
    synthPreset,
    setSynthPreset,
    ipodVolume,
    setIpodVolume,
    masterVolume,
    setMasterVolume,
  } = useAudioSettingsStoreShallow((s) => ({
    terminalSoundsEnabled: s.terminalSoundsEnabled,
    setTerminalSoundsEnabled: s.setTerminalSoundsEnabled,
    uiSoundsEnabled: s.uiSoundsEnabled,
    setUiSoundsEnabled: s.setUiSoundsEnabled,
    uiVolume: s.uiVolume,
    setUiVolume: s.setUiVolume,
    speechEnabled: s.speechEnabled,
    setSpeechEnabled: s.setSpeechEnabled,
    chatSynthVolume: s.chatSynthVolume,
    setChatSynthVolume: s.setChatSynthVolume,
    speechVolume: s.speechVolume,
    setSpeechVolume: s.setSpeechVolume,
    ttsModel: s.ttsModel,
    setTtsModel: s.setTtsModel,
    ttsVoice: s.ttsVoice,
    setTtsVoice: s.setTtsVoice,
    synthPreset: s.synthPreset,
    setSynthPreset: s.setSynthPreset,
    ipodVolume: s.ipodVolume,
    setIpodVolume: s.setIpodVolume,
    masterVolume: s.masterVolume,
    setMasterVolume: s.setMasterVolume,
  }));

  // Theme state
  const {
    currentTheme,
    supportsDarkMode,
    isDarkMode,
    darkModePreference,
    supportsAccent,
    accent,
    macChrome,
    isWindowsTheme,
    isMacOSTheme,
    isMacTheme: isClassicMacTheme,
    aquaMaterial,
  } = useThemeFlags();
  const setTheme = useThemeStore((state) => state.setTheme);
  const setDarkMode = useThemeStore((state) => state.setDarkMode);
  const setAccent = useThemeStore((state) => state.setAccent);
  const setAquaMaterial = useThemeStore((state) => state.setAquaMaterial);
  const systemFont = useThemeStore((state) => state.systemFont);
  const setSystemFont = useThemeStore((state) => state.setSystemFont);
  const wallpaperAccentColor = useThemeStore(
    (state) => state.wallpaperAccentColor
  );

  // Language state
  const currentLanguage = useLanguageStore((state) => state.current);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  // States for previous volume levels for mute/unmute functionality
  const [prevMasterVolume, setPrevMasterVolume] = useState(
    masterVolume > 0 ? masterVolume : 1
  );
  const [prevUiVolume, setPrevUiVolume] = useState(uiVolume > 0 ? uiVolume : 1);
  const [prevSpeechVolume, setPrevSpeechVolume] = useState(
    speechVolume > 0 ? speechVolume : 1
  );
  const [prevChatSynthVolume, setPrevChatSynthVolume] = useState(
    chatSynthVolume > 0 ? chatSynthVolume : 1
  );
  const [prevIpodVolume, setPrevIpodVolume] = useState(
    ipodVolume > 0 ? ipodVolume : 1
  );

  // Detect iOS Safari – volume API does not work for YouTube embeds there
  const isIOS =
    typeof navigator !== "undefined" &&
    /iP(hone|od|ad)/.test(navigator.userAgent);

  const handleUISoundsChange = (enabled: boolean) => {
    setUiSoundsEnabled(enabled);
  };

  const handleSpeechChange = (enabled: boolean) => {
    setSpeechEnabled(enabled);
  };

  const handleSynthPresetChange = (value: string) => {
    setSynthPreset(value);
  };

  // Mute toggle handlers
  const handleMasterMuteToggle = () => {
    if (masterVolume > 0) {
      setPrevMasterVolume(masterVolume);
      setMasterVolume(0);
    } else {
      setMasterVolume(prevMasterVolume);
    }
  };

  const handleUiMuteToggle = () => {
    if (uiVolume > 0) {
      setPrevUiVolume(uiVolume);
      setUiVolume(0);
    } else {
      setUiVolume(prevUiVolume);
    }
  };

  const handleSpeechMuteToggle = () => {
    if (speechVolume > 0) {
      setPrevSpeechVolume(speechVolume);
      setSpeechVolume(0);
    } else {
      setSpeechVolume(prevSpeechVolume);
    }
  };

  const handleChatSynthMuteToggle = () => {
    if (chatSynthVolume > 0) {
      setPrevChatSynthVolume(chatSynthVolume);
      setChatSynthVolume(0);
    } else {
      setChatSynthVolume(prevChatSynthVolume);
    }
  };

  const handleIpodMuteToggle = () => {
    if (isIOS) return;
    if (ipodVolume > 0) {
      setPrevIpodVolume(ipodVolume);
      setIpodVolume(0);
    } else {
      setIpodVolume(prevIpodVolume);
    }
  };

  const handleResetAll = () => {
    setIsConfirmResetOpen(true);
  };

  const handleConfirmReset = () => {
    setIsConfirmResetOpen(false);
    track(SETTINGS_ANALYTICS.RESET, {
      appId: "control-panels",
      action: "reset_all",
    });
    setNextBootMessage(t("common.system.resettingSystem"));
    performReset();
  };

  const performReset = () => {
    // Flush write-behind persist queues so the preserved keys are current,
    // then halt further writes until the reload.
    flushDebouncedPersistWrites();
    haltDebouncedPersistWrites();
    // Preserve critical recovery keys while clearing everything else
    const fileMetadataStore = localStorage.getItem("ryos:files");
    const usernameRecovery = localStorage.getItem("_usr_recovery_key_");

    clearAllAppStates();
    clearPrefetchFlag(); // Force re-prefetch on next boot

    if (fileMetadataStore) {
      localStorage.setItem("ryos:files", fileMetadataStore);
    }
    if (usernameRecovery) {
      localStorage.setItem("_usr_recovery_key_", usernameRecovery);
    }

    window.location.reload();
  };

  const handleBackup = async () => {
    const backup: {
      localStorage: Record<string, string | null>;
      indexedDB: {
        documents: StoreItemWithKey[];
        images: StoreItemWithKey[];
        trash: StoreItemWithKey[];
        custom_wallpapers: StoreItemWithKey[];
        applets: StoreItemWithKey[];
      };
      timestamp: string;
      version: number; // Add version to identify backup format
    } = {
      localStorage: {},
      indexedDB: {
        documents: [],
        images: [],
        trash: [],
        custom_wallpapers: [],
        applets: [],
      },
      timestamp: new Date().toISOString(),
      version: 3, // Version 3 includes applets support
    };

    // Backup all localStorage data (flush write-behind persist queues so
    // the snapshot includes the latest store state)
    flushDebouncedPersistWrites();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        backup.localStorage[key] = localStorage.getItem(key);
      }
    }

    // Backup IndexedDB data
    try {
      const db = await ensureIndexedDBInitialized();
      const serializedStores = await Promise.all(
        BACKUP_INDEXEDDB_STORES.map(async (storeName) => [
          storeName,
          await serializeStoreItems(await readStoreItems(db, storeName)),
        ] as const)
      );
      for (const [storeName, items] of serializedStores) {
        backup.indexedDB[storeName] = items;
      }
      db.close();
    } catch (error) {
      console.error("Error backing up IndexedDB:", error);
      alert(t("apps.control-panels.alerts.failedToBackupFileSystem"));
    }

    // Convert to JSON string
    const jsonString = JSON.stringify(backup);

    // Create download with gzip compression
    try {
      // Check if CompressionStream is available
      if (typeof CompressionStream === "undefined") {
        throw new Error("CompressionStream API not available in this browser");
      }

      // Convert string to Uint8Array for compression
      const encoder = new TextEncoder();
      const inputData = encoder.encode(jsonString);

      // Create a ReadableStream from the data
      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(inputData);
          controller.close();
        },
      });

      // Compress the stream
      const compressionStream = new CompressionStream("gzip");
      const compressedStream = readableStream.pipeThrough(compressionStream);

      // Convert the compressed stream to a blob
      const chunks: Uint8Array[] = [];
      const reader = compressedStream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // Combine chunks into a single blob
      const compressedBlob = new Blob(chunks as BlobPart[], {
        type: "application/gzip",
      });

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .split("T")
        .join("-")
        .slice(0, -5);
      await saveBlobToDevice(compressedBlob, `ryOS-backup-${timestamp}.gz`, {
        filters: [{ name: "Gzip Archive", extensions: ["gz"] }],
      });
    } catch (compressionError) {
      console.error("Compression failed:", compressionError);
      alert(t("apps.control-panels.alerts.failedToCreateBackup", {
        error: compressionError instanceof Error ? compressionError.message : t("apps.control-panels.alerts.unknownError"),
      }));
    }
  };

  const handleRestore = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    fileToRestoreRef.current = file;
    performRestore();
  };

  const performRestore = async () => {
    const file = fileToRestoreRef.current;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let data: string;

        if (file.name.endsWith(".gz")) {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;

            // Create a Response object with the compressed data
            const compressedResponse = new Response(arrayBuffer);
            const compressedStream = compressedResponse.body;

            if (!compressedStream) {
              throw new Error("Failed to create stream from compressed data");
            }

            // Decompress the stream
            const decompressionStream = new DecompressionStream("gzip");
            const decompressedStream =
              compressedStream.pipeThrough(decompressionStream);

            // Read the decompressed data
            const decompressedResponse = new Response(decompressedStream);
            data = await decompressedResponse.text();
          } catch (decompressionError) {
            console.error("Decompression failed:", decompressionError);
            throw new Error(
              `Failed to decompress backup file: ${
                decompressionError instanceof Error
                  ? decompressionError.message
                  : "Unknown error"
              }`
            );
          }
        } else {
          data = e.target?.result as string;
        }

        // Try to parse the JSON
        let backup;
        try {
          backup = JSON.parse(data);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          throw new Error(
            "Invalid JSON format. The backup file may be corrupted."
          );
        }

        // Validate backup structure
        if (!backup || !backup.localStorage || !backup.timestamp) {
          throw new Error(
            "Invalid backup format. Missing required backup data."
          );
        }

        track(SETTINGS_ANALYTICS.RESET, {
          appId: "control-panels",
          action: "restore_backup",
          compressed: file.name.endsWith(".gz"),
        });

        // Clear current state. Drain write-behind persist queues first so a
        // pending debounced write can't fire mid-restore and clobber a
        // freshly restored key before the reload.
        flushDebouncedPersistWrites();
        haltDebouncedPersistWrites();
        clearAllAppStates();
        clearPrefetchFlag(); // Force re-prefetch on next boot

        // Restore localStorage
        Object.entries(backup.localStorage).forEach(([key, value]) => {
          if (value !== null) {
            localStorage.setItem(key, value as string);
          }
        });

        // Restore IndexedDB data if available
        if (backup.indexedDB) {
          try {
            const db = await ensureIndexedDBInitialized();
            const restorePromises = BACKUP_INDEXEDDB_STORES.flatMap((storeName) => {
              const items = backup.indexedDB?.[storeName];
              if (!items) {
                return [];
              }

              return restoreStoreItems(db, storeName, items, {
                mapValue: (value) =>
                  upgradeLegacyBackupStoreValue(backup.version, storeName, value),
              });
            });

            await Promise.all(restorePromises);
            db.close();
          } catch (error) {
            console.error("Error restoring IndexedDB:", error);
            alert(t("apps.control-panels.alerts.failedToRestoreFileSystem"));
          }
        }

        // Update wallpaper after restore
        if (backup.localStorage["ryos:app:settings:wallpaper"]) {
          const wallpaper = backup.localStorage["ryos:app:settings:wallpaper"];
          if (wallpaper) {
            setCurrentWallpaper(wallpaper);
          }
        }

        try {
          // Ensure the files store is in a safe state after restore.
          // Preserve the version from the backup so Zustand doesn't
          // re-run migrations on already-current data.
          const persistedKey = "ryos:files";
          const persistedState = localStorage.getItem(persistedKey);

          if (persistedState) {
            const parsed = JSON.parse(persistedState);
            if (parsed && parsed.state) {
              const hasItems =
                parsed.state.items &&
                Object.keys(parsed.state.items).length > 0;
              parsed.state.libraryState = hasItems
                ? "loaded"
                : "uninitialized";
              if (!parsed.version || parsed.version < 5) {
                parsed.version = 5;
              }
              localStorage.setItem(persistedKey, JSON.stringify(parsed));
            }
          }
        } catch (fallbackErr) {
          console.error(
            "[ControlPanels] Emergency fallback failed:",
            fallbackErr
          );
        }

        setNextBootMessage(t("common.system.restoringSystem"));

        // Reload the page to apply changes
        window.location.reload();
      } catch (err) {
        console.error("Restore failed:", err);

        const detail = err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : t("apps.control-panels.alerts.unknownError");
        alert(t("apps.control-panels.alerts.failedToRestoreBackup", { error: detail }));
        clearNextBootMessage();
      }
    };

    if (file.name.endsWith(".gz")) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
    fileToRestoreRef.current = null;
  };

  const performFormat = async () => {
    track(SETTINGS_ANALYTICS.RESET, {
      appId: "control-panels",
      action: "format_file_system",
    });
    // Reset wallpaper to default before formatting
    setCurrentWallpaper(DEFAULT_WALLPAPER_PATH);
    await formatFileSystem();
    clearPrefetchFlag(); // Force re-prefetch on next boot
    setNextBootMessage(t("common.system.formattingFileSystem"));
    window.location.reload();
  };

  const handleConfirmFormat = () => {
    setIsConfirmFormatOpen(false);
    setNextBootMessage(t("common.system.formattingFileSystem"));
    performFormat();
  };

  // Theme flags come from useThemeFlags() above (single source of truth).
  const isWindowsLegacyTheme = isWindowsTheme;

  const tabStyles = getTabStyles(currentTheme);
  const defaultTab = normalizeControlPanelClassicTabId(initialData?.defaultTab);
  const windowTitle = getTranslatedAppName("control-panels");

  const handleCheckForUpdates = () => {
    forceRefreshCache();
  };

  const handleShowBootScreen = () => {
    setNextBootMessage(t("common.system.debugBootScreenTest"), true);
    window.location.reload();
  };

  const handleTriggerAppCrashTest = useCallback(() => {
    triggerRuntimeCrashTest({
      scope: "app",
      appId: "control-panels",
    });
  }, []);

  const handleTriggerDesktopCrashTest = useCallback(() => {
    triggerRuntimeCrashTest({
      scope: "desktop",
    });
  }, []);

  return {
    t,
    translatedHelpItems,
    windowTitle,
    defaultTab,
    isHelpDialogOpen,
    setIsHelpDialogOpen,
    isAboutDialogOpen,
    setIsAboutDialogOpen,
    isConfirmResetOpen,
    setIsConfirmResetOpen,
    isConfirmFormatOpen,
    setIsConfirmFormatOpen,
    fileInputRef,
    handleRestore,
    handleBackup,
    handleResetAll,
    handleConfirmReset,
    handleConfirmFormat,
    handleCheckForUpdates,
    handleShowBootScreen,
    handleTriggerAppCrashTest,
    handleTriggerDesktopCrashTest,
    AI_MODELS,
    aiModel,
    setAiModel,
    debugMode,
    setDebugMode,
    showResizers,
    setShowResizers,
    shaderEffectEnabled,
    setShaderEffectEnabled,
    currentTheme,
    setTheme,
    aquaMaterial,
    setAquaMaterial,
    supportsDarkMode,
    isDarkMode,
    darkModePreference,
    setDarkMode,
    supportsAccent,
    accent,
    accentChrome: macChrome,
    setAccent,
    systemFont,
    setSystemFont,
    wallpaperAccentColor,
    currentLanguage,
    setLanguage,
    tabStyles,
    isWindowsTheme,
    isMacOSTheme,
    isClassicMacTheme,
    isWindowsLegacyTheme,
    uiSoundsEnabled,
    handleUISoundsChange,
    speechEnabled,
    handleSpeechChange,
    terminalSoundsEnabled,
    setTerminalSoundsEnabled,
    synthPreset,
    handleSynthPresetChange,
    masterVolume,
    setMasterVolume,
    setPrevMasterVolume,
    handleMasterMuteToggle,
    uiVolume,
    setUiVolume,
    setPrevUiVolume,
    handleUiMuteToggle,
    speechVolume,
    setSpeechVolume,
    setPrevSpeechVolume,
    handleSpeechMuteToggle,
    chatSynthVolume,
    setChatSynthVolume,
    setPrevChatSynthVolume,
    handleChatSynthMuteToggle,
    ipodVolume,
    setIpodVolume,
    setPrevIpodVolume,
    handleIpodMuteToggle,
    isIOS,
    ttsModel,
    setTtsModel,
    ttsVoice,
    setTtsVoice,
  };
}
