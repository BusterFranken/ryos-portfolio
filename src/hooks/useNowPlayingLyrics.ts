import { useMemo } from "react";
import {
  useIpodStore,
  getActiveIpodCurrentTrack,
  getEffectiveTranslationLanguage,
  type Track,
} from "@/stores/useIpodStore";
import {
  DisplayMode,
  getLyricsFontClassName,
  LyricsFont as LyricsFontEnum,
} from "@/types/lyrics";
import { useLyrics } from "@/hooks/useLyrics";
import { useFurigana } from "@/hooks/useFurigana";
import { useNowPlayingCover } from "@/hooks/useNowPlayingCover";

export interface NowPlayingLyrics {
  source: "ipod" | null;
  isPlaying: boolean;
  track: Track | null;
  coverUrl: string | null;
  /** Live playback position used for word-level highlighting (ms). */
  currentTimeMs: number;
  /** Raw elapsed playback position (seconds, before lyric offset). */
  elapsedSeconds: number;
  lyricsControls: ReturnType<typeof useLyrics>;
  furiganaMap: ReturnType<typeof useFurigana>["furiganaMap"];
  soramimiMap: ReturnType<typeof useFurigana>["soramimiMap"];
  lyricsFontClassName: string;
  /** True when there are lyric lines to render for the active track. */
  hasLyrics: boolean;
  /** iPod View → Display mode for the active player. */
  effectiveDisplayMode: DisplayMode;
  /** Shader / landscape / cover backgrounds animate only while playing in non-Video modes. */
  visualBackgroundActive: boolean;
}

/**
 * Resolves the now-playing track + synced lyrics for the `dynamic://lyrics`
 * wallpaper. Mirrors {@link useNowPlayingCover}'s precedence (actively playing
 * wins; otherwise whichever has a current track) and independently loads lyrics
 * so the wallpaper works whether or not the iPod window is open.
 */
export function useNowPlayingLyrics(): NowPlayingLyrics {
  // iPod playback state.
  const ipodIsPlaying = useIpodStore((s) => s.isPlaying);
  const ipodLibrarySource = useIpodStore((s) => s.librarySource);
  const ipodCurrentSongId = useIpodStore((s) => s.currentSongId);
  const ipodAppleSongId = useIpodStore((s) => s.appleMusicCurrentSongId);
  const ipodTracks = useIpodStore((s) => s.tracks);
  const ipodAppleTracks = useIpodStore((s) => s.appleMusicTracks);
  const ipodElapsed = useIpodStore((s) => s.elapsedTime);

  // Shared lyrics preferences live on the iPod store.
  const romanization = useIpodStore((s) => s.romanization);
  const lyricsTranslationLanguage = useIpodStore(
    (s) => s.lyricsTranslationLanguage
  );
  const lyricsFont = useIpodStore((s) => s.lyricsFont);
  const ipodDisplayMode = useIpodStore((s) => s.displayMode ?? DisplayMode.Video);

  const cover = useNowPlayingCover();

  const { source, track, elapsed, isPlaying } = useMemo(() => {
    const ipodTrack = getActiveIpodCurrentTrack({
      librarySource: ipodLibrarySource,
      tracks: ipodTracks,
      currentSongId: ipodCurrentSongId,
      appleMusicTracks: ipodAppleTracks,
      appleMusicCurrentSongId: ipodAppleSongId,
    });
    if (ipodIsPlaying)
      return {
        source: "ipod" as const,
        track: ipodTrack,
        elapsed: ipodElapsed,
        isPlaying: true,
      };
    if (ipodTrack)
      return {
        source: "ipod" as const,
        track: ipodTrack,
        elapsed: ipodElapsed,
        isPlaying: false,
      };
    return {
      source: null as "ipod" | null,
      track: null as Track | null,
      elapsed: 0,
      isPlaying: false,
    };
  }, [
    ipodIsPlaying,
    ipodLibrarySource,
    ipodCurrentSongId,
    ipodAppleSongId,
    ipodTracks,
    ipodAppleTracks,
    ipodElapsed,
  ]);

  const lyricOffsetMs = track?.lyricOffset ?? 0;
  const currentTime = elapsed + lyricOffsetMs / 1000;

  const effectiveTranslationLanguage = getEffectiveTranslationLanguage(
    lyricsTranslationLanguage
  );

  const selectedMatchForLyrics = useMemo(() => {
    const src = track?.lyricsSource;
    if (!src) return undefined;
    return {
      hash: src.hash,
      albumId: src.albumId,
      title: src.title,
      artist: src.artist,
      album: src.album,
    };
  }, [track?.lyricsSource]);

  const lyricsControls = useLyrics({
    songId: track?.id ?? "",
    title: track?.title ?? "",
    artist: track?.artist ?? "",
    currentTime,
    translateTo: effectiveTranslationLanguage,
    selectedMatch: selectedMatchForLyrics,
    includeFurigana: true,
    includeSoramimi: true,
    soramimiTargetLanguage: romanization.soramamiTargetLanguage ?? "zh-TW",
  });

  const { furiganaMap, soramimiMap } = useFurigana({
    songId: track?.id ?? "",
    lines: lyricsControls.originalLines,
    isShowingOriginal: true,
    romanization,
    prefetchedInfo: lyricsControls.furiganaInfo,
    prefetchedSoramimiInfo: lyricsControls.soramimiInfo,
  });

  const lyricsFontClassName = getLyricsFontClassName(
    lyricsFont ?? LyricsFontEnum.GoldGlow
  );

  const displayMode = ipodDisplayMode;
  const effectiveDisplayMode =
    source === "ipod" &&
    track?.source === "appleMusic" &&
    displayMode === DisplayMode.Video
      ? DisplayMode.Cover
      : displayMode;
  const visualBackgroundActive =
    isPlaying && effectiveDisplayMode !== DisplayMode.Video;

  return {
    source,
    isPlaying,
    track,
    coverUrl: cover.coverUrl,
    currentTimeMs: currentTime * 1000,
    elapsedSeconds: elapsed,
    lyricsControls,
    furiganaMap,
    soramimiMap,
    lyricsFontClassName,
    hasLyrics: lyricsControls.lines.length > 0,
    effectiveDisplayMode,
    visualBackgroundActive,
  };
}
