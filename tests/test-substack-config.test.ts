import { describe, test, expect } from "bun:test";
import { appIds, appNames } from "../src/config/appRegistryData";
import { loadSubstackPosts } from "../src/apps/substack/substackConfig";

describe("substack config", () => {
  test("appIds includes 'substack'", () => {
    expect(appIds).toContain("substack");
  });

  test("appNames.substack === 'Substack'", () => {
    expect(appNames.substack).toBe("Substack");
  });

  test("loadSubstackPosts is a function", () => {
    expect(typeof loadSubstackPosts).toBe("function");
  });
});
