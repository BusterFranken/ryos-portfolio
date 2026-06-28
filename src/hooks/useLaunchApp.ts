import { useCallback } from "react";
import { useAppStore, LaunchOriginRect } from "@/stores/useAppStore";
import { AppId } from "@/config/appRegistry";

// Export the interface
export interface LaunchAppOptions {
  initialPath?: string;
  initialData?: unknown; // Add initialData field
  multiWindow?: boolean; // Add multiWindow flag
  launchOrigin?: LaunchOriginRect; // Position of icon that launched the app
}

export const useLaunchApp = () => {
  const launchAppInstance = useAppStore((state) => state.launchApp);
  const bringInstanceToForeground = useAppStore(
    (state) => state.bringInstanceToForeground
  );
  const restoreInstance = useAppStore((state) => state.restoreInstance);
  const updateInstanceInitialData = useAppStore(
    (state) => state.updateInstanceInitialData
  );

  const launchApp = useCallback(
    (appId: AppId, options?: LaunchAppOptions) => {
      console.log(`[useLaunchApp] Launch event received for ${appId}`, options);
      const { instances } = useAppStore.getState();

      // Convert initialPath to proper initialData for Finder
      let initialData = options?.initialData;
      if (appId === "finder" && options?.initialPath && !initialData) {
        initialData = { path: options.initialPath };
      }

      // Check if all instances of this app are minimized
      // If so, restore them instead of creating a new instance
      const appInstances = Object.values(instances).filter(
        (inst) => inst.appId === appId && inst.isOpen
      );

      if (appInstances.length > 0) {
        // Check if all instances are minimized
        const allMinimized = appInstances.every((inst) => inst.isMinimized);

        if (allMinimized) {
          // Restore all minimized instances
          let lastRestoredId: string | null = null;
          appInstances.forEach((inst) => {
            if (inst.isMinimized) {
              restoreInstance(inst.instanceId);
              lastRestoredId = inst.instanceId;
            }
          });

          // Bring the most recently restored instance to foreground
          if (lastRestoredId) {
            console.log(
              `[useLaunchApp] All instances of ${appId} were minimized, restored and bringing ${lastRestoredId} to foreground`
            );
            bringInstanceToForeground(lastRestoredId);
            // Update initialData if provided (e.g. pre-fill commands from Spotlight)
            if (initialData) {
              updateInstanceInitialData(lastRestoredId, initialData);
            }
            return lastRestoredId;
          }
        }
      }

      // Always use multi-window for apps that support it
      const multiWindow =
        options?.multiWindow ||
        appId === "finder" ||
        appId === "textedit";

      // Use the new instance-based launch system
      const instanceId = launchAppInstance(
        appId,
        initialData,
        undefined,
        multiWindow,
        options?.launchOrigin
      );
      console.log(
        `[useLaunchApp] Created instance ${instanceId} for app ${appId} with multiWindow: ${multiWindow}`
      );

      return instanceId;
    },
    [
      bringInstanceToForeground,
      launchAppInstance,
      restoreInstance,
      updateInstanceInitialData,
    ]
  );

  return launchApp;
};
