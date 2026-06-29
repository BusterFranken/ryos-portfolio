import { describe, test, expect } from "bun:test";
import {
  galleryAlbums,
  getAlbum,
  getAllImages,
} from "../src/apps/gallery/galleryConfig";
import { appIds, appNames } from "../src/config/appRegistryData";

describe("galleryConfig", () => {
  test("there are albums, each with an id, title and a mailto cta", () => {
    expect(galleryAlbums.length).toBeGreaterThan(0);
    for (const album of galleryAlbums) {
      expect(album.id).toBeTruthy();
      expect(album.title).toBeTruthy();
      expect(album.cta).toBeDefined();
      expect(album.cta!.href).toMatch(/^mailto:/);
      expect(album.cta!.label).toBeTruthy();
    }
  });

  test("getAlbum resolves known albums and undefined otherwise", () => {
    expect(getAlbum("workout")).toBeDefined();
    expect(getAlbum("does-not-exist")).toBeUndefined();
  });

  test("getAllImages flattens every album's images", () => {
    const total = galleryAlbums.reduce((n, a) => n + a.images.length, 0);
    expect(getAllImages().length).toBe(total);
  });

  test("the single Gallery app is registered", () => {
    expect(appIds).toContain("gallery");
    expect(appNames.gallery).toBe("Gallery");
  });
});
