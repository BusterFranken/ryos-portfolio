import { describe, test, expect } from "bun:test";
import {
  projectConfig,
  resolveProjectConfig,
} from "../src/apps/projects/projectConfig";
import { appIds, appNames } from "../src/config/appRegistryData";

describe("projectConfig", () => {
  const LIVE = [
    "buster-barn",
    "casefile",
    "hush",
    "kafka-form",
    "eigenvector",
    "mpoftheweek",
    "dnd-cv",
  ] as const;
  const PREVIEW = ["tarot", "pawnshop"] as const;

  test("every project id has a config", () => {
    for (const id of [...LIVE, ...PREVIEW]) {
      expect(resolveProjectConfig(id)).toBeDefined();
    }
  });

  test("live projects are mode 'live' with an http(s) url (buster-barn is fullscreen)", () => {
    for (const id of LIVE) {
      const c = resolveProjectConfig(id)!;
      const expected = id === "buster-barn" ? "fullscreen" : "live";
      expect(c.mode).toBe(expected);
      expect(c.url).toMatch(/^https?:\/\//);
    }
  });

  test("preview projects are mode 'preview' and carry a redirect url", () => {
    for (const id of PREVIEW) {
      const c = resolveProjectConfig(id)!;
      expect(c.mode).toBe("preview");
      expect(c.url).toMatch(/^https?:\/\//);
    }
  });

  test("unknown id resolves to undefined", () => {
    expect(resolveProjectConfig("finder")).toBeUndefined();
  });

  test("all project ids are registered in appIds + appNames", () => {
    for (const id of Object.keys(projectConfig)) {
      expect(appIds).toContain(id);
      expect(appNames[id as keyof typeof appNames]).toBeTruthy();
    }
  });
});
