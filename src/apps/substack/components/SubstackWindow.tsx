import { useEffect, useState } from "react";
import type { AppProps } from "@/apps/base/types";
import type { AppId } from "@/config/appRegistryData";
import { appNames } from "@/config/appRegistryData";
import { AppWindowShell } from "@/components/shared/AppWindowShell";
import { AppHelpAboutDialogs } from "@/components/shared/AppHelpAboutDialogs";
import { AppMenuBarShell } from "@/components/shared/menubar/AppMenuBarShell";
import { AppMenuBarMenus } from "@/components/shared/menubar/AppMenuBarMenus";
import { useAppMenuBarChrome } from "@/hooks/useAppMenuBarChrome";
import { useThemeFlags } from "@/hooks/useThemeFlags";
import { osToolbarSurfaceClassName } from "@/components/shared/osThemePrimitives";
import { cn } from "@/lib/utils";
import { makeSubstackMetadata } from "../metadata";
import { loadSubstackPosts, type SubstackPost } from "../substackConfig";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SubstackMenuBarProps {
  appId: AppId;
  onClose: () => void;
  onShowHelp: () => void;
  onShowAbout: () => void;
}

function SubstackMenuBar({
  appId,
  onClose,
  onShowHelp,
  onShowAbout,
}: SubstackMenuBarProps) {
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

function stripHtml(html: string): string {
  return html.replace(/(<([^>]+)>)/gi, "");
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export type SubstackWindowProps = { appId: AppId } & AppProps;

export function SubstackWindow({
  appId,
  isWindowOpen,
  onClose,
  isForeground,
  skipInitialSound,
  instanceId,
  onNavigateNext,
  onNavigatePrevious,
}: SubstackWindowProps) {
  const { isWindowsTheme, isMacOSTheme, isSystem7Theme } = useThemeFlags();
  const name = appNames[appId] ?? "Substack";
  const metadata = makeSubstackMetadata(appId, name);

  const [posts, setPosts] = useState<SubstackPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activePostGuid, setActivePostGuid] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSubstackPosts().then((loaded) => {
      if (!cancelled) {
        setPosts(loaded);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const viewMode = activePostGuid ? "reader" : "list";
  const activePost = posts.find((p) => p.guid === activePostGuid) ?? null;

  const menuBar = (
    <SubstackMenuBar
      appId={appId}
      onClose={onClose}
      onShowHelp={() => setIsHelpOpen(true)}
      onShowAbout={() => setIsAboutOpen(true)}
    />
  );

  let content: React.ReactNode;

  if (isLoading) {
    content = (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="font-geneva-12 text-[12px] text-os-text-secondary">
          Loading…
        </p>
      </div>
    );
  } else if (viewMode === "reader" && activePost) {
    content = (
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar row */}
        <div
          className={cn(
            "flex shrink-0 items-center gap-2 px-3 py-1.5",
            osToolbarSurfaceClassName(
              { isWindowsTheme, isMacOSTheme, isSystem7Theme },
              { border: "bottom" }
            )
          )}
        >
          <button
            type="button"
            onClick={() => setActivePostGuid(null)}
            className="font-geneva-12 text-[11px] text-os-text-secondary hover:text-os-text-primary"
          >
            ← Posts
          </button>
        </div>
        {/* Reader body */}
        <div className="flex-1 overflow-y-auto p-5">
          <h1 className="mb-1 font-geneva-12 text-[15px] font-bold text-os-text-primary">
            {activePost.title}
          </h1>
          <p className="mb-2 font-geneva-12 text-[11px] text-os-text-secondary">
            {formatDate(activePost.pubDate)}
          </p>
          <a
            href={activePost.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-block font-geneva-12 text-[11px] text-blue-600 hover:underline"
          >
            Open on Substack ↗
          </a>
          {activePost.content ? (
            <div
              className="prose prose-sm mt-3 max-w-none font-geneva-12 text-[12px] text-os-text-primary"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(activePost.content),
              }}
            />
          ) : (
            <div className="prose prose-sm mt-3 max-w-none font-geneva-12 text-[12px] text-os-text-primary">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activePost.description}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    );
  } else if (posts.length === 0) {
    content = (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-geneva-12 text-[13px] text-os-text-primary">
          📬 No posts yet — once the Substack feed is connected they'll show up
          here.
        </p>
        <a
          href="https://substack.com/@busterfranken"
          target="_blank"
          rel="noopener noreferrer"
          className="font-geneva-12 text-[11px] text-blue-600 hover:underline"
        >
          Open Substack ↗
        </a>
      </div>
    );
  } else {
    // List view
    content = (
      <div className="flex-1 overflow-y-auto">
        {posts.map((post) => {
          const excerpt =
            stripHtml(post.description).slice(0, 140) +
            (stripHtml(post.description).length > 140 ? "…" : "");
          return (
            <button
              key={post.guid}
              type="button"
              onClick={() => setActivePostGuid(post.guid)}
              className="flex w-full flex-col gap-0.5 border-b border-os-separator px-4 py-3 text-left hover:bg-black/[0.04]"
            >
              <span className="font-geneva-12 text-[12px] font-bold text-os-text-primary">
                {post.title}
              </span>
              <span className="font-geneva-12 text-[10px] text-os-text-secondary">
                {formatDate(post.pubDate)}
              </span>
              {excerpt && (
                <span className="mt-0.5 font-geneva-12 text-[11px] text-os-text-secondary">
                  {excerpt}
                </span>
              )}
            </button>
          );
        })}
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
      <div className="flex size-full flex-col bg-os-window-bg text-os-text-primary">
        {content}
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
