import { buildMailto } from "@/utils/contactChannels";

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

const GALLERY = "/assets/images/gallery";

export const galleryAlbums: GalleryAlbum[] = [
  {
    id: "speaking",
    title: "Speaking",
    blurb:
      "On stage — keynoting the European Commission's Digital Skills & Education Congress, and the main stage at World Summit AI, Amsterdam.",
    images: [`${GALLERY}/ec-digital-skills.jpg`, `${GALLERY}/world-summit-ai.jpg`],
    cta: {
      label: "Invite me to speak →",
      href: buildMailto("Speaking invite"),
    },
  },
  {
    id: "fruitpunch",
    title: "FruitPunch AI",
    blurb:
      "Building FruitPunch AI — our team, and the global community of volunteers we brought together for the AI-for-Good challenges.",
    images: [`${GALLERY}/fruitpunch-team.jpg`, `${GALLERY}/volunteers-meetup.jpg`],
    cta: {
      label: "Work with me →",
      href: buildMailto("Let's work together"),
    },
  },
  {
    id: "workout",
    title: "Workout",
    blurb: "A simpler, better workout app — Swift / iOS. (Screenshots coming soon.)",
    images: [],
    cta: {
      label: "Want something like this? →",
      href: buildMailto("Workout app"),
    },
  },
  {
    id: "jdog",
    title: "jDog",
    blurb:
      "Self-hosted, read-only WhatsApp digest agent (WAHA + Node/TS + SQLite). (Screenshots coming soon.)",
    images: [],
    cta: {
      label: "Want something like this? →",
      href: buildMailto("jDog"),
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
