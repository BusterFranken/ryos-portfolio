# Spotify "recently listening" — setup

The iPod features Buster's recently-played Spotify tracks via a small Vercel
Edge Function (`api/spotify-recent.ts`). This is the **one deliberate exception**
to the portfolio's no-backend rule — Spotify's recently-played endpoint needs a
user-authorized token, which can't live in a static client. The secret stays in
Vercel env vars and never reaches the browser.

## What Buster needs to do (one time)

1. **Create a Spotify app** at <https://developer.spotify.com/dashboard>.
   - Note the **Client ID** and **Client Secret**.
   - Under **Redirect URIs**, add exactly: `http://127.0.0.1:8888/callback`

2. **Get a refresh token** — run the helper locally:
   ```bash
   SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy \
     bun run scripts/spotify-get-refresh-token.ts
   ```
   Open the printed URL, approve access, and copy the `SPOTIFY_REFRESH_TOKEN`
   it prints in the terminal.

3. **Set the env vars in Vercel** (Project → Settings → Environment Variables,
   all environments):
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REFRESH_TOKEN`

   Never commit these. For local `vercel dev`, put them in a git-ignored
   `.env.local`.

## How it works

- `GET /api/spotify-recent` → `{ tracks: [{ id, title, artist, album, albumArt,
  url, playedAt }] }`, deduped by track, newest first, edge-cached ~5 min.
- If the env vars are missing or Spotify errors, it returns `{ tracks: [] }`
  with 200 so the iPod just shows an empty state — nothing breaks.

## Remaining work (Claude)

Once the endpoint returns live data, wire the iPod to fetch `/api/spotify-recent`
and display the tracks (album art + title + artist, "open in Spotify" on tap).
Note: these can't be *played* in-app (Spotify playback needs the Web Playback
SDK + a Premium login), so the iPod will present them as a browsable
"recently listening" list that deep-links to Spotify.
