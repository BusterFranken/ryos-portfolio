#!/usr/bin/env bun

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const INDEX_CSS = readFileSync(join(import.meta.dir, "../src/index.css"), "utf8");

describe("text selection policy (CSS)", () => {
  test("denies selection globally in base layer", () => {
    expect(INDEX_CSS).toMatch(/@layer base[\s\S]*\* \{[\s\S]*user-select: none/);
  });

  test("defines chat streamdown escape hatch", () => {
    expect(INDEX_CSS).toMatch(
      /\.ryos-chat-streamdown,\s*\n\s*\.ryos-chat-streamdown \* \{[\s\S]*user-select: text/
    );
  });

  test("defines select-text utility escape hatch", () => {
    expect(INDEX_CSS).toMatch(
      /\.select-text,\s*\n\s*\.select-text \* \{[\s\S]*user-select: text/
    );
  });

  test("enables selection for form controls and contenteditable", () => {
    expect(INDEX_CSS).toContain('[contenteditable="true"]');
    expect(INDEX_CSS).toMatch(/textarea,[\s\S]*user-select: text/);
  });

  test("enables cross-browser TextEdit ProseMirror selection", () => {
    expect(INDEX_CSS).toMatch(
      /\.textedit-prosemirror-root\.ProseMirror[\s\S]*user-select: text !important/
    );
    expect(INDEX_CSS).toMatch(
      /\.textedit-prosemirror-root\.ProseMirror \*[\s\S]*-webkit-user-select: text !important/
    );
  });

  test("hardens resize handles against text selection", () => {
    expect(INDEX_CSS).toMatch(
      /\.resize-handle \{[\s\S]*user-select: none !important/
    );
  });

  test("documents chrome reinforcement helpers", () => {
    expect(INDEX_CSS).toContain(".no-select-gesture");
    expect(INDEX_CSS).toContain(".draggable-area");
    expect(INDEX_CSS).toContain(".no-select-all");
  });
});
