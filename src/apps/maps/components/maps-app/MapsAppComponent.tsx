import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppWindowShell } from "@/components/shared/AppWindowShell";
import { AppHelpAboutDialogs } from "@/components/shared/AppHelpAboutDialogs";
import { AppMenuBarShell } from "@/components/shared/menubar/AppMenuBarShell";
import {
  AppMenuBarMenus,
  type MenuDescriptor,
} from "@/components/shared/menubar/AppMenuBarMenus";
import { useAppMenuBarChrome } from "@/hooks/useAppMenuBarChrome";
import type { AppProps } from "@/apps/base/types";
import { appMetadata, helpItems } from "../..";

// "Where I'm based" — Nieuwegrachtje, in the Nieuwmarkt/Lastage quarter of
// central Amsterdam. Rendered with a token-free OpenStreetMap embed (the app's
// original Apple MapKit view needs a signing token this static build doesn't
// have). See docs/DEFERRED.md for the history.
const AMS = {
  label: "Amsterdam",
  subLabel: "Nieuwegrachtje · Nieuwmarkt",
  lat: 52.3706,
  lon: 4.9087,
  // A tight bbox around the marker for a neighbourhood-level view.
  bbox: "4.8967,52.3676,4.9207,52.3736",
};

const OSM_EMBED = `https://www.openstreetmap.org/export/embed.html?bbox=${AMS.bbox}&layer=mapnik&marker=${AMS.lat},${AMS.lon}`;
const OSM_FULL = `https://www.openstreetmap.org/?mlat=${AMS.lat}&mlon=${AMS.lon}#map=15/${AMS.lat}/${AMS.lon}`;

export function MapsAppComponent({
  isWindowOpen,
  onClose,
  isForeground,
  skipInitialSound,
  instanceId,
}: AppProps) {
  const { t } = useTranslation();
  const {
    isWindowsTheme,
    isMacOSTheme,
    appId,
    appName,
    isShareDialogOpen,
    setIsShareDialogOpen,
  } = useAppMenuBarChrome("maps");
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);

  const menus: MenuDescriptor[] = [
    {
      label: t("common.menu.file"),
      items: [
        {
          type: "action",
          label: t("common.menu.close"),
          onClick: onClose,
          shortcutId: "close",
        },
      ],
    },
  ];

  const menuBar = (
    <AppMenuBarShell
      isWindowsTheme={isWindowsTheme}
      isMacOSTheme={isMacOSTheme}
      appId={appId}
      appName={appName}
      isShareDialogOpen={isShareDialogOpen}
      setIsShareDialogOpen={setIsShareDialogOpen}
      helpItemLabel={t("apps.maps.menu.help", { defaultValue: "Maps Help" })}
      aboutItemLabel={t("apps.maps.menu.about", { defaultValue: "About Maps" })}
      onShowHelp={() => setIsHelpDialogOpen(true)}
      onShowAbout={() => setIsAboutDialogOpen(true)}
    >
      <AppMenuBarMenus menus={menus} />
    </AppMenuBarShell>
  );

  return (
    <AppWindowShell
      isWindowOpen={isWindowOpen}
      isWindowsTheme={isWindowsTheme}
      isForeground={isForeground}
      menuBar={menuBar}
      windowFrameProps={{
        title: t("apps.maps.title", { defaultValue: "Maps" }),
        onClose,
        isForeground,
        appId: "maps",
        material: "notitlebar",
        skipInitialSound,
        instanceId,
      }}
      trailing={
        <AppHelpAboutDialogs
          appId="maps"
          helpItems={helpItems}
          metadata={appMetadata}
          isHelpOpen={isHelpDialogOpen}
          onHelpOpenChange={setIsHelpDialogOpen}
          isAboutOpen={isAboutDialogOpen}
          onAboutOpenChange={setIsAboutDialogOpen}
        />
      }
    >
      <div className="relative size-full min-h-0 flex-1 overflow-hidden bg-[#e5e3df] font-os-ui">
        <iframe
          title={t("apps.maps.mapAriaLabel", { defaultValue: "Map" })}
          src={OSM_EMBED}
          className="absolute inset-0 size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* "Based here" caption card, bottom-left over the map. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex w-full justify-start p-2">
          <div className="pointer-events-auto max-w-[80%] rounded-lg bg-white/90 px-3 py-2 text-black shadow-md backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold leading-tight">
              <span aria-hidden>📍</span>
              <span>Based in {AMS.label}</span>
            </div>
            <div className="mt-0.5 text-[11px] leading-tight text-neutral-600">
              {AMS.subLabel}
            </div>
            <a
              href={OSM_FULL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-[11px] font-medium text-blue-700 hover:underline"
            >
              View larger map ↗
            </a>
          </div>
        </div>
      </div>
    </AppWindowShell>
  );
}
