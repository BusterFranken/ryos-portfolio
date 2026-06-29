/**
 * Lightweight app registry data - only IDs and names
 * This file can be imported without triggering heavy component loads
 * Used by stores that need basic app info during initialization
 */

export const appIds = [
  "finder",
  "soundboard",
  "internet-explorer",
  "textedit",
  "paint",
  "photo-booth",
  "minesweeper",
  "videos",
  "ipod",
  "synth",
  "terminal",
  "control-panels",
  "stickies",
  "infinite-mac",
  "pc",
  "winamp",
  "calendar",
  "contacts",
  "dashboard",
  "maps",
  "books",
  "buster-barn",
  "casefile",
  "hush",
  "kafka-form",
  "eigenvector",
  "mpoftheweek",
  "dnd-cv",
  "tarot",
  "pawnshop",
  "workout",
  "jdog",
  "speaking",
  "cv-pdf",
] as const;

export type AppId = (typeof appIds)[number];

/** Persisted / bookmarked IDs that were renamed in the registry */
export const LEGACY_APP_ID_ALIASES: Record<string, AppId> = {
  "infinite-pc": "pc",
};

const APP_ID_SET = new Set<string>(appIds);

export function resolveAppId(id: string): AppId | undefined {
  const candidate = (LEGACY_APP_ID_ALIASES[id] ?? id) as AppId;
  return APP_ID_SET.has(candidate) ? candidate : undefined;
}

/** Minimal app data for stores that don't need full registry */
export interface AppBasicInfo {
  id: AppId;
  name: string;
}

/** App ID to name mapping - matches appRegistry names exactly */
export const appNames: Record<AppId, string> = {
  "finder": "Finder",
  "soundboard": "Soundboard",
  "internet-explorer": "Internet Explorer",
  "textedit": "TextEdit",
  "paint": "Paint",
  "photo-booth": "Photo Booth",
  "minesweeper": "Minesweeper",
  "videos": "Videos",
  "ipod": "iPod",
  "synth": "Synth",
  "terminal": "Terminal",
  "control-panels": "Control Panels",
  "stickies": "Stickies",
  "infinite-mac": "Infinite Mac",
  pc: "Virtual PC",
  "winamp": "Winamp",
  "calendar": "Calendar",
  "contacts": "Contacts",
  "dashboard": "Dashboard",
  "maps": "Maps",
  "books": "Books",
  "buster-barn": "Buster-Barn",
  "casefile": "Casefile",
  "hush": "Hush",
  "kafka-form": "Kafka Form",
  "eigenvector": "Eigenvector",
  "mpoftheweek": "MP of the Week",
  "dnd-cv": "CV",
  "tarot": "Tarot",
  "pawnshop": "Pawnshop",
  "workout": "Workout",
  "jdog": "jDog",
  "speaking": "Speaking",
  "cv-pdf": "Résumé",
};

/** Get list of apps with basic info for stores */
export function getAppBasicInfoList(): AppBasicInfo[] {
  return appIds.map(id => ({ id, name: appNames[id] }));
}
