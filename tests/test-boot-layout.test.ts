import { describe, test, expect } from "bun:test";
import { bootLayout } from "../src/config/bootLayout";
import { projectConfig } from "../src/apps/projects/projectConfig";
import { appIds } from "../src/config/appRegistryData";

describe("bootLayout (curated-chaos first run)", () => {
  test("opens a handful of overlapping windows", () => {
    expect(bootLayout.length).toBeGreaterThanOrEqual(4);
    expect(bootLayout.length).toBeLessThanOrEqual(8);
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

  test("at most one live iframe at boot", () => {
    const liveIframes = bootLayout.filter(
      (e) => projectConfig[e.appId]?.mode === "live"
    );
    expect(liveIframes.length).toBeLessThanOrEqual(1);
  });

  test("excludes the full-screen takeover and the slow cold-start project", () => {
    const ids = bootLayout.map((e) => e.appId);
    expect(ids).not.toContain("buster-barn");
    expect(ids).not.toContain("casefile");
  });

  test("opens the read_me_first note in textedit", () => {
    const te = bootLayout.find((e) => e.appId === "textedit");
    expect(te).toBeDefined();
    const path = (te!.initialData as { path?: string })?.path;
    expect(path).toContain("read_me_first");
  });
});
