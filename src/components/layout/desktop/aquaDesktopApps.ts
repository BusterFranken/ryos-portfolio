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
  "gallery",
  "cv-pdf",
  "contacts",
];
