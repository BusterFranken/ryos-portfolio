import { describe, test, expect } from "bun:test";
import {
  docViewerDocs,
  resolveDoc,
} from "../src/apps/docviewer/docViewerConfig";
import { appIds, appNames } from "../src/config/appRegistryData";

describe("docViewerConfig", () => {
  test("resolveDoc('cv-pdf') is defined with mode 'pdf'", () => {
    const doc = resolveDoc("cv-pdf");
    expect(doc).toBeDefined();
    expect(doc!.mode).toBe("pdf");
    expect(doc!.title).toBeTruthy();
  });

  test("non-doc id resolves to undefined", () => {
    expect(resolveDoc("finder")).toBeUndefined();
  });

  test("all doc ids are registered in appIds + appNames", () => {
    for (const id of Object.keys(docViewerDocs)) {
      expect(appIds).toContain(id);
      expect(appNames[id as keyof typeof appNames]).toBeTruthy();
    }
  });
});
