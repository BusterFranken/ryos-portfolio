import { create } from "zustand";
import { useStoreShallow } from "./helpers";

/**
 * Global auth / identity store.
 *
 * This slice was extracted from the (misleadingly named) `useChatsStore`, which
 * historically owned both chat state and the app-wide auth/identity surface
 * (username, isAuthenticated, login/logout/createUser/deleteAccount). The
 * portfolio is a **no-backend, client-only** build: there are no accounts and no
 * auth server, so every visitor is an anonymous guest.
 *
 * The interface mirrors the auth surface its 20+ consumers used so they all keep
 * compiling and behave as a logged-out guest:
 * - default state is `username: null`, `isAuthenticated: false`,
 *   `hasPassword: null`;
 * - every method that used to hit the backend is a safe no-op that resolves to a
 *   "not available" result (or `void`), never throwing;
 * - the purely-local setters (`setUsername`/`setAuthenticated`/`setHasPassword`)
 *   still update local state so any consumer that sets them keeps working.
 */

const AUTH_UNAVAILABLE_ERROR =
  "Authentication is not available in this build.";

export interface AuthStoreState {
  // Identity
  username: string | null;
  isAuthenticated: boolean;
  hasPassword: boolean | null; // null = unknown / not checked

  // Local setters (kept so consumers that set local identity still work)
  setUsername: (username: string | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setHasPassword: (hasPassword: boolean | null) => void;

  // Backend-backed actions — stubbed to safe guest no-ops (no backend).
  checkHasPassword: () => Promise<{ ok: boolean; error?: string }>;
  setPassword: (
    password: string,
    currentPassword?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  createUser: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: (params: {
    confirmUsername: string;
    currentPassword?: string;
  }) => Promise<{ ok: boolean; error?: string }>;

  reset: () => void;
}

const guestState = (): Pick<
  AuthStoreState,
  "username" | "isAuthenticated" | "hasPassword"
> => ({
  username: null,
  isAuthenticated: false,
  hasPassword: null,
});

export const useAuthStore = create<AuthStoreState>()((set) => ({
  ...guestState(),

  setUsername: (username) => set({ username }),
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setHasPassword: (hasPassword) => set({ hasPassword }),

  checkHasPassword: async () => ({ ok: false, error: AUTH_UNAVAILABLE_ERROR }),
  setPassword: async () => ({ ok: false, error: AUTH_UNAVAILABLE_ERROR }),
  createUser: async () => ({ ok: false, error: AUTH_UNAVAILABLE_ERROR }),
  deleteAccount: async () => ({ ok: false, error: AUTH_UNAVAILABLE_ERROR }),

  logout: async () => {
    set(guestState());
  },

  reset: () => {
    set(guestState());
  },
}));

/**
 * Shallow-equality selector hook for the auth store. Co-located with the store
 * (mirrors the old `useChatsStoreShallow`) so importing it doesn't pull other
 * stores into the bundle.
 */
export function useAuthStoreShallow<T>(
  selector: (state: ReturnType<typeof useAuthStore.getState>) => T
): T {
  return useStoreShallow(useAuthStore, selector);
}
