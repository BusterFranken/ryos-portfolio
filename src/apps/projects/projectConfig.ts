import type { AppId } from "@/config/appRegistryData";

export type ProjectMode = "live" | "preview" | "fullscreen";

export interface ProjectConfig {
  mode: ProjectMode;
  /** Deployed URL (live/fullscreen) or redirect target (preview). */
  url: string;
  /** Preview-mode hero image (public path). Deferred content ok. */
  previewImage?: string;
  previewBlurb?: string;
  /** Project-specific CTA button label (defaults to "Open"). */
  ctaLabel?: string;
  /** Emoji hero shown until a real previewImage is supplied (deferred). */
  placeholderEmoji?: string;
  /** Optional "work with me" mailto/booking link. */
  ctaHref?: string;
}

export const projectConfig: Partial<Record<AppId, ProjectConfig>> = {
  "buster-barn": {
    mode: "fullscreen",
    url: "https://busterfranken.github.io/Buster-Barn/",
  },
  casefile: { mode: "live", url: "https://court-room-drama.onrender.com" },
  hush: { mode: "live", url: "https://busterfranken.github.io/hush/" },
  "kafka-form": {
    mode: "live",
    url: "https://busterfranken.github.io/kafka-form/",
  },
  eigenvector: { mode: "live", url: "https://eigenvector.pro/" },
  mpoftheweek: { mode: "live", url: "https://mpoftheweek.com" },
  "dnd-cv": {
    mode: "live",
    url: "https://busterfranken.github.io/DnD-style-portfolio-cv/",
  },
  tarot: { mode: "live", url: "https://tarotread.help/" },
  pawnshop: { mode: "live", url: "https://pawnshop-qw60.onrender.com/" },
  jdog: { mode: "live", url: "https://jdog.lol/" },
};

export function resolveProjectConfig(
  appId: AppId
): ProjectConfig | undefined {
  return projectConfig[appId];
}
