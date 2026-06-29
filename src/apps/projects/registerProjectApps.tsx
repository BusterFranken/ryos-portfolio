import type { AppProps } from "@/apps/base/types";
import type { AppId } from "@/config/appRegistryData";
import { createLazyComponent } from "@/config/lazyAppComponent";
import { resolveProjectConfig } from "./projectConfig";
import { ProjectIframeWindow } from "./components/ProjectIframeWindow";

/**
 * Binds the shared project window to a single project id, wrapped in the
 * standard lazy boundary so the window-manager load lifecycle fires
 * (LazyLoadSignal → markInstanceAsLoaded). Without this the instance is never
 * marked "loaded" and the window never mounts when the app is launched.
 */
export function makeProjectApp(appId: AppId) {
  const ProjectApp = (props: AppProps) => {
    const config = resolveProjectConfig(appId);
    if (!config) return null;
    return <ProjectIframeWindow appId={appId} config={config} {...props} />;
  };
  return createLazyComponent(
    () => Promise.resolve({ default: ProjectApp }),
    `project:${appId}`
  );
}
