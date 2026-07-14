import { useEffect, useState } from "react";

/** One recently-played track from `/api/spotify-recent` (see api/spotify-recent.ts). */
export interface SpotifyRecentTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string | null;
  url: string | null;
  playedAt: string;
}

/**
 * Fetches the owner's recently-played Spotify tracks (once) when `enabled`.
 * Read-only display data for the iPod's "Recently on Spotify" list — these
 * tracks aren't playable in-app, so there's no store/cache machinery like the
 * Apple Music library; local state is enough. The endpoint is edge-cached and
 * degrades to an empty list, so a fetch-per-open is cheap and safe.
 */
export function useSpotifyRecent(enabled: boolean) {
  const [tracks, setTracks] = useState<SpotifyRecentTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || loaded) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/spotify-recent")
      .then((r) => (r.ok ? r.json() : { tracks: [] }))
      .then((data: { tracks?: SpotifyRecentTrack[] }) => {
        if (cancelled) return;
        setTracks(Array.isArray(data?.tracks) ? data.tracks : []);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setTracks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, loaded]);

  return { tracks, loading };
}
