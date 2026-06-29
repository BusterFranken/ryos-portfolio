import type { AppId } from "@/config/appRegistryData";

/** Shared metadata defaults for every Gallery album app (About dialog). */
export const appMetadata = {
  name: "Gallery",
  version: "1.0.0",
  creator: {
    name: "Buster Franken",
    url: "https://github.com/BusterFranken",
  },
  github: "https://github.com/BusterFranken",
  icon: "/icons/default/app.png",
};

/** Gallery apps have no help items. */
export const helpItems: Array<{
  icon: string;
  title: string;
  description: string;
}> = [];

/** Per-album metadata (name + icon resolved from the registry id). */
export function makeGalleryMetadata(appId: AppId, name: string) {
  return {
    ...appMetadata,
    name,
    icon: `/icons/default/${appId}.png`,
  };
}
