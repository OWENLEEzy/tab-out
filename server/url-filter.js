// server/url-filter.js
// ─────────────────────────────────────────────────────────────────────────────
// Noise filter for raw Chrome browsing history entries.
//
// Think of Chrome history as a huge messy inbox — it captures everything,
// including login redirects, OAuth flows, browser-internal pages, and error
// screens. None of that is useful when trying to understand what you've been
// *reading or working on*. This module acts as a bouncer: it only lets in
// entries that look like real, meaningful content.
//
// Two exported functions:
//   filterUrls(entries)      — removes noise entries
//   deduplicateUrls(entries) — collapses identical URLs, keeping the latest visit
// ─────────────────────────────────────────────────────────────────────────────

// ─── Blocked domains ─────────────────────────────────────────────────────────
// These are entire domains that only exist for authentication/account management.
// There's no reading content on these pages — they're just plumbing.
const BLOCKED_DOMAINS = [
  'accounts.google.com',
  'accounts.youtube.com',
  'myaccount.google.com',
  'chrome.google.com/webstore',
];

// ─── Blocked URL patterns (regex) ────────────────────────────────────────────
// These patterns catch browser-internal pages (chrome://) and authentication
// flows (/login, /oauth, /signin, etc.) regardless of which domain they're on.
// The \b word boundary in some patterns prevents false positives.
const BLOCKED_URL_PATTERNS = [
  /^chrome:\/\//i,
  /^chrome-extension:\/\//i,
  /^about:/i,
  /^edge:\/\//i,
  /\/oauth/i,
  /\/signin/i,
  /\/sign-in/i,
  /\/login/i,
  /\/auth\//i,
  /\/callback\?/i,       // matches /callback? (OAuth return URLs)
  /sessionTimeout/i,
  /ServiceLogin/i,
  /InteractiveLogin/i,
];

// ─── Blocked titles (case-insensitive partial match) ─────────────────────────
// Titles that indicate a page that never fully loaded, or is just a
// transitional screen. We store them in lowercase; comparison is done
// after lowercasing the entry's title.
const BLOCKED_TITLES_LOWER = [
  'just a moment...',
  'sign in',
  'log in',
  'redirecting',
  'loading...',
  '403 forbidden',
  '404 not found',
  '500 internal server error',
];

// ─── Minimum title length ─────────────────────────────────────────────────────
// Titles under 4 characters are basically meaningless (e.g. "-", "OK", "")
const MIN_TITLE_LENGTH = 4;

/**
 * filterUrls(entries)
 *
 * Takes an array of history entry objects and returns only the meaningful ones.
 * Each entry is expected to have at minimum: { url, title }
 *
 * Returns a new filtered array — does not mutate the original.
 */
function filterUrls(entries) {
  return entries.filter(entry => {
    const url   = (entry.url   || '').trim();
    const title = (entry.title || '').trim();
    const titleLower = title.toLowerCase();

    // ── 1. Reject entries with no URL at all ──────────────────────────────────
    if (!url) return false;

    // ── 2. Validate that the URL is parseable ─────────────────────────────────
    // The URL constructor throws for malformed URLs. If it throws, the entry
    // is garbage data — skip it.
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return false;
    }

    // ── 3. Check blocked domains ──────────────────────────────────────────────
    // parsedUrl.host gives us "accounts.google.com" without protocol or path.
    // We also check parsedUrl.host + parsedUrl.pathname for path-based domains
    // like "chrome.google.com/webstore".
    const hostAndPath = parsedUrl.host + parsedUrl.pathname;
    for (const domain of BLOCKED_DOMAINS) {
      // Match at the start of host, or anywhere in hostAndPath for path-based entries
      if (parsedUrl.host === domain || hostAndPath.startsWith(domain)) {
        return false;
      }
    }

    // ── 4. Check blocked URL patterns ─────────────────────────────────────────
    for (const pattern of BLOCKED_URL_PATTERNS) {
      if (pattern.test(url)) return false;
    }

    // ── 5. Reject entries with a title too short to be meaningful ─────────────
    if (title.length < MIN_TITLE_LENGTH) return false;

    // ── 6. Check blocked titles ───────────────────────────────────────────────
    for (const blocked of BLOCKED_TITLES_LOWER) {
      if (titleLower.includes(blocked)) return false;
    }

    // Made it past all the bouncers — this is a real content entry.
    return true;
  });
}

/**
 * deduplicateUrls(entries)
 *
 * Chrome records every visit, so the same article or page can appear dozens
 * of times. This function collapses duplicates to just one entry per URL,
 * keeping the *most recent* visit.
 *
 * Deduplication key:
 *   - Strip query strings longer than 100 characters before comparing.
 *     Short query strings (like ?tab=settings or ?q=hello) are part of the
 *     page identity. Long query strings (tracking tokens, session IDs) are not.
 *
 * Returns a new deduplicated array — does not mutate the original.
 */
function deduplicateUrls(entries) {
  // Map from dedup-key → best entry seen so far
  const seen = new Map();

  for (const entry of entries) {
    const key = buildDedupKey(entry.url || '');

    if (!seen.has(key)) {
      // First time we see this URL — store it.
      seen.set(key, entry);
    } else {
      // We've seen this URL before — keep whichever has the more recent visit.
      const existing = seen.get(key);

      // last_visit_raw is the raw microsecond timestamp from Chrome.
      // Higher = more recent. Fall back to 0 if missing.
      const existingTime = existing.last_visit_raw  || 0;
      const newTime      = entry.last_visit_raw     || 0;

      if (newTime > existingTime) {
        seen.set(key, entry);
      }
    }
  }

  // Convert the Map values back to an array, preserving insertion order
  // (which after dedup corresponds to first-seen order).
  return Array.from(seen.values());
}

/**
 * buildDedupKey(url)
 *
 * Builds the key used for deduplication.
 * If the query string is longer than 100 characters, strip it entirely.
 * Otherwise keep the full URL (including short, meaningful query strings).
 */
function buildDedupKey(url) {
  try {
    const parsed = new URL(url);
    if (parsed.search.length > 100) {
      // Strip the long query string — just use origin + pathname
      return parsed.origin + parsed.pathname;
    }
    // Short query string is meaningful — keep the full URL
    return url;
  } catch {
    // Unparseable URL — use as-is (filterUrls should have caught this, but
    // being defensive is fine here)
    return url;
  }
}

module.exports = { filterUrls, deduplicateUrls };
