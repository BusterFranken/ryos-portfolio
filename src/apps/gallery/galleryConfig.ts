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

export const galleryAlbums: Partial<Record<AppId, GalleryAlbum>> = {
  workout: {
    appId: "workout",
    title: "Workout",
    blurb: "A simpler, better workout app — Swift / iOS.",
    images: [],
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
    images: [],
    cta: {
      label: "Want something like this? Get in touch →",
      href: "mailto:busterfranken@gmail.com?subject=jDog",
    },
  },
  speaking: {
    appId: "speaking",
    title: "Speaking",
    blurb: "Talks & events.",
    images: [],
    cta: {
      label: "Invite me to speak →",
      href: "mailto:busterfranken@gmail.com?subject=Speaking%20invite",
    },
  },
};

export function resolveGalleryAlbum(appId: AppId): GalleryAlbum | undefined {
  return galleryAlbums[appId];
}
