import { type AbortableFetchOptions } from "@/utils/abortableFetch";

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  code?: string;
  [key: string]: unknown;
}

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  payload?: ApiErrorPayload;

  constructor(status: number, message: string, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = payload?.code;
    this.payload = payload;
  }
}

export interface ApiRequestOptions<TBody = unknown> {
  path: string;
  method?: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: TBody;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeout?: number;
  retry?: AbortableFetchOptions["retry"];
}

export function getBrowserTimeZone(): string | null {
  if (typeof Intl === "undefined") {
    return null;
  }

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZone && timeZone !== "Unknown" ? timeZone : null;
  } catch {
    return null;
  }
}

export function getBrowserTimeZoneHeaders(): Record<string, string> {
  const timeZone = getBrowserTimeZone();
  return timeZone ? { "X-User-Timezone": timeZone } : {};
}

async function parseErrorPayload(response: Response): Promise<ApiErrorPayload> {
  try {
    const data = (await response.json()) as ApiErrorPayload;
    return data ?? {};
  } catch {
    return {};
  }
}

async function performApiRequest<TBody = unknown>(
  _options: ApiRequestOptions<TBody>
): Promise<Response> {
  // STATIC PORTFOLIO BUILD: the ryOS backend was removed, so no `/api/*`
  // request is ever fired. Callers receive a synthetic 404 — the same shape
  // the original backend returned for missing data — so existing
  // `ApiRequestError(404)` handling resolves to empty / cache-miss / no-op
  // states (no accounts, no song catalog, no lyrics service).
  return new Response(
    JSON.stringify({ error: "Backend disabled in static portfolio build" }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}

export async function apiRequestRaw<TBody = unknown>(
  options: ApiRequestOptions<TBody>
): Promise<Response> {
  return performApiRequest(options);
}

export async function apiRequest<TResponse, TBody = unknown>(
  options: ApiRequestOptions<TBody>
): Promise<TResponse> {
  const response = await performApiRequest(options);

  if (!response.ok) {
    const payload = await parseErrorPayload(response);
    const message =
      payload.error ||
      payload.message ||
      `Request failed with status ${response.status}`;
    throw new ApiRequestError(response.status, message, payload);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
