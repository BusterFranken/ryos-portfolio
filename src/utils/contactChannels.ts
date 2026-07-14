/**
 * Contact channels — email is assembled at runtime from parts so the literal
 * address never appears as a scrapable string in the served HTML or JS bundle.
 * A naive `\w+@\w+` regex over the bundle won't match across the join, and the
 * address only materialises when a visitor actually triggers a contact action.
 *
 * This is deliberate anti-scraping, not real secrecy — the email is still shown
 * in the Contacts app once opened. Keep the address OUT of any static content
 * (docs, markdown, JSON seed); route every "email me" affordance through here.
 */
const EMAIL_LOCAL = ["buster", "franken"].join("");
const EMAIL_DOMAIN = ["gmail", "com"].join(".");

/** The full address, assembled at call time. */
export function getContactEmail(): string {
  return `${EMAIL_LOCAL}@${EMAIL_DOMAIN}`;
}

/** A `mailto:` URL, assembled at call time. Pass a subject for prefill. */
export function buildMailto(subject?: string): string {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${getContactEmail()}${query}`;
}

/** Owner's public profile links (safe to expose — not scrape-sensitive). */
export const CONTACT_LINKS = {
  linkedin: "https://www.linkedin.com/in/buster-franken/",
  github: "https://github.com/BusterFranken",
  youtube: "https://www.youtube.com/@fruitpunchai5359",
} as const;
