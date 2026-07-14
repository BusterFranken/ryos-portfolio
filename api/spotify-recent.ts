/**
 * Vercel Edge Function — returns the owner's recently-played Spotify tracks.
 *
 * This is the ONE deliberate exception to the portfolio's "no backend, no API
 * keys" rule (see CLAUDE.md): a live "recently listening" feed can't be done
 * from a static client because Spotify's recently-played endpoint requires a
 * user-authorized token. The secret never reaches the browser — it lives in
 * Vercel env vars and is only used here, server-side.
 *
 * Required Vercel env vars (see docs/SPOTIFY_SETUP.md):
 *   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
 *
 * Degrades gracefully: if creds are missing or Spotify errors, returns
 * { tracks: [] } with 200 so the client just shows an empty state.
 */
export const config = { runtime: "edge" };

interface RecentTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string | null;
  url: string | null;
  playedAt: string;
}

const empty = (note?: string) =>
  new Response(JSON.stringify({ tracks: [], note }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=60",
    },
  });

export default async function handler(): Promise<Response> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return empty("Spotify env vars not configured");
  }

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    if (!tokenRes.ok) return empty(`token exchange failed (${tokenRes.status})`);
    const { access_token } = (await tokenRes.json()) as { access_token?: string };
    if (!access_token) return empty("no access token");

    const recentRes = await fetch(
      "https://api.spotify.com/v1/me/player/recently-played?limit=32",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    if (!recentRes.ok) return empty(`recently-played failed (${recentRes.status})`);
    const data = (await recentRes.json()) as {
      items?: Array<{
        played_at: string;
        track: {
          id: string;
          name: string;
          artists: Array<{ name: string }>;
          album: { name: string; images: Array<{ url: string }> };
          external_urls?: { spotify?: string };
        };
      }>;
    };

    // Dedupe by track id, keeping the most-recent play (items arrive newest-first).
    const seen = new Set<string>();
    const tracks: RecentTrack[] = [];
    for (const item of data.items ?? []) {
      const tr = item.track;
      if (!tr || seen.has(tr.id)) continue;
      seen.add(tr.id);
      tracks.push({
        id: tr.id,
        title: tr.name,
        artist: tr.artists.map((a) => a.name).join(", "),
        album: tr.album.name,
        albumArt: tr.album.images?.[0]?.url ?? null,
        url: tr.external_urls?.spotify ?? null,
        playedAt: item.played_at,
      });
    }

    return new Response(JSON.stringify({ tracks }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Cache at the edge for 5 min; serve stale while revalidating.
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (err) {
    return empty(`error: ${(err as Error).message}`);
  }
}
