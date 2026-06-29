import { useCallback } from "react";

/**
 * iPod library update checker — STUBBED.
 *
 * The original hook polled the song catalog (`/api/songs`) every 5 minutes
 * and auto-synced new/updated tracks via the store's `syncLibrary` action.
 * The static portfolio build has no backend, so this registers no interval
 * and its manual actions are no-ops (nothing to check or sync). This also
 * neutralizes the `syncLibrary` path — it is no longer invoked from here.
 *
 * The exported `{ manualCheck, manualSync }` interface is preserved so
 * `useIpodLogic` / `useIpodAppController` compile unchanged.
 */
export function useLibraryUpdateChecker(_isActive: boolean) {
  const manualCheck = useCallback(async () => false, []);
  const manualSync = useCallback(async () => false, []);

  return { manualCheck, manualSync };
}
