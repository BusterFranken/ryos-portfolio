import type { AppId } from "@/config/appRegistryData";

// Featured project icons shown on the desktop (all themes). The portfolio's
// projects ARE the desktop, so these always render (see useDesktop /
// DesktopIconGrid) rather than only as a fallback when there are no shortcuts.
// See SPEC §6. (Name kept for import stability; now used on every theme.)
export const AQUA_DESKTOP_APP_IDS: AppId[] = [
  "buster-barn",
  "casefile",
  "hush",
  "kafka-form",
  "eigenvector",
  "mpoftheweek",
  "dnd-cv",
  "tarot",
  "pawnshop",
  "jdog",
  "gallery",
  "cv-pdf",
  // "substack" — deferred (not enough content yet); app stays registered but
  // hidden from the desktop so visitors don't hit an empty reader. Re-add when
  // there's a real publication feed. See docs/DEFERRED.md.
  "contacts",
  // Fun extras — the classic OS apps, also featured on the desktop (EVE-269).
  "pc",
  "minesweeper",
  "go",
  "synth",
  "winamp",
];
