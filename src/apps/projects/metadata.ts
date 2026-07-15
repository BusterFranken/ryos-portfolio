import type { AppId } from "@/config/appRegistryData";

/** Shared metadata defaults for every project app (About dialog content). */
export const appMetadata = {
  name: "Project",
  version: "1.0.0",
  creator: {
    name: "Buster Franken",
    url: "https://github.com/BusterFranken",
  },
  github: "https://github.com/BusterFranken",
  icon: "/icons/default/internet.png",
};

/** Project apps have no help items. */
export const helpItems: Array<{
  icon: string;
  title: string;
  description: string;
}> = [];

/** Per-project metadata. Icon defaults to the id's .svg; pass an explicit path
 * for projects using a different icon file (e.g. a real macOS .png). */
export function makeProjectMetadata(appId: AppId, name: string, icon?: string) {
  return {
    ...appMetadata,
    name,
    icon: icon ?? `/icons/default/${appId}.svg`,
  };
}
