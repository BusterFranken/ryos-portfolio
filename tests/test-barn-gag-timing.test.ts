import { describe, test, expect } from "bun:test";
import { PRIZE_DELAY_MS, EXE_DELAY_MS } from "../src/components/BusterBarnGag";

// EVE-270: the millionth-visitor gag must only surface for a lingering visitor,
// not catch a new visitor's eye immediately.
describe("BusterBarnGag timing", () => {
  test("prize waits at least a couple of minutes", () => {
    expect(PRIZE_DELAY_MS).toBeGreaterThanOrEqual(120_000);
  });

  test("the .exe warning escalates after the prize", () => {
    expect(EXE_DELAY_MS).toBeGreaterThan(PRIZE_DELAY_MS);
  });
});
