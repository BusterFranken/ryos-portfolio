import { describe, test, expect } from "bun:test";
import {
  galleryAlbums,
  resolveGalleryAlbum,
} from "../src/apps/gallery/galleryConfig";
import { appIds, appNames } from "../src/config/appRegistryData";

describe("galleryConfig", () => {
  const GALLERY_IDS = ["workout", "jdog", "speaking"] as const;

  test("every gallery id resolves to an album", () => {
    for (const id of GALLERY_IDS) {
      expect(resolveGalleryAlbum(id)).toBeDefined();
    }
  });

  test("each album has a title and a mailto cta", () => {
    for (const id of GALLERY_IDS) {
      const album = resolveGalleryAlbum(id)!;
      expect(album.title).toBeTruthy();
      expect(album.cta).toBeDefined();
      expect(album.cta!.href).toMatch(/^mailto:/);
      expect(album.cta!.label).toBeTruthy();
    }
  });

  test("non-gallery id resolves to undefined", () => {
    expect(resolveGalleryAlbum("finder")).toBeUndefined();
  });

  test("all gallery ids are registered in appIds + appNames", () => {
    for (const id of Object.keys(galleryAlbums)) {
      expect(appIds).toContain(id);
      expect(appNames[id as keyof typeof appNames]).toBeTruthy();
    }
  });
});
