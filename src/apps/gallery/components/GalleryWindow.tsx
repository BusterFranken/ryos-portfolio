import { useEffect, useState, type ReactNode } from "react";
import type { AppProps } from "@/apps/base/types";
import type { AppId } from "@/config/appRegistryData";
import { appNames } from "@/config/appRegistryData";
import {
  galleryAlbums,
  getAlbum,
  getAllImages,
  type GalleryAlbum,
} from "../galleryConfig";
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
import {
  Images,
  CalendarBlank,
  Smiley,
  MapPin,
  FolderSimple,
  ImageSquare,
} from "@phosphor-icons/react";

/** iPhoto's signature charcoal photo canvas. */
const CANVAS_BG = "#2b2b2b";
/** Classic Aqua selection blue for the source list. */
const SELECTION_BG = "#3875d7";

type Source =
  | { kind: "library"; id: "photos" | "events" | "faces" | "places" }
  | { kind: "album"; id: string };

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

function SourceItem({
  icon,
  label,
  selected,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-[3px] text-left font-geneva-12 text-[12px]",
        selected
          ? "text-white"
          : "text-os-text-primary hover:bg-black/[0.06]"
      )}
      style={selected ? { backgroundColor: SELECTION_BG } : undefined}
    >
      <span className="shrink-0 opacity-90">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2 pb-0.5 pt-1 font-geneva-12 text-[10px] font-bold uppercase tracking-wide text-os-text-secondary">
      {children}
    </div>
  );
}

export type GalleryWindowProps = { appId: AppId } & AppProps;

export function GalleryWindow({
  appId,
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
  const name = appNames[appId] ?? "Gallery";
  const metadata = makeGalleryMetadata(appId, name);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [source, setSource] = useState<Source>({
    kind: "library",
    id: "photos",
  });
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  // What the main area shows for the current source.
  const view: "viewer" | "events" | "faces" | "places" =
    source.kind === "library" && source.id !== "photos" ? source.id : "viewer";

  const album: GalleryAlbum | undefined =
    source.kind === "album" ? getAlbum(source.id) : undefined;
  const images = source.kind === "album" ? album?.images ?? [] : getAllImages();
  const viewerTitle = source.kind === "album" ? album?.title ?? "" : "Photos";
  const viewerCta = source.kind === "album" ? album?.cta : undefined;
  const total = images.length;

  // Reset position/zoom when the source changes.
  useEffect(() => {
    setIndex(0);
    setZoom(1);
  }, [source.kind, source.id]);
  useEffect(() => {
    setZoom(1);
  }, [index]);

  const goPrev = () =>
    setIndex((i) => (total > 0 ? (i - 1 + total) % total : 0));
  const goNext = () => setIndex((i) => (total > 0 ? (i + 1) % total : 0));

  useEffect(() => {
    if (!isWindowOpen || view !== "viewer" || total < 2) return;
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
  }, [isWindowOpen, view, total]);

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
  const iconColor = "currentColor";

  const isLib = (id: "photos" | "events" | "faces" | "places") =>
    source.kind === "library" && source.id === id;

  const sidebar = (
    <div
      className={cn(
        "flex w-40 shrink-0 flex-col gap-2 overflow-y-auto border-r p-2",
        isMacOSTheme && "bg-neutral-100/80 border-black/10",
        isSystem7Theme && "bg-white border-black",
        isWindowsTheme && "bg-os-window-bg border-os-separator"
      )}
    >
      <div>
        <GroupLabel>Library</GroupLabel>
        <SourceItem
          icon={<Images size={15} color={iconColor} weight="fill" />}
          label="Photos"
          selected={isLib("photos")}
          onClick={() => setSource({ kind: "library", id: "photos" })}
        />
        <SourceItem
          icon={<CalendarBlank size={15} color={iconColor} weight="fill" />}
          label="Events"
          selected={isLib("events")}
          onClick={() => setSource({ kind: "library", id: "events" })}
        />
        <SourceItem
          icon={<Smiley size={15} color={iconColor} weight="fill" />}
          label="Faces"
          selected={isLib("faces")}
          onClick={() => setSource({ kind: "library", id: "faces" })}
        />
        <SourceItem
          icon={<MapPin size={15} color={iconColor} weight="fill" />}
          label="Places"
          selected={isLib("places")}
          onClick={() => setSource({ kind: "library", id: "places" })}
        />
      </div>
      <div>
        <GroupLabel>Albums</GroupLabel>
        {galleryAlbums.map((a) => (
          <SourceItem
            key={a.id}
            icon={<FolderSimple size={15} color={iconColor} weight="fill" />}
            label={a.title}
            selected={source.kind === "album" && source.id === a.id}
            onClick={() => setSource({ kind: "album", id: a.id })}
          />
        ))}
      </div>
    </div>
  );

  let main: ReactNode;
  if (view === "events") {
    main = (
      <div
        className="flex-1 overflow-auto p-5"
        style={{ backgroundColor: CANVAS_BG }}
      >
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          {galleryAlbums.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSource({ kind: "album", id: a.id })}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="aspect-[4/3] w-full overflow-hidden rounded-[3px] bg-white p-1 shadow-[0_6px_18px_rgba(0,0,0,0.5)]">
                {a.images[0] ? (
                  <img
                    src={a.images[0]}
                    alt=""
                    draggable={false}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-neutral-200 text-2xl">
                    📸
                  </div>
                )}
              </div>
              <span className="font-geneva-12 text-[11px] text-white/90">
                {a.title}
              </span>
              <span className="font-geneva-12 text-[10px] text-white/45">
                {a.images.length} photos
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  } else if (view === "faces" || view === "places") {
    const Icon = view === "faces" ? Smiley : MapPin;
    main = (
      <div
        className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center"
        style={{ backgroundColor: CANVAS_BG }}
      >
        <Icon size={52} color="#ffffff" weight="thin" className="opacity-30" />
        <p className="font-geneva-12 text-[12px] text-white/60">
          {view === "faces"
            ? "No faces detected."
            : "No photos with a location yet."}
        </p>
      </div>
    );
  } else {
    // Photo viewer (single album or all "Photos").
    main = (
      <div className="flex min-w-0 flex-1 flex-col">
        {/* charcoal canvas — matted photo with a drop shadow */}
        <div
          className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6"
          style={{ backgroundColor: CANVAS_BG }}
        >
          {total > 0 ? (
            <div className="inline-block bg-white p-1.5 shadow-[0_10px_34px_rgba(0,0,0,0.6)]">
              <img
                src={images[index]}
                alt={`${viewerTitle} — ${index + 1} of ${total}`}
                draggable={false}
                className="block object-contain"
                style={{ maxWidth: zoomPct, maxHeight: zoomPct }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="text-[56px] leading-none opacity-60" aria-hidden>
                📸
              </div>
              <p className="font-geneva-12 text-[12px] text-white/55">
                Screenshots coming soon
              </p>
            </div>
          )}
        </div>

        {/* thumbnail strip */}
        {total > 1 && (
          <div
            className="flex shrink-0 items-center gap-2 overflow-x-auto px-3 py-2"
            style={{ backgroundColor: "#3a3a3a" }}
          >
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
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
          {total > 0 && (
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
          )}
          <div className="min-w-0 flex-1 truncate text-center font-geneva-12 text-[11px] text-os-text-secondary">
            {total > 0
              ? `${viewerTitle} — ${index + 1} of ${total}`
              : viewerTitle}
          </div>
          {viewerCta ? (
            <Button asChild size="sm" variant="secondary">
              <a href={viewerCta.href}>{viewerCta.label}</a>
            </Button>
          ) : (
            <div className="w-px" />
          )}
        </div>
      </div>
    );
  }

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
      <div className="flex size-full bg-os-window-bg text-os-text-primary">
        {sidebar}
        {main}
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
