import { describe, test, expect } from "bun:test";
import { commands } from "../src/apps/terminal/commands";
import type { CommandContext } from "../src/apps/terminal/types";

const ctx = {} as CommandContext;
const run = (name: string) => {
  const result = commands[name].handler([], ctx);
  if (result instanceof Promise) throw new Error("expected sync command");
  return result.output;
};

describe("terminal bio commands", () => {
  test("whoami / projects / contact are registered and non-error", () => {
    for (const name of ["whoami", "projects", "contact"]) {
      const cmd = commands[name];
      expect(cmd).toBeDefined();
      const result = cmd.handler([], ctx);
      expect((result as { isError: boolean }).isError).toBe(false);
    }
  });

  test("whoami returns the owner's bio, not a unix username", () => {
    expect(run("whoami").toLowerCase()).toContain("buster franken");
  });

  test("projects lists real project ids", () => {
    const out = run("projects");
    expect(out).toContain("casefile");
    expect(out).toContain("eigenvector");
    expect(out).toContain("buster-barn");
  });

  test("contact lists the owner's real channels", () => {
    const out = run("contact");
    expect(out).toContain("busterfranken@gmail.com");
    expect(out).toContain("github.com/BusterFranken");
    expect(out.toLowerCase()).toContain("linkedin");
  });
});
