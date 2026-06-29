import type { AppProps } from "@/apps/base/types";
import { createLazyComponent } from "@/config/lazyAppComponent";
import { GalleryWindow } from "./components/GalleryWindow";

/**
 * The single Gallery app (iPhoto-style source-list sidebar + albums). Wrapped in
 * the standard lazy boundary so the window-manager load lifecycle fires
 * (LazyLoadSignal → markInstanceAsLoaded) and the window mounts on launch.
 */
export function makeGalleryApp() {
  const GalleryApp = (props: AppProps) => (
    <GalleryWindow appId="gallery" {...props} />
  );
  return createLazyComponent(
    () => Promise.resolve({ default: GalleryApp }),
    "gallery"
  );
}
