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

/** Per-project metadata (name + icon resolved from the registry id). */
export function makeProjectMetadata(appId: AppId, name: string) {
  return {
    ...appMetadata,
    name,
    icon: `/icons/default/${appId}.png`,
  };
}
