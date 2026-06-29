export interface ClientRuntimeConfig {
  appPublicOrigin?: string;
  docsBaseUrl?: string;
}

declare global {
  interface Window {
    __RYOS_RUNTIME_CONFIG__?: ClientRuntimeConfig;
  }
}

const DEFAULT_PUBLIC_ORIGIN = "https://os.ryo.lu";

function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const first = trimmed.split(",")[0]?.trim();
  if (!first) return null;
  try {
    const origin = new URL(first.startsWith("http") ? first : `https://${first}`)
      .origin.replace(/\/+$/, "");
    if (origin.includes(",")) return null;
    return origin;
  } catch {
    return null;
  }
}

function readWindowRuntimeConfig(): ClientRuntimeConfig {
  if (typeof window === "undefined") {
    return {};
  }
  return window.__RYOS_RUNTIME_CONFIG__ || {};
}

export function getClientRuntimeConfig(): ClientRuntimeConfig {
  return readWindowRuntimeConfig();
}

export function getAppPublicOrigin(): string {
  const runtimeOrigin = normalizeOrigin(getClientRuntimeConfig().appPublicOrigin);
  if (runtimeOrigin) return runtimeOrigin;

  const buildOrigin = normalizeOrigin(import.meta.env.VITE_APP_PUBLIC_ORIGIN);
  if (buildOrigin) return buildOrigin;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return DEFAULT_PUBLIC_ORIGIN;
}

export function getDocsBaseUrl(): string {
  const runtimeDocsBase = normalizeOrigin(getClientRuntimeConfig().docsBaseUrl);
  if (runtimeDocsBase) return runtimeDocsBase;
  return `${getAppPublicOrigin()}/docs`;
}
