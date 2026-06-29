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
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { osToolbarSurfaceClassName } from "@/components/shared/osThemePrimitives";
import { ImageSquare } from "@phosphor-icons/react";

/** iPhoto's signature charcoal photo canvas. */
const CANVAS_BG = "#2b2b2b";

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
  const [zoom, setZoom] = useState(1);

  const total = album.images.length;
  const hasImages = total > 0;

  // Reset zoom + clamp index when the album / selected image changes.
  useEffect(() => {
    if (index > total - 1) setIndex(Math.max(0, total - 1));
  }, [index, total]);
  useEffect(() => {
    setZoom(1);
  }, [index]);

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

  const surfaceFlags = { isMacOSTheme, isSystem7Theme, isWindowsTheme, isWin98 };
  const zoomPct = `${Math.round(zoom * 100)}%`;

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
      {hasImages ? (
        <div className="flex size-full flex-col bg-os-window-bg text-os-text-primary">
          {/* iPhoto charcoal photo canvas — white-matted photo with a drop shadow */}
          <div
            className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6"
            style={{ backgroundColor: CANVAS_BG }}
          >
            <div className="inline-block bg-white p-1.5 shadow-[0_10px_34px_rgba(0,0,0,0.6)]">
              <img
                src={album.images[index]}
                alt={`${album.title} — ${index + 1} of ${total}`}
                draggable={false}
                className="block object-contain"
                style={{ maxWidth: zoomPct, maxHeight: zoomPct }}
              />
            </div>
          </div>

          {/* Thumbnail strip */}
          {total > 1 && (
            <div
              className="flex shrink-0 items-center gap-2 overflow-x-auto px-3 py-2"
              style={{ backgroundColor: "#3a3a3a" }}
            >
              {album.images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Photo ${i + 1}`}
                  className={cn(
                    "shrink-0 overflow-hidden rounded-[2px] border-2 transition-opacity",
                    i === index
                      ? "border-white"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={src}
                    alt=""
                    draggable={false}
                    className="h-12 w-16 object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* iPhoto bottom toolbar: Size slider · info · CTA */}
          <div
            className={cn(
              "flex shrink-0 items-center gap-3 px-3 py-2",
              osToolbarSurfaceClassName(surfaceFlags, { border: "top" })
            )}
          >
            <div className="flex items-center gap-1.5">
              <ImageSquare
                size={11}
                weight="fill"
                className="text-os-text-secondary"
              />
              <Slider
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                min={1}
                max={3}
                step={0.05}
                aria-label="Size"
                className="w-24"
              />
              <ImageSquare
                size={17}
                weight="fill"
                className="text-os-text-secondary"
              />
            </div>
            <div className="min-w-0 flex-1 truncate text-center font-geneva-12 text-[11px] text-os-text-secondary">
              {album.title} — {index + 1} of {total}
            </div>
            {album.cta ? (
              <Button asChild size="sm" variant="secondary">
                <a href={album.cta.href}>{album.cta.label}</a>
              </Button>
            ) : (
              <div className="w-px" />
            )}
          </div>
        </div>
      ) : (
        /* Empty album — placeholder on the iPhoto canvas. */
        <div
          className="flex size-full flex-col items-center justify-center gap-4 p-8 text-center"
          style={{ backgroundColor: CANVAS_BG }}
        >
          <div className="text-[64px] leading-none opacity-60" aria-hidden>
            📸
          </div>
          <h2 className="font-geneva-12 text-[16px] font-bold text-white">
            {album.title}
          </h2>
          {album.blurb && (
            <p className="font-geneva-12 mx-auto max-w-md text-[12px] leading-relaxed text-white/70">
              {album.blurb}
            </p>
          )}
          <p className="font-geneva-12 text-[11px] text-white/45">
            Screenshots coming soon
          </p>
          {album.cta && (
            <Button asChild className="mt-1">
              <a href={album.cta.href}>{album.cta.label}</a>
            </Button>
          )}
        </div>
      )}

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
