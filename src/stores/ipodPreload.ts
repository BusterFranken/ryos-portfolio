/**
 * iPod default-track preloading — STUBBED.
 *
 * The original module loaded a curated default library from the Redis song
 * metadata cache (`/api/songs`, songs authored by "ryo"). The static
 * portfolio build has no backend, so there is no default catalog to fetch:
 * `loadDefaultTracks()` resolves to an empty library. A curated portfolio
 * playlist is deferred content (added later as static data).
 *
 * The exported interface (`preloadIpodData`, `loadDefaultTracks`) is
 * preserved so `main.tsx` and `useIpodStore` compile unchanged.
 */
import type { Track } from "@/stores/useIpodStore";

/**
 * Preload iPod tracks data early (can be called before React mounts).
 * No-op in the portfolio build — there is nothing to preload.
 */
export function preloadIpodData(): void {}

/**
 * Load default tracks. Returns an empty library in the portfolio build.
 * @param _forceRefresh - Ignored (no backend to refresh against).
 */
export async function loadDefaultTracks(_forceRefresh = false): Promise<{
  tracks: Track[];
  version: number;
}> {
  return { tracks: [], version: 0 };
}
