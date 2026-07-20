import { describe, test, expect } from "bun:test";
import { bootLayout } from "../src/config/bootLayout";
import { projectConfig } from "../src/apps/projects/projectConfig";
import { appIds } from "../src/config/appRegistryData";

describe("bootLayout (curated-chaos first run)", () => {
  test("opens a handful of overlapping windows", () => {
    expect(bootLayout.length).toBeGreaterThanOrEqual(4);
    expect(bootLayout.length).toBeLessThanOrEqual(10);
  });

  test("every entry is a registered app with a position + size", () => {
    for (const e of bootLayout) {
      expect(appIds).toContain(e.appId);
      expect(typeof e.position.x).toBe("number");
      expect(typeof e.position.y).toBe("number");
      expect(e.size.width).toBeGreaterThan(0);
      expect(e.size.height).toBeGreaterThan(0);
    }
  });

  test("opens the hero pairing plus Videos, iPod, and Maps by default (EVE-267)", () => {
    const ids = bootLayout.map((e) => e.appId);
    // The D&D portfolio main page + the busterfranken.com Projects page.
    expect(ids).toContain("dnd-cv");
    const ie = bootLayout.find((e) => e.appId === "internet-explorer");
    expect(ie).toBeDefined();
    expect((ie!.initialData as { url?: string })?.url).toContain(
      "busterfranken.com"
    );
    // The three apps the ticket wants open on startup.
    expect(ids).toContain("videos");
    expect(ids).toContain("ipod");
    expect(ids).toContain("maps");
    // Every boot project iframe is a real live/fullscreen project config.
    for (const e of bootLayout) {
      const cfg = projectConfig[e.appId];
      if (cfg) expect(["live", "fullscreen"]).toContain(cfg.mode);
    }
  });

  test("keeps the EVE-267 launch-on-click apps out of the boot layout", () => {
    const ids = bootLayout.map((e) => e.appId);
    for (const id of [
      "mpoftheweek",
      "hush",
      "kafka-form",
      "pawnshop",
      "buster-barn",
      "casefile",
    ]) {
      expect(ids).not.toContain(id);
    }
  });

  test("opens eigenvector wide enough to keep its two-column WHO section", () => {
    // eigenvector.pro collapses `.about__inner` from `280px 1fr` to one column
    // at `@media(max-width:768px)`, pushing the bio below the headshot. The
    // window has to leave the iframe more than 768px of viewport after chrome.
    const ev = bootLayout.find((e) => e.appId === "eigenvector");
    expect(ev).toBeDefined();
    expect(ev!.size.width).toBeGreaterThan(768 + 16);
  });

  test("opens the README note in textedit", () => {
    const te = bootLayout.find((e) => e.appId === "textedit");
    expect(te).toBeDefined();
    const path = (te!.initialData as { path?: string })?.path;
    expect(path).toContain("README");
  });
});
