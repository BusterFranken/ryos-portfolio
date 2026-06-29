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
import { cn } from "@/lib/utils";
import {
  osToolbarSurfaceClassName,
  windowsBevelClassName,
} from "@/components/shared/osThemePrimitives";

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
  const { isWindowsTheme, isMacOSTheme, isSystem7Theme, isWin98 } =
    useThemeFlags();
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

  // Native picture-viewer surfaces, per OS theme.
  const surfaceFlags = {
    isMacOSTheme,
    isSystem7Theme,
    isWindowsTheme,
    isWin98,
  };
  // The image "well": a classic sunken canvas matching each OS.
  const wellClassName = cn(
    "relative flex size-full items-center justify-center overflow-hidden",
    isMacOSTheme &&
      "rounded-md bg-neutral-200/70 shadow-[inset_0_1px_5px_rgba(0,0,0,0.2)] dark:bg-neutral-800",
    isSystem7Theme && "border-2 border-black bg-[#d8d8d8]",
    isWindowsTheme && cn(windowsBevelClassName("sunken"), "bg-[#c0c0c0]")
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
      <div className="flex size-full flex-col bg-os-window-bg text-os-text-primary">
        {/* Picture well */}
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3">
          <div className={wellClassName}>
            {hasImages ? (
              <img
                src={album.images[index]}
                alt={`${album.title} — ${index + 1} of ${total}`}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <div className="text-[56px] leading-none opacity-70" aria-hidden>
                  📸
                </div>
                <p className="font-geneva-12 text-[12px] text-os-text-secondary">
                  Screenshots coming soon
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation toolbar (native buttons + page counter) */}
        {total > 1 && (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center gap-3 px-3 py-1.5",
              osToolbarSurfaceClassName(surfaceFlags, { border: "top" })
            )}
          >
            <Button variant="secondary" size="sm" onClick={goPrev}>
              ‹ Prev
            </Button>
            <span className="font-geneva-12 min-w-[3.5rem] text-center text-[11px] tabular-nums text-os-text-secondary">
              {index + 1} / {total}
            </span>
            <Button variant="secondary" size="sm" onClick={goNext}>
              Next ›
            </Button>
          </div>
        )}

        {/* Caption + CTA */}
        <div
          className={cn(
            "shrink-0 space-y-2 px-5 py-4 text-center",
            osToolbarSurfaceClassName(surfaceFlags, { border: "top" })
          )}
        >
          <h2 className="font-geneva-12 text-[15px] font-bold text-os-text-primary">
            {album.title}
          </h2>
          {album.blurb && (
            <p className="font-geneva-12 mx-auto max-w-md text-[12px] leading-relaxed text-os-text-secondary">
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
