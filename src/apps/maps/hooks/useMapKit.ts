import { useEffect, useReducer } from "react";

/**
 * Apple MapKit JS lazy loader.
 *
 * The script is loaded the first time a component requests it and then
 * cached for the rest of the page's lifetime. Repeated open/close cycles
 * of the Maps app will reuse the same `mapkit` global instead of pulling
 * the script again or calling `mapkit.init` twice.
 *
 * Token resolution (static portfolio build): the server token endpoint was
 * removed, so the only source is `import.meta.env.VITE_MAPKIT_TOKEN`. When it
 * is unset the hook returns `status: "missing-token"` so callers can render a
 * friendly placeholder instead of crashing.
 */

const MAPKIT_SCRIPT_SRC = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
const MAPKIT_SCRIPT_ID = "ryos-mapkit-js";

export type MapKitStatus =
  | "idle"
  | "missing-token"
  | "loading"
  | "ready"
  | "error";

let scriptPromise: Promise<void> | null = null;
let initialized = false;

interface AppleMapKitNamespace {
  init: (options: {
    authorizationCallback: (done: (token: string) => void) => void;
    language?: string;
  }) => void;
  // We intentionally keep the rest of the surface as `unknown` – consumers
  // cast to the richer `mapkit` global when they need it.
  [key: string]: unknown;
}

declare global {
  interface Window {
    mapkit?: AppleMapKitNamespace;
  }
}

function getEnvFallbackToken(): string | undefined {
  const token = import.meta.env.VITE_MAPKIT_TOKEN as string | undefined;
  return token && token.trim().length > 0 ? token.trim() : undefined;
}

/**
 * Resolve a MapKit token from `VITE_MAPKIT_TOKEN` only. The server token
 * endpoint (`/api/mapkit-token`) was removed for the static portfolio build.
 * Throws when no env token is configured so callers can render the
 * missing-token overlay (see `MapsMapStatusOverlay`).
 */
async function resolveToken(): Promise<string> {
  const fallback = getEnvFallbackToken();
  if (fallback) return fallback;
  throw new Error("No MapKit token configured (VITE_MAPKIT_TOKEN unset)");
}

function loadScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("MapKit JS requires a browser"));
  }

  if (window.mapkit) {
    return Promise.resolve();
  }

  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      MAPKIT_SCRIPT_ID
    ) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (window.mapkit) {
        resolve();
      } else {
        reject(new Error("MapKit JS loaded but mapkit global is missing"));
      }
    };

    if (existing) {
      if (window.mapkit) {
        resolve();
        return;
      }
      existing.addEventListener("load", handleLoad, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load MapKit JS")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.id = MAPKIT_SCRIPT_ID;
    script.src = MAPKIT_SCRIPT_SRC;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener(
      "error",
      () => {
        scriptPromise = null;
        reject(new Error("Failed to load MapKit JS"));
      },
      { once: true }
    );
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function initMapKitWithCallback(language?: string) {
  if (initialized || !window.mapkit) return;
  window.mapkit.init({
    authorizationCallback: (done) => {
      resolveToken()
        .then((token) => done(token))
        .catch((err) => {
          // MapKit doesn't expose a way to signal failure from the callback;
          // logging here keeps the failure visible while the caller's status
          // state already reflects the "error"/"missing-token" condition.
          console.error("[mapkit] failed to resolve token", err);
        });
    },
    language,
  });
  initialized = true;
}

export interface UseMapKitOptions {
  /** Skip loading until set to true. Defaults to true. */
  enabled?: boolean;
  /** Optional BCP-47 language tag forwarded to mapkit.init */
  language?: string;
}

export interface UseMapKitResult {
  status: MapKitStatus;
  error: string | null;
  hasToken: boolean;
}

/**
 * Hook that lazily loads Apple MapKit JS and initializes it. The token comes
 * from `VITE_MAPKIT_TOKEN` only (the server endpoint was removed). When it is
 * unset the hook returns `status: "missing-token"` so callers can render a
 * friendly placeholder.
 */
export function useMapKit(options: UseMapKitOptions = {}): UseMapKitResult {
  const { enabled = true, language } = options;

  type MapKitHookState = {
    status: MapKitStatus;
    error: string | null;
    hasToken: boolean;
  };
  type MapKitHookAction =
    | { type: "set"; payload: Partial<MapKitHookState> }
    | { type: "readyInitialized" }
    | { type: "missingToken" };
  const initialState: MapKitHookState = {
    status: initialized ? "ready" : "idle",
    error: null,
    hasToken: Boolean(getEnvFallbackToken()),
  };
  const reducer = (
    state: MapKitHookState,
    action: MapKitHookAction
  ): MapKitHookState => {
    switch (action.type) {
      case "set":
        return { ...state, ...action.payload };
      case "readyInitialized":
        return { ...state, status: "ready", hasToken: true, error: null };
      case "missingToken":
        return { ...state, status: "missing-token", hasToken: false, error: null };
      default:
        return state;
    }
  };
  const [state, dispatch] = useReducer(reducer, initialState);
  const { status, error, hasToken } = state;

  useEffect(() => {
    if (!enabled) return;

    if (initialized) {
      dispatch({ type: "readyInitialized" });
      return;
    }

    let cancelled = false;
    dispatch({ type: "set", payload: { status: "loading", error: null } });

    (async () => {
      try {
        // Probe for a token first so we can show "missing-token" without
        // bothering to load the MapKit script when nothing is configured.
        await resolveToken();
        if (cancelled) return;
        dispatch({ type: "set", payload: { hasToken: true } });

        await loadScript();
        if (cancelled) return;

        try {
          initMapKitWithCallback(language);
          dispatch({ type: "set", payload: { status: "ready", error: null } });
        } catch (err) {
          dispatch({
            type: "set",
            payload: {
              error: err instanceof Error ? err.message : String(err),
              status: "error",
            },
          });
        }
      } catch (err) {
        if (cancelled) return;
        const fallback = getEnvFallbackToken();
        if (!fallback) {
          dispatch({ type: "missingToken" });
          return;
        }
        dispatch({
          type: "set",
          payload: {
            error: err instanceof Error ? err.message : String(err),
            status: "error",
          },
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, language]);

  return { status, error, hasToken };
}
