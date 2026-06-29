import type { AppId } from "@/config/appRegistryData";

/** Shared metadata defaults for every DocViewer app (About dialog). */
export const appMetadata = {
  name: "DocViewer",
  version: "1.0.0",
  creator: {
    name: "Buster Franken",
    url: "https://github.com/BusterFranken",
  },
  github: "https://github.com/BusterFranken",
  icon: "/icons/default/app.png",
};

/** DocViewer apps have no help items. */
export const helpItems: Array<{
  icon: string;
  title: string;
  description: string;
}> = [];

/** Per-document metadata (name + icon resolved from the registry id). */
export function makeDocViewerMetadata(appId: AppId, name: string) {
  return {
    ...appMetadata,
    name,
    icon: `/icons/default/${appId}.png`,
  };
}
