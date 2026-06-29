/**
 * Client-side utilities for lyrics translation / furigana / soramimi.
 *
 * The original implementation streamed line-by-line results over SSE from the
 * `/api/songs/:id` backend. That backend was removed for the static portfolio
 * build, so the streaming functions below no longer fire any `/api` request:
 * they honor pre-fetched cached data when present and otherwise resolve to an
 * empty result. The public interfaces are preserved so consumers (useLyrics,
 * useFurigana) compile and behave as "no extra data available".
 */

// =============================================================================
// Types
// =============================================================================

export interface LineProgress {
  completedLines: number;
  totalLines: number;
  percentage: number;
}

/** Pre-fetched translation info from initial lyrics fetch */
export interface TranslationStreamInfo {
  totalLines: number;
  cached: boolean;
  /** Cached translation LRC (only present if cached=true) */
  lrc?: string;
}

/** Pre-fetched furigana info from initial lyrics fetch */
export interface FuriganaStreamInfo {
  totalLines: number;
  cached: boolean;
  /** Cached furigana data (only present if cached=true) */
  data?: Array<Array<{ text: string; reading?: string }>>;
}

/** Pre-fetched soramimi info from initial lyrics fetch */
export interface SoramimiStreamInfo {
  totalLines: number;
  cached: boolean;
  /** Cached soramimi data (only present if cached=true) */
  data?: Array<Array<{ text: string; reading?: string }>>;
  /** Target language this cached data was generated for */
  targetLanguage?: "zh-TW" | "en";
  /** Whether soramimi was skipped (e.g., for Chinese lyrics) */
  skipped?: boolean;
  /** Reason for skipping */
  skipReason?: string;
}

// =============================================================================
// Translation
// =============================================================================

export interface ProcessTranslationOptions {
  force?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: LineProgress) => void;
  onLine?: (lineIndex: number, translation: string) => void;
  /** Pre-fetched info from initial lyrics request */
  prefetchedInfo?: TranslationStreamInfo;
  /** Auth credentials (required for force refresh) */
  auth?: { username: string; isAuthenticated: boolean };
}

/** Result of translation processing */
export interface TranslationResult {
  /** The translations array */
  data: string[];
  /** Whether the result was successful */
  success: boolean;
}

/**
 * STUB: the live translation backend was removed for the static build. Uses
 * pre-fetched cached LRC when available; otherwise resolves to an empty
 * translation. Never fires an `/api` request.
 */
export async function processTranslationSSE(
  _songId: string,
  _language: string,
  options: ProcessTranslationOptions = {}
): Promise<TranslationResult> {
  const { force, prefetchedInfo, onProgress } = options;

  if (!force && prefetchedInfo?.cached && prefetchedInfo.lrc) {
    try {
      onProgress?.({
        completedLines: prefetchedInfo.totalLines,
        totalLines: prefetchedInfo.totalLines,
        percentage: 100,
      });
    } catch {
      // ignore callback errors
    }
    return { data: parseLrcToTranslations(prefetchedInfo.lrc), success: true };
  }

  return { data: [], success: false };
}

// =============================================================================
// Furigana
// =============================================================================

export interface ProcessFuriganaOptions {
  force?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: LineProgress) => void;
  onLine?: (lineIndex: number, furigana: Array<{ text: string; reading?: string }>) => void;
  /** Pre-fetched info from initial lyrics request */
  prefetchedInfo?: FuriganaStreamInfo;
  /** Auth credentials (required for force refresh) */
  auth?: { username: string; isAuthenticated: boolean };
}

/** Result of furigana processing */
export interface FuriganaResult {
  /** The furigana data */
  data: Array<Array<{ text: string; reading?: string }>>;
  /** Whether the result was successful */
  success: boolean;
}

/**
 * STUB: the live furigana backend was removed for the static build. Uses
 * pre-fetched cached data when available; otherwise resolves to empty. Never
 * fires an `/api` request.
 */
export async function processFuriganaSSE(
  _songId: string,
  options: ProcessFuriganaOptions = {}
): Promise<FuriganaResult> {
  const { force, prefetchedInfo, onProgress } = options;

  if (!force && prefetchedInfo?.cached && prefetchedInfo.data) {
    try {
      onProgress?.({
        completedLines: prefetchedInfo.totalLines,
        totalLines: prefetchedInfo.totalLines,
        percentage: 100,
      });
    } catch {
      // ignore callback errors
    }
    return { data: prefetchedInfo.data, success: true };
  }

  return { data: [], success: false };
}

// =============================================================================
// Soramimi
// =============================================================================

export interface ProcessSoramimiOptions {
  force?: boolean;
  signal?: AbortSignal;
  onProgress?: (progress: LineProgress) => void;
  onLine?: (lineIndex: number, soramimi: Array<{ text: string; reading?: string }>) => void;
  /** Pre-fetched info from initial lyrics request */
  prefetchedInfo?: SoramimiStreamInfo;
  /**
   * Optional furigana data for Japanese songs.
   * Format: 2D array of segments [{text, reading?}] indexed by line
   */
  furigana?: Array<Array<{ text: string; reading?: string }>>;
  /**
   * Target language for soramimi output:
   * - "zh-TW": Chinese characters (空耳 - traditional style)
   * - "en": English phonetic approximations (misheard lyrics)
   */
  targetLanguage?: "zh-TW" | "en";
  /** Auth credentials (required for force refresh) */
  auth?: { username: string; isAuthenticated: boolean };
}

/** Result of soramimi processing */
export interface SoramimiResult {
  /** The soramimi data */
  data: Array<Array<{ text: string; reading?: string }>>;
  /** Whether the result was successful */
  success: boolean;
}

/**
 * STUB: the live soramimi backend was removed for the static build. Uses
 * pre-fetched cached data when available; otherwise resolves to empty. Never
 * fires an `/api` request.
 */
export async function processSoramimiSSE(
  _songId: string,
  options: ProcessSoramimiOptions = {}
): Promise<SoramimiResult> {
  const { force, prefetchedInfo, onProgress } = options;

  if (!force && prefetchedInfo?.cached && prefetchedInfo.data) {
    try {
      onProgress?.({
        completedLines: prefetchedInfo.totalLines,
        totalLines: prefetchedInfo.totalLines,
        percentage: 100,
      });
    } catch {
      // ignore callback errors
    }
    return { data: prefetchedInfo.data, success: true };
  }

  if (prefetchedInfo?.skipped) {
    try {
      onProgress?.({ completedLines: 0, totalLines: 0, percentage: 100 });
    } catch {
      // ignore callback errors
    }
    return { data: [], success: true };
  }

  return { data: [], success: false };
}

// =============================================================================
// Utilities
// =============================================================================

/** Parse LRC format back to array of translation strings */
export function parseLrcToTranslations(lrc: string): string[] {
  const lines: string[] = [];
  const lineRegex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/;

  for (const line of lrc.split("\n")) {
    const match = line.trim().match(lineRegex);
    if (match) {
      lines.push(match[4].trim());
    }
  }

  return lines;
}

/**
 * Check if a line is likely incomplete (has no readings when it should).
 * Used to detect lines that need resume.
 */
export function isIncompletesoramimiLine(
  segments: Array<{ text: string; reading?: string }>,
  originalText: string
): boolean {
  // Empty segments array means the line definitely needs regeneration
  if (!segments || segments.length === 0) {
    return true;
  }

  // If it's just a single segment with the original text and no reading,
  // and the original text contains non-English characters that should have readings
  if (segments.length === 1 && !segments[0].reading) {
    const text = segments[0].text;
    // Check if text matches original (fallback case)
    if (text === originalText) {
      // Check if the text contains Japanese/Korean characters that should have soramimi
      // Japanese: Hiragana, Katakana, Kanji; Korean: Hangul
      const hasNonEnglish =
        /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uAC00-\uD7AF]/.test(
          text
        );
      return hasNonEnglish;
    }
  }

  return false;
}
