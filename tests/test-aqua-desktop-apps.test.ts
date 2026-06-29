import { describe, test, expect } from "bun:test";
import { AQUA_DESKTOP_APP_IDS } from "../src/components/layout/desktop/aquaDesktopApps";
import { appIds } from "../src/config/appRegistryData";

describe("AQUA_DESKTOP_APP_IDS", () => {
  test("contains the curated portfolio set and only valid ids", () => {
    const expected = [
      "buster-barn",
      "casefile",
      "mpoftheweek",
      "eigenvector",
      "contacts",
    ];
    for (const id of expected) expect(AQUA_DESKTOP_APP_IDS).toContain(id);
    for (const id of AQUA_DESKTOP_APP_IDS) expect(appIds).toContain(id);
  });
});
