import type { AppId } from "@/config/appRegistryData";

export const appMetadata = {
  name: "Substack",
  version: "1.0.0",
  creator: {
    name: "Buster Franken",
    url: "https://github.com/BusterFranken",
  },
  github: "https://github.com/BusterFranken",
  icon: "/icons/default/substack.png",
};

export const helpItems: Array<{ icon: string; title: string; description: string }> = [];

export function makeSubstackMetadata(appId: AppId, name: string) {
  return { ...appMetadata, name, icon: `/icons/default/${appId}.png` };
}
