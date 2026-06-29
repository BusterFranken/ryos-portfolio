/**
 * Apple MusicKit JS loader / configurer — STUBBED.
 *
 * The original hook fetched a developer token from `/api/musickit-token`,
 * lazy-loaded MusicKit JS, and configured a singleton instance so the iPod
 * could stream the user's Apple Music library. The static portfolio build
 * has no backend and ships no MusicKit token, so this module reports a
 * permanent "not-configured" state and never loads the script or makes a
 * network request. The iPod degrades gracefully to local / YouTube playback.
 *
 * The exported surface (hook return shape, `getMusicKitInstance`,
 * `onMusicKitReady`, `buildMusicKitConfigureOptions`, the bitrate constant,
 * the status type) is preserved so every consumer + test still compiles.
 */

export const APPLE_MUSIC_STREAMING_BITRATE_KBPS = 256;

export function buildMusicKitConfigureOptions(
  developerToken: string,
  app: MusicKit.AppMetadata
): MusicKit.ConfigureOptions {
  return {
    developerToken,
    app,
    bitrate: APPLE_MUSIC_STREAMING_BITRATE_KBPS,
  };
}

export type MusicKitStatus =
  | "idle"
  | "missing-token"
  | "not-configured"
  | "loading"
  | "ready"
  | "error";

/** No MusicKit instance is ever configured in the portfolio build. */
export function getMusicKitInstance(): MusicKit.MusicKitInstance | null {
  return null;
}

/**
 * Subscribe to instance-ready notifications. The stub never configures an
 * instance, so the callback is never invoked. Returns a no-op unsubscribe.
 */
export function onMusicKitReady(
  _cb: (instance: MusicKit.MusicKitInstance) => void
): () => void {
  return () => {};
}

/** No-op: there is no developer-token cache to clear in the stub. */
export function clearMusicKitTokenCache(): void {}

export interface UseMusicKitOptions {
  /** Skip loading until set to true. Defaults to true. */
  enabled?: boolean;
  /** App metadata reported to MusicKit; shows up in the auth dialog. */
  app?: MusicKit.AppMetadata;
}

export interface UseMusicKitResult {
  status: MusicKitStatus;
  error: string | null;
  hasToken: boolean;
  instance: MusicKit.MusicKitInstance | null;
  /** True when a user has authorized the app for personal Apple Music access. */
  isAuthorized: boolean;
  /** Trigger Apple's auth popup. Resolves with a Music User Token. */
  authorize: () => Promise<string | null>;
  /** Revoke the current Music User Token. */
  unauthorize: () => Promise<void>;
}

// Stable identities so consumers can list them in dependency arrays without
// triggering re-render loops.
const noopAuthorize = async (): Promise<string | null> => null;
const noopUnauthorize = async (): Promise<void> => {};

/**
 * Stubbed hook: Apple Music is not configured in the portfolio build.
 * Always reports `status: "not-configured"` with no instance.
 */
export function useMusicKit(_options: UseMusicKitOptions = {}): UseMusicKitResult {
  return {
    status: "not-configured",
    error: null,
    hasToken: false,
    instance: null,
    isAuthorized: false,
    authorize: noopAuthorize,
    unauthorize: noopUnauthorize,
  };
}
