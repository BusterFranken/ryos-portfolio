#!/usr/bin/env bun
/**
 * One-time helper: obtain a Spotify **refresh token** for the recently-played
 * feed (see docs/SPOTIFY_SETUP.md and api/spotify-recent.ts).
 *
 * Prereqs:
 *   1. Create an app at https://developer.spotify.com/dashboard
 *   2. Add redirect URI EXACTLY: http://127.0.0.1:8888/callback
 *   3. Run:
 *        SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy \
 *          bun run scripts/spotify-get-refresh-token.ts
 *   4. Open the printed URL, approve, and copy the refresh token it prints.
 *      Set it as SPOTIFY_REFRESH_TOKEN in Vercel (never commit it).
 */
import { createServer } from "node:http";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = "http://127.0.0.1:8888/callback";
const SCOPE = "user-read-recently-played";
const PORT = 8888;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET env vars first."
  );
  process.exit(1);
}

const authorizeUrl =
  "https://accounts.spotify.com/authorize?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
  }).toString();

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);
  if (url.pathname !== "/callback") {
    res.writeHead(404).end("not found");
    return;
  }
  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("missing ?code");
    return;
  }

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });
    const data = (await tokenRes.json()) as {
      refresh_token?: string;
      error_description?: string;
    };

    if (data.refresh_token) {
      console.log("\n✅ Your SPOTIFY_REFRESH_TOKEN:\n");
      console.log(data.refresh_token);
      console.log("\nSet it in Vercel → Project → Settings → Environment Variables.\n");
      res.writeHead(200, { "Content-Type": "text/html" }).end(
        "<h2>Done ✅</h2><p>Refresh token printed in your terminal. You can close this tab.</p>"
      );
    } else {
      console.error("Token exchange failed:", data);
      res.writeHead(500).end("token exchange failed — see terminal");
    }
  } catch (err) {
    console.error(err);
    res.writeHead(500).end("error — see terminal");
  } finally {
    setTimeout(() => server.close(() => process.exit(0)), 500);
  }
});

server.listen(PORT, () => {
  console.log("\n1. Open this URL in your browser and approve:\n");
  console.log(authorizeUrl);
  console.log(`\n2. Waiting for the callback on ${REDIRECT_URI} ...\n`);
});
