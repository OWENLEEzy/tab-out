import type { LandingPagePattern } from '../types';

/**
 * Patterns that identify "landing pages" — the home/root views of major
 * sites (Gmail inbox, X home feed, etc.).
 *
 * These are separated into their own tab group so they can be closed
 * together without affecting content tabs on the same domain
 * (e.g. closing Gmail inbox without closing an open email thread).
 */
export const LANDING_PAGE_PATTERNS: readonly LandingPagePattern[] = [
  {
    hostname: 'mail.google.com',
    // Match the Gmail root page but NOT inbox threads, sent mail, or search
    test: (_path: string, url: string): boolean =>
      !url.includes('#inbox/') &&
      !url.includes('#sent/') &&
      !url.includes('#search/'),
  },
  {
    hostname: 'x.com',
    pathExact: ['/home'],
  },
  {
    hostname: 'www.linkedin.com',
    pathExact: ['/'],
  },
  {
    hostname: 'github.com',
    pathExact: ['/'],
  },
  {
    hostname: 'www.youtube.com',
    pathExact: ['/'],
  },
] as const;

/**
 * Check whether a URL matches any landing page pattern.
 *
 * A landing page is the "home" view of a major site — the Gmail inbox,
 * the X home feed, etc.  These get pulled into a dedicated tab group
 * so the user can close them in bulk without touching content tabs
 * on the same domain.
 *
 * Returns `false` for unparseable URLs.
 */
export function isLandingPage(url: string): boolean {
  try {
    const parsed = new URL(url);

    return LANDING_PAGE_PATTERNS.some((pattern) => {
      // 1. Hostname matching: exact match or suffix match
      const hostnameMatch = pattern.hostname
        ? parsed.hostname === pattern.hostname
        : pattern.hostnameEndsWith
          ? parsed.hostname.endsWith(pattern.hostnameEndsWith)
          : false;

      if (!hostnameMatch) return false;

      // 2. Path / custom test matching (first match wins)
      if (pattern.test) return pattern.test(parsed.pathname, url);
      if (pattern.pathPrefix) return parsed.pathname.startsWith(pattern.pathPrefix);
      if (pattern.pathExact) return pattern.pathExact.includes(parsed.pathname);

      // No path filter means match root path only
      return parsed.pathname === '/';
    });
  } catch {
    return false;
  }
}
