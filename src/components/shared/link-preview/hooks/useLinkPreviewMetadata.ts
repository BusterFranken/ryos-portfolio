import { useEffect, useReducer, type Dispatch } from "react";
import {
  createInitialLinkPreviewState,
  linkPreviewReducer,
} from "../linkPreviewReducer";
import type { LinkPreviewAction, LinkPreviewState } from "../types";
import { extractYouTubeVideoId, isYouTubeUrl } from "../utils";

export function useLinkPreviewMetadata(url: string): [
  LinkPreviewState,
  Dispatch<LinkPreviewAction>,
] {
  const [state, dispatch] = useReducer(
    linkPreviewReducer,
    url,
    (u: string) => createInitialLinkPreviewState(u, isYouTubeUrl)
  );

  useEffect(() => {
    dispatch({
      type: "resetForUrl",
      isFullWidthThumbnail: isYouTubeUrl(url),
    });
    const abortController = new AbortController();
    let isActive = true;

    const fetchMetadata = async () => {
      // STATIC BUILD: the `/api/link-preview` backend (server-side OG scraping)
      // was removed. For ryOS song deep links we can still derive a YouTube
      // thumbnail locally; everything else falls back to showing the raw URL.
      try {
        if (!isActive || abortController.signal.aborted) return;
        dispatch({ type: "fetchStart" });

        if (url.includes("/ipod/") || url.includes("/karaoke/")) {
          const videoId = extractYouTubeVideoId(url);
          if (videoId) {
            dispatch({
              type: "fetchSuccess",
              metadata: {
                title: `YouTube Video ${videoId}`,
                description: "Watch on YouTube",
                image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                siteName: "YouTube",
                url: url,
              },
            });
            return;
          }
        }

        dispatch({
          type: "fetchFailure",
          error: "Preview unavailable",
          metadata: {
            title: url,
            url: url,
          },
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        if (!isActive || abortController.signal.aborted) return;
        console.error("Error fetching link metadata:", err);
        dispatch({
          type: "fetchFailure",
          error: "Failed to load preview",
          metadata: {
            title: url,
            url: url,
          },
        });
      }
    };

    void fetchMetadata();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [url]);

  return [state, dispatch];
}
