# busterOS Site Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand every user-facing title/description/preview-image tag from ryOS to busterOS, and stop serving the link-preview image from the upstream author's domain.

**Architecture:** Two hand-edited static sources — the `<head>` of `index.html` (link previews, browser tab, iOS home-screen name) and the `VitePWA({ manifest: {...} })` block in `vite.config.ts` (which generates `dist/manifest.json`, driving the installed-PWA name). One new text-parsing regression test reads both files and asserts they agree, so the two can never drift apart again.

**Tech Stack:** Vite, `vite-plugin-pwa`, Bun test runner (`bun:test`).

## Global Constraints

Copy these values verbatim. Every task's requirements implicitly include this section.

- Site name (all title-ish tags): `busterOS`
- Description (all three description tags, byte-identical): `A retro macOS desktop where every window is one of my projects.`
- Canonical origin: `https://ryos-portfolio.vercel.app`
- Preview image path (already exists in repo, do not add a new asset): `public/icons/mac-512.png`
- `twitter:card` stays `summary`. Do not change it.
- Do **not** touch the `[ryOS]` console prefixes in the inline stale-bundle boot script (`index.html` lines 71–208, inside `<head>`), nor any lowercase `ryos` identifier in `src/` or `vite.config.ts` — several are localStorage/IndexedDB key prefixes and renaming them orphans user state.
- Do **not** switch the URLs to `portfolio.busterfranken.com` in this plan. That domain is not yet pointed at Vercel; the swap is deferred (see spec).

---

### Task 1: busterOS metadata + regression test

**Files:**
- Create: `tests/test-site-metadata.test.ts`
- Modify: `index.html` (lines 11, 16–19, 49–58, 60–67, 69). Match on tag content, not
  line numbers — replacing the one-line `og:image` tag with a wrapped one shifts every
  line below it by 3.
- Modify: `vite.config.ts` (lines 430–432, inside the `VitePWA` `manifest` block)
- Modify: `package.json` (line 34, the `test:unit` script)

**Interfaces:**
- Consumes: nothing from earlier tasks — this is the only task.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the failing test**

Create `tests/test-site-metadata.test.ts`:

```ts
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
const SITE_ORIGIN = "https://ryos-portfolio.vercel.app";

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
    expect(viteConfig).not.toContain("ryOS");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun test tests/test-site-metadata.test.ts`

Expected: FAIL. Multiple failing assertions, including `expected "ryOS" to be "busterOS"` for the title and `expect(...).not.toContain("ryOS")`. Confirm the failures are about the *content values*, not about a thrown `no <meta> tag with name/property "..."` error — a thrown error means the tag-parsing regex is wrong, not that the metadata is stale.

- [ ] **Step 3: Update `index.html`**

Line 11:

```html
    <meta name="apple-mobile-web-app-title" content="busterOS" />
```

Lines 16–19:

```html
    <meta
      name="description"
      content="A retro macOS desktop where every window is one of my projects."
    />
```

Lines 49–58, the Open Graph block:

```html
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://ryos-portfolio.vercel.app/" />
    <meta property="og:title" content="busterOS" />
    <meta
      property="og:description"
      content="A retro macOS desktop where every window is one of my projects."
    />
    <meta
      property="og:image"
      content="https://ryos-portfolio.vercel.app/icons/mac-512.png"
    />
    <meta property="og:site_name" content="busterOS" />
```

Lines 60–67, the Twitter block (`twitter:card` unchanged):

```html
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="busterOS" />
    <meta
      name="twitter:description"
      content="A retro macOS desktop where every window is one of my projects."
    />
    <meta
      name="twitter:image"
      content="https://ryos-portfolio.vercel.app/icons/mac-512.png"
    />
```

Line 69:

```html
    <title>busterOS</title>
```

- [ ] **Step 4: Update the PWA manifest in `vite.config.ts`**

Lines 430–432, inside `VitePWA({ manifest: { ... } })`. Change only these three lines; leave `theme_color`, `background_color`, `display`, `orientation`, `start_url`, and `icons` exactly as they are:

```ts
        name: "busterOS",
        short_name: "busterOS",
        description:
          "A retro macOS desktop where every window is one of my projects.",
```

- [ ] **Step 5: Register the test in `package.json`**

`test:unit` names every test file explicitly, so a new file is not picked up automatically. Append ` tests/test-site-metadata.test.ts` to the end of the `test:unit` script value on line 34, after `tests/test-go-app-wiring.test.ts`.

- [ ] **Step 6: Run the test to verify it passes**

Run: `bun test tests/test-site-metadata.test.ts`

Expected: PASS, 7 pass / 0 fail.

- [ ] **Step 7: Run the full unit suite for regressions**

Run: `bun run test:unit`

Expected: all tests pass, and the run includes `tests/test-site-metadata.test.ts` (confirming Step 5 took effect).

- [ ] **Step 8: Build and verify the generated manifest**

Run: `bun run build && cat dist/manifest.json`

Expected: build succeeds; `dist/manifest.json` contains `"name":"busterOS"`, `"short_name":"busterOS"`, and the new description. No `ryOS`.

Then run: `grep -n "ryOS" dist/index.html`

Expected: only `[ryOS]` console-prefix hits from the inline boot script. Zero hits inside any `<meta>` or `<title>` tag.

- [ ] **Step 9: Commit**

```bash
git add index.html vite.config.ts package.json tests/test-site-metadata.test.ts
git commit -m "fix(meta): rebrand site metadata from ryOS to busterOS

Link previews showed the upstream ryOS title and description, and
served og:image from os.ryo.lu. Retitle every meta/title tag, use the
portfolio description, and self-host the preview image. Also update the
VitePWA manifest block, which generates dist/manifest.json and drives
the installed-PWA name. Adds a regression test asserting the HTML and
the PWA manifest agree."
```

---

## After the plan

The `portfolio.busterfranken.com` swap is deliberately **not** part of this plan. When DNS is live, change `SITE_ORIGIN` in the test plus the three URL tags in `index.html`, and redeploy. Setup steps are in the spec's "Deferred: custom domain" section.

To confirm the fix in a real client after deploy, share the link with a cache-buster (`https://ryos-portfolio.vercel.app/?v=2`) — WhatsApp/iMessage/Slack cache Open Graph data per-URL for days, so an existing chat may keep showing the old ryOS card.
