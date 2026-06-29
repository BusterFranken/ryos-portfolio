#!/usr/bin/env bun
/**
 * Build-time script: fetches the Substack RSS feed and writes
 * public/data/substack-posts.json for static consumption at runtime.
 *
 * Exits 0 on any network/parse failure so the build never breaks.
 */
import { mkdir, writeFile } from "node:fs/promises";

const FEED_URL = "https://busterfranken.substack.com/feed"; // TODO: owner must set their real Substack publication feed — the @busterfranken profile currently has no feed (this URL 302-redirects to the profile).

const OUT_DIR = "public/data";
const OUT_FILE = `${OUT_DIR}/substack-posts.json`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubstackPost {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  content: string;
  guid: string;
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

/** Extract the inner text of a named XML tag, handling CDATA and plain text. */
function extractField(xml: string, tag: string): string {
  // Match both namespace-prefixed tags (content:encoded) and plain tags.
  // The tag name is escaped for use in a regex (handles the colon in content:encoded).
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<${escaped}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${escaped}>`, "i");
  const m = re.exec(xml);
  if (!m) return "";
  // Group 1 = CDATA content, group 2 = plain text
  return (m[1] !== undefined ? m[1] : m[2] ?? "").trim();
}

/**
 * Parse an RSS XML string and return an array of SubstackPost objects.
 * Returns [] on empty/garbage/no-items input — never throws.
 */
export function parseRss(xml: string): SubstackPost[] {
  if (!xml || !xml.trim()) return [];

  // Extract all <item>…</item> blocks
  const itemRe = /<item[\s>][\s\S]*?<\/item>/gi;
  const items = xml.match(itemRe);
  if (!items || items.length === 0) return [];

  const posts: SubstackPost[] = [];

  for (const item of items) {
    const title = extractField(item, "title");
    const link = extractField(item, "link");
    const pubDate = extractField(item, "pubDate");
    const description = extractField(item, "description");
    const contentEncoded = extractField(item, "content:encoded");
    const guid = extractField(item, "guid");

    // content:encoded wins; fall back to description
    const content = contentEncoded || description;

    posts.push({ title, link, pubDate, description, content, guid });
  }

  return posts;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const EMPTY_OUTPUT = {
  get generatedAt() {
    return new Date().toISOString();
  },
  feedUrl: FEED_URL,
  posts: [] as SubstackPost[],
};

async function writeOutput(posts: SubstackPost[]): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  const payload = JSON.stringify(
    { generatedAt: new Date().toISOString(), feedUrl: FEED_URL, posts },
    null,
    2
  );
  await writeFile(OUT_FILE, payload + "\n");
}

async function main(): Promise<void> {
  let xml: string;

  try {
    const res = await fetch(FEED_URL, {
      headers: { "User-Agent": "ryos-portfolio-build/1.0" },
      redirect: "follow",
    });

    if (!res.ok) {
      console.warn(
        `[substack] Non-2xx response (${res.status}) from ${FEED_URL} — writing empty posts.`
      );
      await writeOutput([]);
      process.exit(0);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/xml") && !contentType.includes("application/rss+xml") && !contentType.includes("application/xml")) {
      console.warn(
        `[substack] Unexpected Content-Type '${contentType}' — looks like a redirect to a non-feed page. Writing empty posts.`
      );
      await writeOutput([]);
      process.exit(0);
    }

    xml = await res.text();
  } catch (err) {
    console.warn(
      `[substack] Fetch failed: ${(err as Error).message} — writing empty posts.`
    );
    await writeOutput([]);
    process.exit(0);
  }

  const posts = parseRss(xml);

  if (posts.length === 0) {
    console.warn(
      `[substack] Feed parsed but contained 0 items — writing empty posts.`
    );
    await writeOutput([]);
    process.exit(0);
  }

  await writeOutput(posts);
  console.log(`[substack] Wrote ${posts.length} post(s) to ${OUT_FILE}`);
}

main().catch((err) => {
  console.warn("[substack] Unexpected error:", (err as Error).message, "— writing empty posts and continuing.");
  // Best-effort write
  mkdir(OUT_DIR, { recursive: true })
    .then(() =>
      writeFile(
        OUT_FILE,
        JSON.stringify(
          { generatedAt: new Date().toISOString(), feedUrl: FEED_URL, posts: [] },
          null,
          2
        ) + "\n"
      )
    )
    .finally(() => process.exit(0));
});
