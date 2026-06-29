import { useState } from "react";
import type { AppProps } from "@/apps/base/types";
import type { AppId } from "@/config/appRegistryData";
import { appNames } from "@/config/appRegistryData";
import type { DocViewerDoc } from "../docViewerConfig";
import { AppWindowShell } from "@/components/shared/AppWindowShell";
import { AppHelpAboutDialogs } from "@/components/shared/AppHelpAboutDialogs";
import { AppMenuBarShell } from "@/components/shared/menubar/AppMenuBarShell";
import {
  AppMenuBarMenus,
  type MenuItemDescriptor,
} from "@/components/shared/menubar/AppMenuBarMenus";
import { useAppMenuBarChrome } from "@/hooks/useAppMenuBarChrome";
import { useThemeFlags } from "@/hooks/useThemeFlags";
import { makeDocViewerMetadata } from "../metadata";

interface DocViewerMenuBarProps {
  appId: AppId;
  onClose: () => void;
  onOpenInNewTab?: () => void;
  onShowHelp: () => void;
  onShowAbout: () => void;
}

function DocViewerMenuBar({
  appId,
  onClose,
  onOpenInNewTab,
  onShowHelp,
  onShowAbout,
}: DocViewerMenuBarProps) {
  const {
    isShareDialogOpen,
    setIsShareDialogOpen,
    isWindowsTheme,
    isMacOSTheme,
    appName,
  } = useAppMenuBarChrome(appId);

  const fileItems: MenuItemDescriptor[] = [];
  if (onOpenInNewTab) {
    fileItems.push({
      type: "action",
      label: "Open in New Tab",
      onClick: onOpenInNewTab,
    });
    fileItems.push({ type: "separator" });
  }
  fileItems.push({
    type: "action",
    label: "Close",
    onClick: onClose,
    shortcutId: "close",
  });

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
      <AppMenuBarMenus menus={[{ label: "File", items: fileItems }]} />
    </AppMenuBarShell>
  );
}

export type DocViewerWindowProps = {
  appId: AppId;
  doc: DocViewerDoc;
} & AppProps;

export function DocViewerWindow({
  appId,
  doc,
  isWindowOpen,
  onClose,
  isForeground,
  skipInitialSound,
  instanceId,
  onNavigateNext,
  onNavigatePrevious,
}: DocViewerWindowProps) {
  const { isWindowsTheme } = useThemeFlags();
  const name = appNames[appId] ?? doc.title;
  const metadata = makeDocViewerMetadata(appId, name);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const hasDoc = doc.mode === "pdf" && !!doc.src;
  const openInNewTab = hasDoc
    ? () => window.open(doc.src, "_blank", "noopener")
    : undefined;

  const menuBar = (
    <DocViewerMenuBar
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
      <div className="size-full bg-white dark:bg-neutral-900">
        {hasDoc ? (
          <iframe
            src={doc.src}
            title={doc.title}
            className="size-full border-0"
          />
        ) : (
          // Intentional placeholder while the PDF is deferred.
          <div className="flex size-full flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex size-32 items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-gradient-to-br from-neutral-100 to-neutral-300 text-[56px] leading-none shadow-inner dark:border-neutral-700 dark:from-neutral-800 dark:to-neutral-900">
              <span aria-hidden>📄</span>
            </div>
            <div className="space-y-2">
              <h2 className="font-geneva-12 text-[16px] font-bold text-neutral-800 dark:text-neutral-100">
                {doc.title} (PDF) — coming soon
              </h2>
              <p className="font-geneva-12 mx-auto max-w-sm text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                The résumé will open here as a PDF. Check back shortly.
              </p>
            </div>
          </div>
        )}
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
