import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const textEditSource = readFileSync(
  "src/apps/textedit/hooks/useFileOperations.ts",
  "utf8"
);
const paintSource = readFileSync(
  "src/apps/paint/hooks/usePaintLogic.ts",
  "utf8"
);
const fileMetadataServiceSource = readFileSync(
  "src/services/vfs/FileMetadataService.ts",
  "utf8"
);
const vfsFileOperationsSource = readFileSync(
  "src/services/vfs/useVfsFileOperations.ts",
  "utf8"
);

describe("VFS service wiring", () => {
  test("TextEdit uses VFS services for save/load", () => {
    expect(textEditSource).toContain("@/services/vfs/useVfsFileOperations");
    expect(textEditSource).toContain("@/services/vfs/FileContentRepository");
    expect(textEditSource).not.toContain("@/apps/finder/hooks/useFileSystem");
    expect(textEditSource).not.toContain("@/utils/indexedDB");
  });

  test("Paint uses VFS services for save/load", () => {
    expect(paintSource).toContain("@/services/vfs/useVfsFileOperations");
    expect(paintSource).toContain("@/services/vfs/FileContentRepository");
    expect(paintSource).not.toContain("@/apps/finder/hooks/useFileSystem");
    expect(paintSource).not.toContain("@/utils/indexedDB");
  });

  test("VFS metadata path selector caches derived arrays", () => {
    expect(fileMetadataServiceSource).toContain(
      'import { useShallow } from "zustand/react/shallow";'
    );
    expect(fileMetadataServiceSource).toContain(
      "useFilesStore(useShallow((state) => state.getItemsInPath(path)))"
    );
    expect(fileMetadataServiceSource).not.toContain(
      "useFilesStore((state) => state.getItemsInPath(path))"
    );
  });

  test("VFS file operations hook uses skipLoad to avoid Finder file-loading effects", () => {
    expect(vfsFileOperationsSource).toContain(
      "useFileSystem(basePath, { skipLoad: true })"
    );
  });
});
