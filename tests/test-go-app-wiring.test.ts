import { describe, test, expect } from "bun:test";
import { AQUA_DESKTOP_APP_IDS } from "../src/components/layout/desktop/aquaDesktopApps";
import { appIds, appNames } from "../src/config/appRegistryData";

describe("Go app wiring", () => {
  test("go is a registered app named Go", () => {
    expect(appIds).toContain("go");
    expect(appNames.go).toBe("Go");
  });

  test("go has a desktop icon", () => {
    expect(AQUA_DESKTOP_APP_IDS).toContain("go");
  });
});
