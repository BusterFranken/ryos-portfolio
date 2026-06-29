/**
 * Derive up to two uppercase initials from a username for avatar fallbacks.
 * Strips a leading "@" and trims whitespace; returns "?" when empty.
 */
export function getUsernameInitials(username: string): string {
  const base = username.replace(/^@+/, "").trim();
  if (!base) return "?";
  return base.slice(0, 2).toUpperCase();
}
