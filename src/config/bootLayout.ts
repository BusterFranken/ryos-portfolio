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
 * foreground). The hero pairing is the D&D portfolio main page (`dnd-cv`, which
 * resolves to busterfranken.com) with the busterfranken.com Projects page open
 * right next to it in an Internet Explorer window. Both live iframes are the
 * same fast static host. `buster-barn` (full-screen takeover) and `casefile`
 * (slow cold start) stay launch-on-click only.
 */
export const bootLayout: BootEntry[] = [
  {
    appId: "dnd-cv",
    title: "busterfranken.com",
    position: { x: 120, y: 64 },
    size: { width: 660, height: 560 },
  },
  {
    appId: "internet-explorer",
    initialData: { url: "https://www.busterfranken.com/projects.html" },
    title: "Projects — busterfranken.com",
    position: { x: 800, y: 96 },
    size: { width: 560, height: 540 },
  },
  {
    appId: "pawnshop",
    position: { x: 380, y: 200 },
    size: { width: 720, height: 500 },
  },
  {
    appId: "gallery",
    position: { x: 200, y: 340 },
    size: { width: 620, height: 420 },
  },
  {
    appId: "contacts",
    position: { x: 840, y: 360 },
    size: { width: 540, height: 400 },
  },
  {
    appId: "textedit",
    initialData: { path: "/Documents/read_me_first.md" },
    title: "read_me_first.md",
    position: { x: 60, y: 52 },
    size: { width: 440, height: 480 },
  },
];
