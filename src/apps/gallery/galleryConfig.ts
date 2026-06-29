import type { AppId } from "@/config/appRegistryData";

/** A screenshot album rendered by the Gallery window (one per app id). */
export interface GalleryAlbum {
  appId: AppId;
  title: string;
  blurb?: string;
  /** Public image paths. Empty while screenshots are still deferred. */
  images: string[];
  /** "Work with me" style call-to-action shown at the bottom. */
  cta?: { label: string; href: string };
}

// TEMP demo images (existing aqua wallpapers) so the iPhoto-style viewer is
// visible before real screenshots land. Replace each album's `images` with the
// real Workout / jDog / speaking shots — then this constant can be deleted.
const DEMO_IMAGES = [
  "/wallpapers/photos/aqua/0-aqua-blue.jpg",
  "/wallpapers/photos/aqua/0-leopard-aqua_blue.jpg",
  "/wallpapers/photos/aqua/0-aqua-graphite.jpg",
  "/wallpapers/photos/aqua/0-leopard-aqua_graphite.jpg",
];

export const galleryAlbums: Partial<Record<AppId, GalleryAlbum>> = {
  workout: {
    appId: "workout",
    title: "Workout",
    blurb: "A simpler, better workout app — Swift / iOS.",
    images: DEMO_IMAGES,
    cta: {
      label: "Want something like this? Get in touch →",
      href: "mailto:busterfranken@gmail.com?subject=Workout%20app",
    },
  },
  jdog: {
    appId: "jdog",
    title: "jDog",
    blurb:
      "Self-hosted, read-only WhatsApp digest agent (WAHA + Node/TS + SQLite).",
    images: DEMO_IMAGES,
    cta: {
      label: "Want something like this? Get in touch →",
      href: "mailto:busterfranken@gmail.com?subject=jDog",
    },
  },
  speaking: {
    appId: "speaking",
    title: "Speaking",
    blurb: "Talks & events.",
    images: DEMO_IMAGES,
    cta: {
      label: "Invite me to speak →",
      href: "mailto:busterfranken@gmail.com?subject=Speaking%20invite",
    },
  },
};

export function resolveGalleryAlbum(appId: AppId): GalleryAlbum | undefined {
  return galleryAlbums[appId];
}
