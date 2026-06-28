import { useEffect, useCallback, useMemo } from "react";
import { useEventListener } from "@/hooks/useEventListener";
import { usePrevious } from "@/hooks/useLatestRef";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore, useAppStoreShallow } from "@/stores/useAppStore";
import { getAppIconPath } from "@/config/appRegistry";
import { getTranslatedAppName } from "@/utils/i18n";
import { ThemedIcon } from "@/components/shared/ThemedIcon";
import { useThemeFlags } from "@/hooks/useThemeFlags";
import { useSound, Sounds } from "@/hooks/useSound";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { AppInstance } from "@/stores/useAppStore";
import {
  calculateExposeGrid,
  getExposeCellCenter,
  getExposeScale,
} from "./exposeUtils";
import { useTranslation } from "react-i18next";
import { onExposeWindowSelect } from "@/utils/appEventBus";

interface ExposeViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_INSTANCES: Record<string, AppInstance> = {};

export function ExposeView({ isOpen, onClose }: ExposeViewProps) {
  const { t } = useTranslation();
  const {
    setExposeMode,
    bringInstanceToForeground,
    restoreInstance,
  } = useAppStoreShallow((state) => ({
    setExposeMode: state.setExposeMode,
    bringInstanceToForeground: state.bringInstanceToForeground,
    restoreInstance: state.restoreInstance,
  }));
  // Only track the instances map while the overlay is visible; when closed
  // the selector returns a constant so instance churn never re-renders us.
  const instances = useAppStore((state) =>
    isOpen ? state.instances : EMPTY_INSTANCES
  );

  const { isMacOSTheme } = useThemeFlags();
  const isMobile = useIsMobile();

  // Sounds for expose view open/close
  const { play: playOpenSound } = useSound(Sounds.WINDOW_ZOOM_MAXIMIZE, 0.5);
  const { play: playCloseSound } = useSound(Sounds.WINDOW_ZOOM_MINIMIZE, 0.5);

  // Track previous isOpen state to detect changes
  const prevIsOpen = usePrevious(isOpen);

  // Get all open instances (excluding minimized and stickies)
  const openInstances = useMemo(() => {
    return Object.values(instances).filter(
      (inst) => inst.isOpen && !inst.isMinimized && inst.appId !== "stickies"
    );
  }, [instances]);

  // Set expose mode when view opens/closes
  useEffect(() => {
    setExposeMode(isOpen);
  }, [isOpen, setExposeMode]);

  // Play sounds when expose view opens/closes
  useEffect(() => {
    if (prevIsOpen === undefined) {
      return;
    }

    if (isOpen !== prevIsOpen) {
      if (isOpen) {
        playOpenSound();
      } else {
        playCloseSound();
      }
    }
  }, [isOpen, prevIsOpen, playOpenSound, playCloseSound]);

  // Handle window selection (called from AppManager)
  const handleWindowSelect = useCallback(
    (instanceId: string) => {
      const instance = instances[instanceId];
      if (!instance) return;

      // Restore if minimized
      if (instance.isMinimized) {
        restoreInstance(instanceId);
      }

      // Bring to foreground
      bringInstanceToForeground(instanceId);
      onClose();
    },
    [instances, restoreInstance, bringInstanceToForeground, onClose]
  );

  // Expose the handleWindowSelect for AppManager
  useEffect(() => {
    return onExposeWindowSelect((event) => {
      handleWindowSelect(event.detail.instanceId);
    });
  }, [handleWindowSelect]);

  // Handle keyboard navigation - escape to close
  useEventListener("keydown", (e) => {
    if (isOpen && e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  });

  // Calculate grid for label positioning
  const grid = useMemo(() => {
    return calculateExposeGrid(
      openInstances.length,
      window.innerWidth,
      window.innerHeight,
      60, // padding
      24, // gap
      isMobile
    );
  }, [openInstances.length, isMobile]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - clicking closes expose view */}
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Global style to disable iframe interactions in expose mode */}
          <style>{`
            iframe, webview, object, embed {
              pointer-events: none !important;
            }
          `}</style>

          {/* Window labels overlay */}
          <motion.div
            className="fixed inset-0 z-[10001] pointer-events-none flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {openInstances.length === 0 ? (
              <div
                className={`text-white ${isMacOSTheme ? "font-bold" : "drop-shadow-lg"}`}
                style={{
                  textShadow: isMacOSTheme
                    ? "rgba(0, 0, 0, 0.9) 0px 1px 0px, rgba(0, 0, 0, 0.85) 0px 1px 3px, rgba(0, 0, 0, 0.45) 0px 2px 3px"
                    : undefined,
                  fontSize: "1rem",
                }}
              >
                {t("common.expose.noWindows")}
              </div>
            ) : (
            openInstances.map((instance, index) => {
              const displayIcon = getAppIconPath(instance.appId);
              const displayLabel =
                instance.title ||
                instance.displayTitle ||
                getTranslatedAppName(instance.appId);
              const isEmoji = false;

              const cellCenter = getExposeCellCenter(
                index,
                grid,
                window.innerWidth,
                window.innerHeight
              );

              // Calculate scaled window bottom for accurate label positioning
              const windowHeight = instance.size?.height || 400;
              const windowWidth = instance.size?.width || 600;
              const scale = getExposeScale(windowWidth, windowHeight, grid.cellWidth, grid.cellHeight);
              const scaledWindowHalfHeight = (windowHeight * scale) / 2;

              // macOS-style text shadow (same as file icon labels)
              const macOSTextShadow = isMacOSTheme
                ? "rgba(0, 0, 0, 0.9) 0px 1px 0px, rgba(0, 0, 0, 0.85) 0px 1px 3px, rgba(0, 0, 0, 0.45) 0px 2px 3px"
                : undefined;

              return (
                <div
                  key={instance.instanceId}
                  className="absolute flex flex-col items-center gap-1 pointer-events-none"
                  style={{
                    left: cellCenter.x,
                    top: cellCenter.y + scaledWindowHalfHeight + 8,
                    transform: "translateX(-50%)",
                  }}
                >
                  {/* Icon */}
                  <div className="flex items-center gap-2">
                    {isEmoji ? (
                      <span className="text-2xl">{displayIcon}</span>
                    ) : (
                      <ThemedIcon
                        name={displayIcon}
                        alt=""
                        className="size-6 [image-rendering:pixelated]"
                      />
                    )}
                    {/* Title */}
                    <div
                      className={`text-sm font-medium text-white line-clamp-1 max-w-[200px] ${
                        isMacOSTheme ? "font-bold" : "drop-shadow-lg"
                      }`}
                      style={{
                        textShadow: macOSTextShadow,
                      }}
                    >
                      {displayLabel}
                    </div>
                  </div>
                </div>
              );
            })
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
