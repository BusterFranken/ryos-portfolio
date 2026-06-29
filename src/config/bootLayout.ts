import type { AppId } from "@/config/appRegistryData";

export interface BootEntry {
  appId: AppId;
  initialData?: unknown;
  title?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

/**
 * First-run "curated chaos": a few overlapping windows seeded on a visitor's
 * very first load (no persisted session) instead of a blank desktop. Also used
 * by the "Reset Desktop" action.
 *
 * Order is back-to-front (first entry = deepest, last entry = front-most /
 * foreground). Deliberately:
 *  - at most ONE live iframe at boot (`mpoftheweek`)
 *  - excludes `buster-barn` (full-screen takeover) and `casefile` (slow cold
 *    start) — those stay launch-on-click only.
 */
export const bootLayout: BootEntry[] = [
  {
    appId: "mpoftheweek",
    position: { x: 440, y: 60 },
    size: { width: 780, height: 540 },
  },
  {
    appId: "gallery",
    position: { x: 250, y: 230 },
    size: { width: 720, height: 470 },
  },
  {
    appId: "contacts",
    position: { x: 620, y: 290 },
    size: { width: 620, height: 430 },
  },
  {
    appId: "videos",
    position: { x: 80, y: 320 },
    size: { width: 400, height: 420 },
  },
  {
    appId: "textedit",
    initialData: { path: "/Documents/read_me_first.md" },
    title: "read_me_first.md",
    position: { x: 70, y: 55 },
    size: { width: 440, height: 480 },
  },
];
