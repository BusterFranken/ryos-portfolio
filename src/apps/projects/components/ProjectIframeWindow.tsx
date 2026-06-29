import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AppProps } from "@/apps/base/types";
import type { AppId } from "@/config/appRegistryData";
import { appNames } from "@/config/appRegistryData";
import type { ProjectConfig } from "../projectConfig";
import { AppWindowShell } from "@/components/shared/AppWindowShell";
import { AppHelpAboutDialogs } from "@/components/shared/AppHelpAboutDialogs";
import { AppMenuBarShell } from "@/components/shared/menubar/AppMenuBarShell";
import { AppMenuBarMenus } from "@/components/shared/menubar/AppMenuBarMenus";
import { useAppMenuBarChrome } from "@/hooks/useAppMenuBarChrome";
import { useThemeFlags } from "@/hooks/useThemeFlags";
import { useAppStore } from "@/stores/useAppStore";
import { makeProjectMetadata } from "../metadata";
import { Button } from "@/components/ui/button";

/** ~15s without an onLoad => treat the frame as blocked and fall back. */
const LOAD_TIMEOUT_MS = 15000;

/** Above all OS chrome (menu bar, dock, windows) for the full-screen takeover. */
const FULLSCREEN_Z = 999999;

const IFRAME_SANDBOX =
  "allow-scripts allow-forms allow-same-origin allow-popups allow-pointer-lock";

type LoadStatus = "loading" | "loaded" | "error";

interface ProjectMenuBarProps {
  appId: AppId;
  onClose: () => void;
  onOpenInNewTab: () => void;
  onShowHelp: () => void;
  onShowAbout: () => void;
}

function ProjectMenuBar({
  appId,
  onClose,
  onOpenInNewTab,
  onShowHelp,
  onShowAbout,
}: ProjectMenuBarProps) {
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
                label: "Open in New Tab",
                onClick: onOpenInNewTab,
              },
              { type: "separator" },
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

export type ProjectIframeWindowProps = {
  appId: AppId;
  config: ProjectConfig;
} & AppProps;

export function ProjectIframeWindow({
  appId,
  config,
  isWindowOpen,
  onClose,
  isForeground,
  skipInitialSound,
  instanceId,
  onNavigateNext,
  onNavigatePrevious,
}: ProjectIframeWindowProps) {
  const { isWindowsTheme } = useThemeFlags();
  const bringInstanceToForeground = useAppStore(
    (s) => s.bringInstanceToForeground
  );
  // In full-screen there is no WindowFrame, so the AppProps `onClose` (which
  // dispatches a requestCloseWindow event the frame listens for) is a no-op.
  // Close the instance directly instead.
  const closeAppInstance = useAppStore((s) => s.closeAppInstance);
  const name = appNames[appId] ?? appId;
  const metadata = makeProjectMetadata(appId, name);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // "fullscreen" = the escape-the-OS takeover (only Buster-Barn today).
  const isFullscreen = config.mode === "fullscreen";
  // Preview projects render a card directly; iframe ones may fall back to it.
  const isIframeMode = config.mode === "live" || config.mode === "fullscreen";
  const showCard = config.mode === "preview" || status === "error";

  const openInNewTab = () => window.open(config.url, "_blank", "noopener");

  // Load-timeout guard: if the iframe never fires onLoad (framing blocked,
  // X-Frame-Options / CSP), fall back to the card.
  useEffect(() => {
    if (!isIframeMode) return;
    if (status !== "loading") return;
    timeoutRef.current = setTimeout(() => {
      setStatus((prev) => (prev === "loading" ? "error" : prev));
    }, LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isIframeMode, status, config.url]);

  // Esc returns to the desktop from the full-screen takeover. (Only fires while
  // the parent document has focus — once you click into the cross-origin game
  // iframe, keystrokes go to the game, so the Exit button is the sure way out.)
  useEffect(() => {
    if (!isFullscreen || !isWindowOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAppInstance(instanceId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen, isWindowOpen, closeAppInstance, instanceId]);

  const iframeEl = (
    <iframe
      title={name}
      src={config.url}
      className="size-full border-0 block"
      sandbox={IFRAME_SANDBOX}
      onLoad={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setStatus("loaded");
      }}
      onError={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setStatus("error");
      }}
    />
  );

  const loadingOverlay = status === "loading" && (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80">
      <div className="flex flex-col items-center gap-3 font-geneva-12 text-[12px] text-neutral-600 dark:text-neutral-300">
        <div className="size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600 dark:border-neutral-600 dark:border-t-neutral-200" />
        <span>Loading…</span>
      </div>
    </div>
  );

  const card = (
    <div className="flex size-full flex-col items-center justify-center gap-4 p-8 text-center">
      {config.previewImage && (
        <img
          src={config.previewImage}
          alt={name}
          className="max-h-48 w-auto rounded-md object-contain"
        />
      )}
      <h2 className="font-geneva-12 text-[16px] font-bold text-neutral-800 dark:text-neutral-100">
        {name}
      </h2>
      {config.previewBlurb && (
        <p className="font-geneva-12 max-w-md text-[12px] text-neutral-600 dark:text-neutral-300">
          {config.previewBlurb}
        </p>
      )}
      {status === "error" && config.mode !== "preview" && (
        <p className="font-geneva-12 max-w-md text-[11px] text-neutral-500 dark:text-neutral-400">
          This project can’t be embedded here. Open it in a new tab to view it.
        </p>
      )}
      <Button onClick={openInNewTab}>Open ↗</Button>
    </div>
  );

  // ── Full-screen "escape the OS" takeover ──────────────────────────────────
  // Render a chromeless, full-viewport portal over everything (no window frame,
  // no menu bar, no desktop) so it feels like you left the portfolio into the
  // game. Esc or the small Exit button returns to the desktop.
  if (isFullscreen) {
    if (!isWindowOpen) return null;
    return createPortal(
      <div className="fixed inset-0 bg-black" style={{ zIndex: FULLSCREEN_Z }}>
        {showCard ? (
          <div className="text-white [&_*]:!text-white">{card}</div>
        ) : (
          <>
            {iframeEl}
            {loadingOverlay}
          </>
        )}
        <button
          type="button"
          onClick={() => closeAppInstance(instanceId)}
          title="Return to desktop"
          aria-label="Return to desktop"
          className="absolute right-3 top-3 z-10 rounded bg-black/60 px-3 py-1.5 font-geneva-12 text-[12px] text-white/90 ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-black/80"
        >
          ✕ Exit game
        </button>
      </div>,
      document.body
    );
  }

  // ── Normal windowed project (live iframe / preview card) ─────────────────
  const menuBar = (
    <ProjectMenuBar
      appId={appId}
      onClose={onClose}
      onOpenInNewTab={openInNewTab}
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
      <div className="relative size-full bg-white dark:bg-neutral-900">
        {isIframeMode && !showCard && (
          <>
            {iframeEl}
            {loadingOverlay}
            {/* Transparent overlay: a click on the iframe focuses the window
                instead of being swallowed by the embedded page. */}
            {!isForeground && (
              <div
                className="absolute inset-0 z-50 bg-transparent"
                onClick={() => bringInstanceToForeground(instanceId)}
                onMouseDown={() => bringInstanceToForeground(instanceId)}
                onTouchStart={() => bringInstanceToForeground(instanceId)}
                onWheel={() => bringInstanceToForeground(instanceId)}
              />
            )}
          </>
        )}

        {showCard && card}
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
