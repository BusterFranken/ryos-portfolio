import { describe, test, expect } from "bun:test";
import {
  projectConfig,
  resolveProjectConfig,
} from "../src/apps/projects/projectConfig";
import { appIds, appNames } from "../src/config/appRegistryData";

describe("projectConfig", () => {
  // buster-barn is the full-screen takeover; every other project renders as a
  // live iframe (tarot + pawnshop went live once their sites shipped).
  const LIVE = [
    "casefile",
    "hush",
    "kafka-form",
    "eigenvector",
    "mpoftheweek",
    "dnd-cv",
    "tarot",
    "pawnshop",
  ] as const;
  const FULLSCREEN = ["buster-barn"] as const;

  test("every project id has a config", () => {
    for (const id of [...LIVE, ...FULLSCREEN]) {
      expect(resolveProjectConfig(id)).toBeDefined();
    }
  });

  test("live projects are mode 'live' with an http(s) url", () => {
    for (const id of LIVE) {
      const c = resolveProjectConfig(id)!;
      expect(c.mode).toBe("live");
      expect(c.url).toMatch(/^https?:\/\//);
    }
  });

  test("buster-barn is the fullscreen takeover with an http(s) url", () => {
    for (const id of FULLSCREEN) {
      const c = resolveProjectConfig(id)!;
      expect(c.mode).toBe("fullscreen");
      expect(c.url).toMatch(/^https?:\/\//);
    }
  });

  test("no project is left in preview mode", () => {
    for (const c of Object.values(projectConfig)) {
      expect(c!.mode).not.toBe("preview");
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
