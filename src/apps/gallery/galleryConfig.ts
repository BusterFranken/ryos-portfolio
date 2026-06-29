/** A screenshot album shown in the Gallery (selectable from the source list). */
export interface GalleryAlbum {
  id: string;
  title: string;
  blurb?: string;
  /** Public image paths. Empty while screenshots are still deferred. */
  images: string[];
  /** "Work with me" style call-to-action shown in the toolbar. */
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

export const galleryAlbums: GalleryAlbum[] = [
  {
    id: "workout",
    title: "Workout",
    blurb: "A simpler, better workout app — Swift / iOS.",
    images: DEMO_IMAGES,
    cta: {
      label: "Want something like this? →",
      href: "mailto:busterfranken@gmail.com?subject=Workout%20app",
    },
  },
  {
    id: "jdog",
    title: "jDog",
    blurb:
      "Self-hosted, read-only WhatsApp digest agent (WAHA + Node/TS + SQLite).",
    images: DEMO_IMAGES,
    cta: {
      label: "Want something like this? →",
      href: "mailto:busterfranken@gmail.com?subject=jDog",
    },
  },
  {
    id: "speaking",
    title: "Speaking",
    blurb: "Talks & events.",
    images: DEMO_IMAGES,
    cta: {
      label: "Invite me to speak →",
      href: "mailto:busterfranken@gmail.com?subject=Speaking%20invite",
    },
  },
];

export function getAlbum(id: string): GalleryAlbum | undefined {
  return galleryAlbums.find((a) => a.id === id);
}

/** Every image across all albums (the "Photos" library view). */
export function getAllImages(): string[] {
  return galleryAlbums.flatMap((a) => a.images);
}
