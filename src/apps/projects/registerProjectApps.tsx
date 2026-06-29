import type { AppProps } from "@/apps/base/types";
import type { AppId } from "@/config/appRegistryData";
import { resolveProjectConfig } from "./projectConfig";
import { ProjectIframeWindow } from "./components/ProjectIframeWindow";

/** Binds the shared project window to a single project id for the registry. */
export function makeProjectApp(appId: AppId) {
  return function ProjectApp(props: AppProps) {
    const config = resolveProjectConfig(appId);
    if (!config) return null;
    return <ProjectIframeWindow appId={appId} config={config} {...props} />;
  };
}
