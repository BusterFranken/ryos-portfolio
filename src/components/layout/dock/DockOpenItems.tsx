import type React from "react";
import type { TFunction } from "i18next";
import type { MotionValue } from "motion/react";
import { getAppIconPath, type AppId } from "@/config/appRegistry";
import { getTranslatedAppName } from "@/utils/i18n";
import type { AppInstance } from "@/stores/useAppStore";
import type { FileSystemItem } from "@/stores/useFilesStore";
import { DockIconButton } from "./DockIconButton";
import type { DockOpenItem } from "./dockTypes";

export interface DockOpenItemsProps {
  openItems: DockOpenItem[];
  instances: Record<string, AppInstance>;
  mouseX: MotionValue<number>;
  effectiveMagnifyEnabled: boolean;
  scaledButtonSize: number;
  hasMounted: boolean;
  seenIdsRef: React.MutableRefObject<Set<string>>;
  hoveredId: string | null;
  isSwapping: boolean;
  handleIconHover: (id: string) => void;
  handleIconLeave: () => void;
  handleAppContextMenu: (
    e: React.MouseEvent<HTMLButtonElement>,
    appId: AppId,
    instanceId?: string,
  ) => void;
  restoreInstance: (instanceId: string) => void;
  bringInstanceToForeground: (instanceId: string) => void;
  focusMostRecentInstanceOfApp: (appId: AppId) => void;
  handleNonPinnedDragStart: (e: React.DragEvent, appId: AppId) => void;
  getFileItem: (path: string) => FileSystemItem | undefined;
  t: TFunction;
}

// Returns a flat array of keyed dock icons (not a wrapping component) so the
// callers can spread them as DIRECT children of <AnimatePresence>/<LayoutGroup>.
// See renderDockPinnedItems for why wrapping these would break animations.
export function renderDockOpenItems({
  openItems,
  instances,
  mouseX,
  effectiveMagnifyEnabled,
  scaledButtonSize,
  hasMounted,
  seenIdsRef,
  hoveredId,
  isSwapping,
  handleIconHover,
  handleIconLeave,
  handleAppContextMenu,
  focusMostRecentInstanceOfApp,
  handleNonPinnedDragStart,
}: DockOpenItemsProps): React.ReactNode[] {
  return openItems
    .map((item) => {
        const icon = getAppIconPath(item.appId);
        const label = getTranslatedAppName(item.appId);
        const isLoading = Object.values(instances).some(
          (i) => i.appId === item.appId && i.isOpen && i.isLoading,
        );
        return (
          <DockIconButton
            key={item.appId}
            label={label}
            icon={icon}
            idKey={item.appId}
            onClick={(_e) => focusMostRecentInstanceOfApp(item.appId)}
            onContextMenu={(e) => handleAppContextMenu(e, item.appId)}
            showIndicator
            isLoading={isLoading}
            mouseX={mouseX}
            magnifyEnabled={effectiveMagnifyEnabled}
            isNew={hasMounted && !seenIdsRef.current.has(item.appId)}
            isHovered={hoveredId === item.appId}
            isSwapping={isSwapping}
            onHover={() => handleIconHover(item.appId)}
            onLeave={handleIconLeave}
            draggable
            onDragStart={(e) => handleNonPinnedDragStart(e, item.appId)}
            baseSize={scaledButtonSize}
            intentPrefetchAppId={item.appId}
          />
        );
    })
    .filter(Boolean);
}
