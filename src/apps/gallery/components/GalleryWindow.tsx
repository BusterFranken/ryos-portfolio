import { useEffect, useState } from "react";
import type { AppProps } from "@/apps/base/types";
import type { AppId } from "@/config/appRegistryData";
import { appNames } from "@/config/appRegistryData";
import type { GalleryAlbum } from "../galleryConfig";
import { AppWindowShell } from "@/components/shared/AppWindowShell";
import { AppHelpAboutDialogs } from "@/components/shared/AppHelpAboutDialogs";
import { AppMenuBarShell } from "@/components/shared/menubar/AppMenuBarShell";
import { AppMenuBarMenus } from "@/components/shared/menubar/AppMenuBarMenus";
import { useAppMenuBarChrome } from "@/hooks/useAppMenuBarChrome";
import { useThemeFlags } from "@/hooks/useThemeFlags";
import { makeGalleryMetadata } from "../metadata";
import { Button } from "@/components/ui/button";

interface GalleryMenuBarProps {
  appId: AppId;
  onClose: () => void;
  onShowHelp: () => void;
  onShowAbout: () => void;
}

function GalleryMenuBar({
  appId,
  onClose,
  onShowHelp,
  onShowAbout,
}: GalleryMenuBarProps) {
  const {
    isShareDialogOpen,
    setIsShareDialogOpen,
    isWindowsTheme,
    isMacOSTheme,
    appName,
  } = useAppMenuBarChrome(appId);

  return (
    <AppMenuBarShell
      isWindowsTheme={isWindowsTheme}
      isMacOSTheme={isMacOSTheme}
      appId={appId}
      appName={appName}
      isShareDialogOpen={isShareDialogOpen}
      setIsShareDialogOpen={setIsShareDialogOpen}
      helpItemLabel="Help"
      aboutItemLabel={`About ${appName}`}
      onShowHelp={onShowHelp}
      onShowAbout={onShowAbout}
    >
      <AppMenuBarMenus
        menus={[
          {
            label: "File",
            items: [
              {
                type: "action",
                label: "Close",
                onClick: onClose,
                shortcutId: "close",
              },
            ],
          },
        ]}
      />
    </AppMenuBarShell>
  );
}

export type GalleryWindowProps = {
  appId: AppId;
  album: GalleryAlbum;
} & AppProps;

export function GalleryWindow({
  appId,
  album,
  isWindowOpen,
  onClose,
  isForeground,
  skipInitialSound,
  instanceId,
  onNavigateNext,
  onNavigatePrevious,
}: GalleryWindowProps) {
  const { isWindowsTheme } = useThemeFlags();
  const name = appNames[appId] ?? album.title;
  const metadata = makeGalleryMetadata(appId, name);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const total = album.images.length;
  const hasImages = total > 0;

  // Clamp the index if the album shrinks (defensive — images are static today).
  useEffect(() => {
    if (index > total - 1) setIndex(Math.max(0, total - 1));
  }, [index, total]);

  const goPrev = () =>
    setIndex((i) => (total > 0 ? (i - 1 + total) % total : 0));
  const goNext = () => setIndex((i) => (total > 0 ? (i + 1) % total : 0));

  // ArrowLeft / ArrowRight flick through the album while the window is open.
  useEffect(() => {
    if (!isWindowOpen || !hasImages) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isWindowOpen, hasImages, total]);

  const menuBar = (
    <GalleryMenuBar
      appId={appId}
      onClose={onClose}
      onShowHelp={() => setIsHelpOpen(true)}
      onShowAbout={() => setIsAboutOpen(true)}
    />
  );

  return (
    <AppWindowShell
      isWindowOpen={isWindowOpen}
      isWindowsTheme={isWindowsTheme}
      isForeground={isForeground}
      menuBar={menuBar}
      windowFrameProps={{
        title: name,
        onClose,
        isForeground,
        appId,
        skipInitialSound,
        instanceId,
        onNavigateNext,
        onNavigatePrevious,
      }}
    >
      <div className="flex size-full flex-col bg-white dark:bg-neutral-900">
        {/* Viewer area */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-neutral-100 dark:bg-neutral-950">
          {hasImages ? (
            <>
              <img
                src={album.images[index]}
                alt={`${album.title} — ${index + 1} of ${total}`}
                className="max-h-full max-w-full object-contain"
              />
              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-black/50 px-3 py-2 font-geneva-12 text-[14px] text-white/90 ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-black/70"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-black/50 px-3 py-2 font-geneva-12 text-[14px] text-white/90 ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-black/70"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-black/55 px-2 py-0.5 font-geneva-12 text-[11px] text-white/90 backdrop-blur">
                    {index + 1} / {total}
                  </div>
                </>
              )}
            </>
          ) : (
            // Intentional placeholder while screenshots are deferred.
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <div className="flex size-32 items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-gradient-to-br from-neutral-100 to-neutral-300 text-[56px] leading-none shadow-inner dark:border-neutral-700 dark:from-neutral-800 dark:to-neutral-900">
                <span aria-hidden>📸</span>
              </div>
              <p className="font-geneva-12 text-[12px] text-neutral-600 dark:text-neutral-300">
                Screenshots coming soon
              </p>
            </div>
          )}
        </div>

        {/* Caption + CTA */}
        <div className="shrink-0 space-y-2 border-t border-black/10 px-5 py-4 text-center dark:border-white/10">
          <h2 className="font-geneva-12 text-[16px] font-bold text-neutral-800 dark:text-neutral-100">
            {album.title}
          </h2>
          {album.blurb && (
            <p className="font-geneva-12 mx-auto max-w-md text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
              {album.blurb}
            </p>
          )}
          {album.cta && (
            <Button asChild className="mt-1">
              <a href={album.cta.href}>{album.cta.label}</a>
            </Button>
          )}
        </div>
      </div>

      <AppHelpAboutDialogs
        appId={appId}
        helpItems={[]}
        metadata={metadata}
        isHelpOpen={isHelpOpen}
        onHelpOpenChange={setIsHelpOpen}
        isAboutOpen={isAboutOpen}
        onAboutOpenChange={setIsAboutOpen}
      />
    </AppWindowShell>
  );
}
