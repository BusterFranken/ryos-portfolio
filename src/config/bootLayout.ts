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
 * right next to it in an Internet Explorer window. Videos (a FruitPunch talk
 * loaded + paused), the iPod (Recently on Spotify), and Maps (Amsterdam) also
 * open by default. Per EVE-267 the project apps `mpoftheweek`, `hush`,
 * `kafka-form`, `pawnshop`, `buster-barn`, and `casefile` stay launch-on-click
 * only.
 */
export const bootLayout: BootEntry[] = [
  {
    appId: "dnd-cv",
    title: "busterfranken.com",
    // Big "hero" size — but it's the back-most window, so README, Videos,
    // Gallery and jDog overlap it (EVE-263: nice and large, but never in front).
    position: { x: 100, y: 56 },
    size: { width: 900, height: 680 },
  },
  {
    appId: "internet-explorer",
    // The FruitPunch AI project board (all the AI-for-… challenges).
    initialData: { url: "https://www.busterfranken.com/projects.html" },
    title: "FruitPunch AI — Projects",
    position: { x: 800, y: 96 },
    size: { width: 560, height: 540 },
  },
  {
    appId: "jdog",
    position: { x: 560, y: 320 },
    size: { width: 640, height: 430 },
  },
  {
    appId: "gallery",
    position: { x: 170, y: 380 },
    size: { width: 560, height: 380 },
  },
  {
    // The Videos app opens with the first FruitPunch talk loaded + paused and
    // the full talk playlist to click through.
    appId: "videos",
    position: { x: 340, y: 150 },
    size: { width: 500, height: 400 },
  },
  {
    // Maps opens on the "based in Amsterdam" view.
    appId: "maps",
    position: { x: 720, y: 430 },
    size: { width: 480, height: 360 },
  },
  {
    // Opens scrolled to the "WHO" section (Buster's photo + bio) via the
    // #about anchor in projectConfig. Buster's namesake current project.
    appId: "eigenvector",
    position: { x: 430, y: 110 },
    size: { width: 760, height: 580 },
  },
  {
    appId: "contacts",
    position: { x: 910, y: 400 },
    size: { width: 490, height: 360 },
  },
  {
    appId: "ipod",
    initialData: { openRecentlyOnSpotify: true },
    position: { x: 1120, y: 70 },
    size: { width: 290, height: 460 },
  },
  {
    appId: "textedit",
    initialData: { path: "/Documents/README.md" },
    title: "README.md",
    position: { x: 56, y: 56 },
    size: { width: 360, height: 420 },
  },
];
