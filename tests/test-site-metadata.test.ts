import { describe, test, expect } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const viteConfig = readFileSync(join(ROOT, "vite.config.ts"), "utf8");

/**
 * `key:\n  "value"` collapsed to `key: "value"`, so these assertions survive
 * Prettier wrapping a long string onto its own line.
 */
const viteConfigFlat = viteConfig.replace(/:\s*\n\s*/g, ": ");

const SITE_NAME = "busterOS";
const SITE_DESCRIPTION =
  "A retro macOS desktop where every window is one of my projects.";
const SITE_ORIGIN = "https://portfolio.busterfranken.com";

/**
 * Every <meta> tag as { key, content }, where key is its name= or property=.
 * `[^>]*` spans newlines, so multi-line <meta> tags are matched too.
 */
function metaTags(): Array<{ key: string; content: string }> {
  const out: Array<{ key: string; content: string }> = [];
  for (const tag of html.match(/<meta\b[^>]*>/g) ?? []) {
    const key = tag.match(/(?:name|property)="([^"]+)"/)?.[1];
    const content = tag.match(/content="([^"]*)"/)?.[1];
    if (key && content !== undefined) out.push({ key, content });
  }
  return out;
}

function meta(key: string): string {
  const found = metaTags().find((m) => m.key === key);
  if (!found) throw new Error(`no <meta> tag with name/property "${key}"`);
  return found.content;
}

const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";

describe("site metadata (busterOS)", () => {
  test("no metadata tag mentions ryOS or the upstream domain", () => {
    // Scoped to <meta>/<title> deliberately. The inline stale-bundle boot
    // script also lives inside <head> and its [ryOS] console prefixes are
    // intentionally kept — see the spec's out-of-scope section.
    for (const { key, content } of metaTags()) {
      expect(`${key}=${content}`).not.toContain("ryOS");
      expect(`${key}=${content}`).not.toContain("os.ryo.lu");
    }
    expect(title).not.toContain("ryOS");
  });

  test("every title-ish tag identifies the site as busterOS", () => {
    expect(title).toBe(SITE_NAME);
    for (const key of [
      "og:title",
      "twitter:title",
      "og:site_name",
      "apple-mobile-web-app-title",
    ]) {
      expect(meta(key)).toBe(SITE_NAME);
    }
  });

  test("all three descriptions are present and byte-identical", () => {
    for (const key of ["description", "og:description", "twitter:description"]) {
      expect(meta(key)).toBe(SITE_DESCRIPTION);
    }
  });

  test("og:url points at the canonical origin", () => {
    expect(meta("og:url")).toBe(`${SITE_ORIGIN}/`);
  });

  test("preview image is self-hosted and the file exists in public/", () => {
    for (const key of ["og:image", "twitter:image"]) {
      const url = meta(key);
      expect(url.startsWith(`${SITE_ORIGIN}/`)).toBe(true);
      const rel = url.slice(SITE_ORIGIN.length + 1);
      expect(existsSync(join(ROOT, "public", rel))).toBe(true);
    }
  });

  test("twitter card type is unchanged", () => {
    expect(meta("twitter:card")).toBe("summary");
  });

  test("the PWA manifest agrees with the HTML metadata", () => {
    // dist/manifest.json is generated from this block; if it still says ryOS
    // the installed PWA is named ryOS no matter what index.html says.
    expect(viteConfigFlat).toContain(`name: "${SITE_NAME}"`);
    expect(viteConfigFlat).toContain(`short_name: "${SITE_NAME}"`);
    expect(viteConfigFlat).toContain(`description: "${SITE_DESCRIPTION}"`);
    // Exact case: lowercase `ryos` identifiers (ryosBuildNumber, the
    // ryos-collect-heavy-chunks plugin name) are internal and stay.
    expect(viteConfigFlat).not.toContain("ryOS");
  });
});
