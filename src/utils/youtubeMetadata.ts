import { abortableFetch } from "@/utils/abortableFetch";

const FETCH_OPTS = {
  timeout: 15000,
  throwOnHttpError: false as const,
  retry: { maxAttempts: 1, initialDelayMs: 250 },
};

export interface YouTubeOembedResult {
  ok: boolean;
  status: number;
  /** oEmbed video title (present when `ok`). */
  rawTitle?: string;
  /** oEmbed channel/author name (present when `ok`). */
  authorName?: string;
}

/**
 * Fetch YouTube oEmbed title/author for a video id. Does not throw on HTTP
 * errors (returns `{ ok: false, status }`); network errors propagate.
 */
export async function fetchYouTubeOembed(
  videoId: string
): Promise<YouTubeOembedResult> {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`
  )}&format=json`;
  const res = await abortableFetch(oembedUrl, {
    ...FETCH_OPTS,
    credentials: "omit",
  });
  if (!res.ok) return { ok: false, status: res.status };
  const data = (await res.json()) as { title?: string; author_name?: string };
  return {
    ok: true,
    status: res.status,
    rawTitle: data.title,
    authorName: data.author_name,
  };
}

export interface ParsedYouTubeTitle {
  title: string;
  artist?: string;
  album?: string;
}

/**
 * Resolve a cleaned title/artist. The original implementation called the
 * `/api/parse-title` backend (LLM title cleanup); that backend was removed for
 * the static portfolio build, so we use the raw oEmbed title directly. Kept
 * `async` and the same signature so callers compile unchanged.
 */
export async function parseYouTubeTitle(
  rawTitle: string,
  _authorName?: string
): Promise<ParsedYouTubeTitle> {
  return { title: rawTitle };
}
