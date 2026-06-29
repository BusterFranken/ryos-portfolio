import type { AppProps } from "@/apps/base/types";
import type { AppId } from "@/config/appRegistryData";
import { createLazyComponent } from "@/config/lazyAppComponent";
import { resolveDoc } from "./docViewerConfig";
import { DocViewerWindow } from "./components/DocViewerWindow";

/**
 * Binds the shared DocViewer window to a single document id, wrapped in the
 * standard lazy boundary so the window-manager load lifecycle fires
 * (LazyLoadSignal → markInstanceAsLoaded). Without this the instance is never
 * marked "loaded" and the window never mounts when the app is launched.
 */
export function makeDocViewerApp(appId: AppId) {
  const DocViewerApp = (props: AppProps) => {
    const doc = resolveDoc(appId);
    if (!doc) return null;
    return <DocViewerWindow appId={appId} doc={doc} {...props} />;
  };
  return createLazyComponent(
    () => Promise.resolve({ default: DocViewerApp }),
    `docviewer:${appId}`
  );
}
