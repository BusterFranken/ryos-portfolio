import { resolveAppId, appNames, type AppId } from "./appRegistryData";
import { makeProjectApp } from "@/apps/projects/registerProjectApps";
import {
  makeProjectMetadata,
  helpItems as projectHelpItems,
} from "@/apps/projects/metadata";
import { makeGalleryApp } from "@/apps/gallery/registerGalleryApps";
import {
  makeGalleryMetadata,
  helpItems as galleryHelpItems,
} from "@/apps/gallery/metadata";
import { makeSubstackApp } from "@/apps/substack/registerSubstackApp";
import {
  makeSubstackMetadata,
  helpItems as substackHelpItems,
} from "@/apps/substack/metadata";
import { makeDocViewerApp } from "@/apps/docviewer/registerDocViewerApps";
import {
  makeDocViewerMetadata,
  helpItems as docViewerHelpItems,
} from "@/apps/docviewer/metadata";
import type {
  BaseApp,
  ControlPanelsInitialData,
  FinderInitialData,
  InternetExplorerInitialData,
  IpodInitialData,
  PaintInitialData,
  VideosInitialData,
  BooksInitialData,
} from "@/apps/base/types";
import { createLazyComponent } from "./lazyAppComponent";

export type { AppId };

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowConstraints {
  minSize?: WindowSize;
  maxSize?: WindowSize;
  defaultSize: WindowSize;
  mobileDefaultSize?: WindowSize;
  /** If true, mobile height will be set to window.innerWidth (square) */
  mobileSquare?: boolean;
}

// Default window constraints for any app not specified
const defaultWindowConstraints: WindowConstraints = {
  defaultSize: { width: 730, height: 475 },
  minSize: { width: 300, height: 200 },
};

// ============================================================================
// LAZY-LOADED APP COMPONENTS
// ============================================================================

// Lazy-loaded apps (loaded on-demand when opened)
// Each uses a cache key to maintain stable references across HMR
const LazyFinderApp = createLazyComponent<FinderInitialData>(
  () => import("@/apps/finder/components/finder-app/FinderAppComponent").then(m => ({ default: m.FinderAppComponent })),
  "finder"
);

const LazyTextEditApp = createLazyComponent<unknown>(
  () => import("@/apps/textedit/components/TextEditAppComponent").then(m => ({ default: m.TextEditAppComponent })),
  "textedit"
);

const LazyInternetExplorerApp = createLazyComponent<InternetExplorerInitialData>(
  () => import("@/apps/internet-explorer/components/internet-explorer-app/InternetExplorerAppComponent").then(m => ({ default: m.InternetExplorerAppComponent })),
  "internet-explorer"
);

const LazyControlPanelsApp = createLazyComponent<ControlPanelsInitialData>(
  () => import("@/apps/control-panels/components/control-panels-app/ControlPanelsAppComponent").then(m => ({ default: m.ControlPanelsAppComponent })),
  "control-panels"
);

const LazyMinesweeperApp = createLazyComponent<unknown>(
  () => import("@/apps/minesweeper/components/MinesweeperAppComponent").then(m => ({ default: m.MinesweeperAppComponent })),
  "minesweeper"
);

const LazySoundboardApp = createLazyComponent<unknown>(
  () => import("@/apps/soundboard/components/SoundboardAppComponent").then(m => ({ default: m.SoundboardAppComponent })),
  "soundboard"
);

const LazyPaintApp = createLazyComponent<PaintInitialData>(
  () => import("@/apps/paint/components/PaintAppComponent").then(m => ({ default: m.PaintAppComponent })),
  "paint"
);

const LazyVideosApp = createLazyComponent<VideosInitialData>(
  () => import("@/apps/videos/components/videos-app/VideosAppComponent").then(m => ({ default: m.VideosAppComponent })),
  "videos"
);

const LazyPhotoBoothApp = createLazyComponent<unknown>(
  () => import("@/apps/photo-booth/components/PhotoBoothComponent").then(m => ({ default: m.PhotoBoothComponent })),
  "photo-booth"
);

const LazySynthApp = createLazyComponent<unknown>(
  () => import("@/apps/synth/components/synth-app/SynthAppComponent").then(m => ({ default: m.SynthAppComponent })),
  "synth"
);

const LazyIpodApp = createLazyComponent<IpodInitialData>(
  () => import("@/apps/ipod/components/ipod-app/IpodAppComponent").then(m => ({ default: m.IpodAppComponent })),
  "ipod"
);

const LazyTerminalApp = createLazyComponent<unknown>(
  () => import("@/apps/terminal/components/TerminalAppComponent").then(m => ({ default: m.TerminalAppComponent })),
  "terminal"
);


const LazyStickiesApp = createLazyComponent<unknown>(
  () => import("@/apps/stickies/components/StickiesAppComponent").then(m => ({ default: m.StickiesAppComponent })),
  "stickies"
);

const LazyInfiniteMacApp = createLazyComponent<unknown>(
  () => import("@/apps/infinite-mac/components/InfiniteMacAppComponent").then(m => ({ default: m.InfiniteMacAppComponent })),
  "infinite-mac"
);

const LazyInfinitePcApp = createLazyComponent<unknown>(
  () => import("@/apps/infinite-pc/components/InfinitePcAppComponent").then(m => ({ default: m.InfinitePcAppComponent })),
  "pc"
);

const LazyWinampApp = createLazyComponent<unknown>(
  () => import("@/apps/winamp/components/WinampAppComponent").then(m => ({ default: m.WinampAppComponent })),
  "winamp"
);

const LazyCalendarApp = createLazyComponent<unknown>(
  () => import("@/apps/calendar/components/calendar-app/CalendarAppComponent").then(m => ({ default: m.CalendarAppComponent })),
  "calendar"
);

const LazyContactsApp = createLazyComponent<unknown>(
  () => import("@/apps/contacts/components/contacts-app/ContactsAppComponent").then(m => ({ default: m.ContactsAppComponent })),
  "contacts"
);

const LazyDashboardApp = createLazyComponent<unknown>(
  () => import("@/apps/dashboard/components/DashboardAppComponent").then(m => ({ default: m.DashboardAppComponent })),
  "dashboard"
);

const LazyMapsApp = createLazyComponent<unknown>(
  () => import("@/apps/maps/components/maps-app/MapsAppComponent").then(m => ({ default: m.MapsAppComponent })),
  "maps"
);

const LazyBooksApp = createLazyComponent<BooksInitialData>(
  () => import("@/apps/books/components/books-app/BooksAppComponent").then(m => ({ default: m.BooksAppComponent })),
  "books"
);

// ============================================================================
// APP METADATA (loaded eagerly - small, isolated from components)
// Import from metadata.ts files to avoid eager loading of components
// ============================================================================

import { appMetadata as finderMetadata, helpItems as finderHelpItems } from "@/apps/finder/metadata";
import { appMetadata as soundboardMetadata, helpItems as soundboardHelpItems } from "@/apps/soundboard/metadata";
import { appMetadata as internetExplorerMetadata, helpItems as internetExplorerHelpItems } from "@/apps/internet-explorer/metadata";
import { appMetadata as texteditMetadata, helpItems as texteditHelpItems } from "@/apps/textedit/metadata";
import { appMetadata as paintMetadata, helpItems as paintHelpItems } from "@/apps/paint";
import { appMetadata as photoboothMetadata, helpItems as photoboothHelpItems } from "@/apps/photo-booth/metadata";
import { appMetadata as minesweeperMetadata, helpItems as minesweeperHelpItems } from "@/apps/minesweeper";
import { appMetadata as videosMetadata, helpItems as videosHelpItems } from "@/apps/videos/metadata";
import { appMetadata as ipodMetadata, helpItems as ipodHelpItems } from "@/apps/ipod/metadata";
import { appMetadata as synthMetadata, helpItems as synthHelpItems } from "@/apps/synth/metadata";
import { appMetadata as terminalMetadata, helpItems as terminalHelpItems } from "@/apps/terminal";
import { appMetadata as controlPanelsMetadata, helpItems as controlPanelsHelpItems } from "@/apps/control-panels";
import { appMetadata as stickiesMetadata, helpItems as stickiesHelpItems } from "@/apps/stickies";
import {
  appMetadata as infiniteMacMetadata,
  helpItems as infiniteMacHelpItems,
} from "@/apps/infinite-mac/metadata";
import {
  appMetadata as infinitePcMetadata,
  helpItems as infinitePcHelpItems,
} from "@/apps/infinite-pc/metadata";
import { appMetadata as winampMetadata, helpItems as winampHelpItems } from "@/apps/winamp";
import { appMetadata as calendarMetadata, helpItems as calendarHelpItems } from "@/apps/calendar/metadata";
import { appMetadata as contactsMetadata, helpItems as contactsHelpItems } from "@/apps/contacts";
import { appMetadata as dashboardMetadata, helpItems as dashboardHelpItems } from "@/apps/dashboard/metadata";
import { appMetadata as mapsMetadata, helpItems as mapsHelpItems } from "@/apps/maps";
import { appMetadata as booksMetadata, helpItems as booksHelpItems } from "@/apps/books/metadata";
import { DEFAULT_WINDOW_SIZE_WITH_TITLEBAR as infiniteMacDefaultSize } from "@/apps/infinite-mac/windowConfig";
import { DEFAULT_WINDOW_SIZE_WITH_TITLEBAR as infinitePcDefaultSize } from "@/apps/infinite-pc/windowConfig";

// ============================================================================
// APP REGISTRY
// ============================================================================

// Registry of all available apps with their window configurations
export const appRegistry = {
  ["finder"]: {
    id: "finder",
    name: "Finder",
    icon: { type: "image", src: "/icons/mac.png" },
    description: "Browse and manage files",
    component: LazyFinderApp,
    helpItems: finderHelpItems,
    metadata: finderMetadata,
    windowConfig: {
      defaultSize: { width: 680, height: 400 },
      minSize: { width: 300, height: 200 },
    } as WindowConstraints,
  },
  ["soundboard"]: {
    id: "soundboard",
    name: "Soundboard",
    icon: { type: "image", src: soundboardMetadata.icon },
    description: "Play sound effects",
    component: LazySoundboardApp,
    helpItems: soundboardHelpItems,
    metadata: soundboardMetadata,
    windowConfig: {
      defaultSize: { width: 650, height: 475 },
      minSize: { width: 550, height: 375 },
    } as WindowConstraints,
  },
  ["internet-explorer"]: {
    id: "internet-explorer",
    name: "Internet Explorer",
    icon: { type: "image", src: internetExplorerMetadata.icon },
    description: "Browse the web",
    component: LazyInternetExplorerApp,
    helpItems: internetExplorerHelpItems,
    metadata: internetExplorerMetadata,
    windowConfig: {
      defaultSize: { width: 730, height: 600 },
      minSize: { width: 400, height: 300 },
    } as WindowConstraints,
  } as BaseApp<InternetExplorerInitialData> & { windowConfig: WindowConstraints },
  ["textedit"]: {
    id: "textedit",
    name: "TextEdit",
    icon: { type: "image", src: texteditMetadata.icon },
    description: "A simple rich text editor",
    component: LazyTextEditApp,
    helpItems: texteditHelpItems,
    metadata: texteditMetadata,
    windowConfig: {
      defaultSize: { width: 430, height: 475 },
      minSize: { width: 430, height: 200 },
    } as WindowConstraints,
  },
  ["paint"]: {
    id: "paint",
    name: "Paint",
    icon: { type: "image", src: paintMetadata.icon },
    description: "Draw and edit images",
    component: LazyPaintApp,
    helpItems: paintHelpItems,
    metadata: paintMetadata,
    windowConfig: {
      defaultSize: { width: 713, height: 480 },
      minSize: { width: 400, height: 400 },
      maxSize: { width: 713, height: 535 },
    } as WindowConstraints,
  } as BaseApp<PaintInitialData> & { windowConfig: WindowConstraints },
  ["photo-booth"]: {
    id: "photo-booth",
    name: "Photo Booth",
    icon: { type: "image", src: photoboothMetadata.icon },
    description: "Take photos with effects",
    component: LazyPhotoBoothApp,
    helpItems: photoboothHelpItems,
    metadata: photoboothMetadata,
    windowConfig: {
      defaultSize: { width: 644, height: 510 },
      minSize: { width: 644, height: 510 },
      maxSize: { width: 644, height: 510 },
    } as WindowConstraints,
  },
  ["minesweeper"]: {
    id: "minesweeper",
    name: "Minesweeper",
    icon: { type: "image", src: minesweeperMetadata!.icon },
    description: "Classic puzzle game",
    component: LazyMinesweeperApp,
    helpItems: minesweeperHelpItems,
    metadata: minesweeperMetadata,
    windowConfig: {
      defaultSize: { width: 305, height: 400 },
      minSize: { width: 305, height: 400 },
      maxSize: { width: 305, height: 400 },
    } as WindowConstraints,
  },
  ["videos"]: {
    id: "videos",
    name: "Videos",
    icon: { type: "image", src: videosMetadata.icon },
    description: "Watch videos",
    component: LazyVideosApp,
    helpItems: videosHelpItems,
    metadata: videosMetadata,
    windowConfig: {
      defaultSize: { width: 400, height: 420 },
      minSize: { width: 400, height: 340 },
    } as WindowConstraints,
  } as BaseApp<VideosInitialData> & { windowConfig: WindowConstraints },
  ["ipod"]: {
    id: "ipod",
    name: "iPod",
    icon: { type: "image", src: ipodMetadata.icon },
    description: "Music player",
    component: LazyIpodApp,
    helpItems: ipodHelpItems,
    metadata: ipodMetadata,
    windowConfig: {
      defaultSize: { width: 300, height: 480 },
      minSize: { width: 300, height: 480 },
    } as WindowConstraints,
  } as BaseApp<IpodInitialData> & { windowConfig: WindowConstraints },
  ["synth"]: {
    id: "synth",
    name: "Synth",
    icon: { type: "image", src: synthMetadata.icon },
    description: "Virtual synthesizer",
    component: LazySynthApp,
    helpItems: synthHelpItems,
    metadata: synthMetadata,
    windowConfig: {
      defaultSize: { width: 720, height: 400 },
      minSize: { width: 720, height: 290 },
    } as WindowConstraints,
  },
  ["terminal"]: {
    id: "terminal",
    name: "Terminal",
    icon: { type: "image", src: terminalMetadata!.icon },
    description: "Command line interface",
    component: LazyTerminalApp,
    helpItems: terminalHelpItems,
    metadata: terminalMetadata,
    windowConfig: {
      defaultSize: { width: 600, height: 400 },
      minSize: { width: 400, height: 300 },
    } as WindowConstraints,
  },
  ["control-panels"]: {
    id: "control-panels",
    name: "Control Panels",
    icon: { type: "image", src: controlPanelsMetadata.icon },
    description: "System settings",
    component: LazyControlPanelsApp,
    helpItems: controlPanelsHelpItems,
    metadata: controlPanelsMetadata,
    windowConfig: {
      defaultSize: { width: 400, height: 415 },
      minSize: { width: 400, height: 415 },
      maxSize: { width: 560, height: 600 },
    } as WindowConstraints,
  } as BaseApp<ControlPanelsInitialData> & { windowConfig: WindowConstraints },
  ["stickies"]: {
    id: "stickies",
    name: "Stickies",
    icon: { type: "image", src: stickiesMetadata.icon },
    description: "Sticky notes for quick reminders",
    component: LazyStickiesApp,
    helpItems: stickiesHelpItems,
    metadata: stickiesMetadata,
    windowConfig: {
      defaultSize: { width: 500, height: 400 },
      minSize: { width: 300, height: 250 },
    } as WindowConstraints,
  },
  ["infinite-mac"]: {
    id: "infinite-mac",
    name: "Infinite Mac",
    icon: { type: "image", src: infiniteMacMetadata.icon },
    description: "Classic Mac OS emulators",
    component: LazyInfiniteMacApp,
    helpItems: infiniteMacHelpItems,
    metadata: infiniteMacMetadata,
    windowConfig: {
      defaultSize: infiniteMacDefaultSize,
      minSize: { width: 512, height: 342 },
      maxSize: { width: 1024, height: 792 }, // 768 + 24 for macOS X titlebar spacer
    } as WindowConstraints,
  },
  ["pc"]: {
    id: "pc",
    name: "Virtual PC",
    icon: { type: "image", src: infinitePcMetadata.icon },
    description: "x86 OS emulation and DOS games",
    component: LazyInfinitePcApp,
    helpItems: infinitePcHelpItems,
    metadata: infinitePcMetadata,
    windowConfig: {
      defaultSize: infinitePcDefaultSize,
      minSize: { width: 640, height: 400 },
      maxSize: { width: 1280, height: 1024 },
    } as WindowConstraints,
  },
  ["winamp"]: {
    id: "winamp",
    name: "Winamp",
    icon: { type: "image", src: winampMetadata.icon },
    description: "Classic Winamp media player",
    component: LazyWinampApp,
    helpItems: winampHelpItems,
    metadata: winampMetadata,
    windowConfig: {
      defaultSize: { width: 275, height: 116 },
      minSize: { width: 275, height: 116 },
    } as WindowConstraints,
  },
  ["calendar"]: {
    id: "calendar",
    name: "Calendar",
    icon: { type: "image", src: calendarMetadata.icon },
    description: "Calendar with events",
    component: LazyCalendarApp,
    helpItems: calendarHelpItems,
    metadata: calendarMetadata,
    windowConfig: {
      defaultSize: { width: 700, height: 520 },
      minSize: { width: 300, height: 380 },
    } as WindowConstraints,
  },
  ["contacts"]: {
    id: "contacts",
    name: "Contacts",
    icon: { type: "image", src: contactsMetadata.icon },
    description: "Address book with vCard import",
    component: LazyContactsApp,
    helpItems: contactsHelpItems,
    metadata: contactsMetadata,
    windowConfig: {
      defaultSize: { width: 820, height: 560 },
      minSize: { width: 360, height: 420 },
    } as WindowConstraints,
  },
  ["dashboard"]: {
    id: "dashboard",
    name: "Dashboard",
    icon: { type: "image", src: dashboardMetadata.icon },
    description: "Widget dashboard overlay",
    component: LazyDashboardApp,
    helpItems: dashboardHelpItems,
    metadata: dashboardMetadata,
    windowConfig: {
      defaultSize: { width: 500, height: 400 },
      minSize: { width: 300, height: 250 },
    } as WindowConstraints,
  },
  ["maps"]: {
    id: "maps",
    name: "Maps",
    icon: { type: "image", src: mapsMetadata.icon },
    description: "Find places with Apple Maps",
    component: LazyMapsApp,
    helpItems: mapsHelpItems,
    metadata: mapsMetadata,
    windowConfig: {
      defaultSize: { width: 560, height: 560 },
      minSize: { width: 400, height: 300 },
    } as WindowConstraints,
  },
  ["books"]: {
    id: "books",
    name: "Books",
    icon: { type: "image", src: booksMetadata.icon },
    description: "Read EPUB books",
    component: LazyBooksApp,
    helpItems: booksHelpItems,
    metadata: booksMetadata,
    windowConfig: {
      defaultSize: { width: 720, height: 560 },
      minSize: { width: 420, height: 360 },
    } as WindowConstraints,
  } as BaseApp<BooksInitialData> & { windowConfig: WindowConstraints },
  ["buster-barn"]: {
    id: "buster-barn",
    name: appNames["buster-barn"],
    icon: { type: "image", src: "/icons/default/buster-barn.png" },
    description: "Full-screen pixel-art barn game",
    component: makeProjectApp("buster-barn"),
    helpItems: projectHelpItems,
    metadata: makeProjectMetadata("buster-barn", appNames["buster-barn"]),
    windowConfig: {
      defaultSize: { width: 800, height: 600 },
      minSize: { width: 320, height: 240 },
    } as WindowConstraints,
  },
  ["casefile"]: {
    id: "casefile",
    name: appNames["casefile"],
    icon: { type: "image", src: "/icons/default/casefile.png" },
    description: "Courtroom drama investigation",
    component: makeProjectApp("casefile"),
    helpItems: projectHelpItems,
    metadata: makeProjectMetadata("casefile", appNames["casefile"]),
    windowConfig: {
      defaultSize: { width: 800, height: 600 },
      minSize: { width: 320, height: 240 },
    } as WindowConstraints,
  },
  ["hush"]: {
    id: "hush",
    name: appNames["hush"],
    icon: { type: "image", src: "/icons/default/hush.png" },
    description: "A quiet little web toy",
    component: makeProjectApp("hush"),
    helpItems: projectHelpItems,
    metadata: makeProjectMetadata("hush", appNames["hush"]),
    windowConfig: {
      defaultSize: { width: 800, height: 600 },
      minSize: { width: 320, height: 240 },
    } as WindowConstraints,
  },
  ["kafka-form"]: {
    id: "kafka-form",
    name: appNames["kafka-form"],
    icon: { type: "image", src: "/icons/default/kafka-form.png" },
    description: "A Kafkaesque web form",
    component: makeProjectApp("kafka-form"),
    helpItems: projectHelpItems,
    metadata: makeProjectMetadata("kafka-form", appNames["kafka-form"]),
    windowConfig: {
      defaultSize: { width: 800, height: 600 },
      minSize: { width: 320, height: 240 },
    } as WindowConstraints,
  },
  ["eigenvector"]: {
    id: "eigenvector",
    name: appNames["eigenvector"],
    icon: { type: "image", src: "/icons/default/eigenvector.png" },
    description: "eigenvector.pro — live site",
    component: makeProjectApp("eigenvector"),
    helpItems: projectHelpItems,
    metadata: makeProjectMetadata("eigenvector", appNames["eigenvector"]),
    windowConfig: {
      defaultSize: { width: 800, height: 600 },
      minSize: { width: 320, height: 240 },
    } as WindowConstraints,
  },
  ["mpoftheweek"]: {
    id: "mpoftheweek",
    name: appNames["mpoftheweek"],
    icon: { type: "image", src: "/icons/default/mpoftheweek.png" },
    description: "MP of the Week — live site",
    component: makeProjectApp("mpoftheweek"),
    helpItems: projectHelpItems,
    metadata: makeProjectMetadata("mpoftheweek", appNames["mpoftheweek"]),
    windowConfig: {
      defaultSize: { width: 800, height: 600 },
      minSize: { width: 320, height: 240 },
    } as WindowConstraints,
  },
  ["dnd-cv"]: {
    id: "dnd-cv",
    name: appNames["dnd-cv"],
    icon: { type: "image", src: "/icons/default/dnd-cv.png" },
    description: "D&D-style portfolio CV",
    component: makeProjectApp("dnd-cv"),
    helpItems: projectHelpItems,
    metadata: makeProjectMetadata("dnd-cv", appNames["dnd-cv"]),
    windowConfig: {
      defaultSize: { width: 800, height: 600 },
      minSize: { width: 320, height: 240 },
    } as WindowConstraints,
  },
  ["tarot"]: {
    id: "tarot",
    name: appNames["tarot"],
    icon: { type: "image", src: "/icons/default/tarot.png" },
    description: "A bit-art fortune teller",
    component: makeProjectApp("tarot"),
    helpItems: projectHelpItems,
    metadata: makeProjectMetadata("tarot", appNames["tarot"]),
    windowConfig: {
      defaultSize: { width: 800, height: 600 },
      minSize: { width: 320, height: 240 },
    } as WindowConstraints,
  },
  ["pawnshop"]: {
    id: "pawnshop",
    name: appNames["pawnshop"],
    icon: { type: "image", src: "/icons/default/pawnshop.png" },
    description: "AI jewelry-appraisal marketplace",
    component: makeProjectApp("pawnshop"),
    helpItems: projectHelpItems,
    metadata: makeProjectMetadata("pawnshop", appNames["pawnshop"]),
    windowConfig: {
      defaultSize: { width: 800, height: 600 },
      minSize: { width: 320, height: 240 },
    } as WindowConstraints,
  },
  ["gallery"]: {
    id: "gallery",
    name: appNames["gallery"],
    icon: { type: "image", src: "/icons/default/gallery.png" },
    description: "Browse project screenshots & photos",
    component: makeGalleryApp(),
    helpItems: galleryHelpItems,
    metadata: makeGalleryMetadata("gallery", appNames["gallery"]),
    windowConfig: {
      defaultSize: { width: 820, height: 560 },
      minSize: { width: 460, height: 360 },
    } as WindowConstraints,
  },
  ["cv-pdf"]: {
    id: "cv-pdf",
    name: appNames["cv-pdf"],
    icon: { type: "image", src: "/icons/default/cv-pdf.png" },
    description: "Résumé (PDF)",
    component: makeDocViewerApp("cv-pdf"),
    helpItems: docViewerHelpItems,
    metadata: makeDocViewerMetadata("cv-pdf", appNames["cv-pdf"]),
    windowConfig: {
      defaultSize: { width: 640, height: 800 },
      minSize: { width: 360, height: 420 },
    } as WindowConstraints,
  },
  ["substack"]: {
    id: "substack",
    name: appNames["substack"],
    icon: { type: "image", src: "/icons/default/substack.png" },
    description: "Read my Substack",
    component: makeSubstackApp(),
    helpItems: substackHelpItems,
    metadata: makeSubstackMetadata("substack", appNames["substack"]),
    windowConfig: {
      defaultSize: { width: 760, height: 560 },
      minSize: { width: 420, height: 360 },
    } as WindowConstraints,
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Helper function to get app icon path
export const getAppIconPath = (appId: AppId): string => {
  const app = appRegistry[resolveRegistryAppId(appId)];
  if (!app) return "/icons/default/app.png";
  if (typeof app.icon === "string") {
    return app.icon;
  }
  return app.icon.src;
};

// Helper function to get all apps except Finder
// Pass isAdmin=true to include admin-only apps
export const getNonFinderApps = (isAdmin: boolean = false): Array<{
  name: string;
  icon: string;
  id: AppId;
}> => {
  return Object.entries(appRegistry).reduce<
    {
      name: string;
      icon: string;
      id: AppId;
    }[]
  >((acc, [id, app]) => {
      if (id === "finder") return acc;
      // Filter out admin-only apps for non-admin users
      if ((app as { adminOnly?: boolean }).adminOnly && !isAdmin) return acc;
      acc.push({
        name: app.name,
        icon: getAppIconPath(id as AppId),
        id: id as AppId,
      });
      return acc;
    }, []);
};

function resolveRegistryAppId(appId: AppId): AppId {
  return resolveAppId(appId) ?? appId;
}

// Helper function to get app metadata
export const getAppMetadata = (appId: AppId) => {
  return appRegistry[resolveRegistryAppId(appId)]?.metadata;
};

// Helper function to get app component (undefined if the id is no longer
// registered — e.g. a persisted window for an app that has since been removed).
export const getAppComponent = (appId: AppId) => {
  return appRegistry[resolveRegistryAppId(appId)]?.component;
};

// Helper function to check whether an app id maps to a registered app.
export const isRegisteredApp = (appId: AppId): boolean => {
  return !!appRegistry[resolveRegistryAppId(appId)];
};

// Helper function to get window configuration
export const getWindowConfig = (appId: AppId): WindowConstraints => {
  const resolved = resolveRegistryAppId(appId);
  return appRegistry[resolved]?.windowConfig || defaultWindowConstraints;
};

// Helper function to get mobile window size
export const getMobileWindowSize = (appId: AppId): WindowSize => {
  const config = getWindowConfig(appId);
  if (config.mobileDefaultSize) {
    return config.mobileDefaultSize;
  }
  // Square aspect ratio: height = width
  if (config.mobileSquare) {
    return {
      width: window.innerWidth,
      height: window.innerWidth,
    };
  }
  return {
    width: window.innerWidth,
    height: config.defaultSize.height,
  };
};
