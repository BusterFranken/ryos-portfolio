import type { AppProps } from "@/apps/base/types";
import type { AppId } from "@/config/appRegistryData";
import { createLazyComponent } from "@/config/lazyAppComponent";
import { resolveGalleryAlbum } from "./galleryConfig";
import { GalleryWindow } from "./components/GalleryWindow";

/**
 * Binds the shared Gallery window to a single album id, wrapped in the standard
 * lazy boundary so the window-manager load lifecycle fires
 * (LazyLoadSignal → markInstanceAsLoaded). Without this the instance is never
 * marked "loaded" and the window never mounts when the app is launched.
 */
export function makeGalleryApp(appId: AppId) {
  const GalleryApp = (props: AppProps) => {
    const album = resolveGalleryAlbum(appId);
    if (!album) return null;
    return <GalleryWindow appId={appId} album={album} {...props} />;
  };
  return createLazyComponent(
    () => Promise.resolve({ default: GalleryApp }),
    `gallery:${appId}`
  );
}
