import type { Tab, TabGroup } from '../types';
import { FRIENDLY_DOMAINS } from '../config/friendly-domains';
import { LANDING_PAGE_PATTERNS, isLandingPage } from './landing-pages';

// ─── Constants ──────────────────────────────────────────────────────

export const LANDING_PAGES_KEY = '__landing-pages__';
const LOCAL_FILES_KEY = 'local-files';
const DEFAULT_COLOR = '#4DAB9A';
const DUPLICATE_COLOR = '#DFAB01';

// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Derive a human-friendly display name for a domain.
 * Uses the FRIENDLY_DOMAINS lookup table, falls back to cleaning
 * the raw hostname (strip "www.", TLD, etc.).
 */
function friendlyNameForDomain(domain: string): string {
  if (FRIENDLY_DOMAINS[domain]) return FRIENDLY_DOMAINS[domain];
  if (domain === LANDING_PAGES_KEY) return 'Homepages';
  if (domain === LOCAL_FILES_KEY) return FRIENDLY_DOMAINS[LOCAL_FILES_KEY] ?? 'Local Files';

  // Strip common prefix and TLD for a clean fallback
  const cleaned = domain.replace(/^www\./, '').replace(/\.[a-z.]+$/, '');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Count how many tabs in the array are duplicates (same URL appears
 * more than once).  Returns `{ duplicateCount, hasDuplicates }`.
 */
function countDuplicates(tabs: readonly Tab[]): {
  duplicateCount: number;
  hasDuplicates: boolean;
} {
  const urlCounts = new Map<string, number>();
  for (const tab of tabs) {
    const count = urlCounts.get(tab.url) ?? 0;
    urlCounts.set(tab.url, count + 1);
  }

  let duplicateCount = 0;
  for (const count of urlCounts.values()) {
    if (count > 1) duplicateCount += count - 1;
  }

  return { duplicateCount, hasDuplicates: duplicateCount > 0 };
}

/**
 * Check whether a domain is associated with any landing page pattern,
 * used for priority sorting (landing-page domains sort before others).
 */
function isLandingDomain(domain: string): boolean {
  const hostnames = new Set(
    LANDING_PAGE_PATTERNS.map((p) => p.hostname).filter(Boolean),
  );
  const suffixes = LANDING_PAGE_PATTERNS
    .map((p) => p.hostnameEndsWith)
    .filter(Boolean);

  if (hostnames.has(domain)) return true;
  return suffixes.some((s) => domain.endsWith(s!));
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Default sort comparator for domain keys.
 * Landing pages first, then landing-domain priority, then by tab count descending.
 */
function defaultSortComparator(
  groupMap: Map<string, Tab[]>,
): (a: string, b: string) => number {
  return (a, b) => {
    const aIsLanding = a === LANDING_PAGES_KEY;
    const bIsLanding = b === LANDING_PAGES_KEY;
    if (aIsLanding !== bIsLanding) return aIsLanding ? -1 : 1;

    const aIsPriority = isLandingDomain(a);
    const bIsPriority = isLandingDomain(b);
    if (aIsPriority !== bIsPriority) return aIsPriority ? -1 : 1;

    return groupMap.get(b)!.length - groupMap.get(a)!.length;
  };
}

/**
 * Group tabs by domain, pulling landing pages into their own group.
 *
 * Algorithm:
 * 1. Separate landing-page tabs into `__landing-pages__` group.
 * 2. Group remaining tabs by hostname.
 * 3. Handle `file://` URLs as `local-files`.
 * 4. Sort: custom order first (if provided), then default logic
 *    (landing pages → priority domains → tab count descending).
 *
 * The returned groups are fully hydrated TabGroup objects ready for
 * rendering — each carries its friendly name, color, duplicate info,
 * and a stable sort order.
 */
export function groupTabsByDomain(
  tabs: readonly Tab[],
  customOrder?: Record<string, number>,
): TabGroup[] {
  if (tabs.length === 0) return [];

  const groupMap = new Map<string, Tab[]>();
  const landingTabs: Tab[] = [];

  for (const tab of tabs) {
    try {
      // 1. Landing pages go into their own bucket
      if (isLandingPage(tab.url)) {
        landingTabs.push(tab);
        continue;
      }

      // 2. file:// URLs → local-files group
      let hostname: string;
      if (tab.url.startsWith('file://')) {
        hostname = LOCAL_FILES_KEY;
      } else {
        hostname = new URL(tab.url).hostname;
      }

      if (!hostname) continue;

      const existing = groupMap.get(hostname);
      if (existing) {
        existing.push(tab);
      } else {
        groupMap.set(hostname, [tab]);
      }
    } catch {
      // Skip malformed URLs
    }
  }

  // Add landing pages group (only if there are any)
  if (landingTabs.length > 0) {
    groupMap.set(LANDING_PAGES_KEY, landingTabs);
  }

  // Build sorted groups
  const groups: TabGroup[] = [];

  const defaultCompare = defaultSortComparator(groupMap);

  // Sort keys: apply custom order overrides, then fall back to default logic
  const sortedKeys = [...groupMap.keys()].sort((a, b) => {
    if (customOrder && Object.keys(customOrder).length > 0) {
      const aCustom = customOrder[a];
      const bCustom = customOrder[b];

      // Both have custom order: sort by that
      if (aCustom !== undefined && bCustom !== undefined) {
        return aCustom - bCustom;
      }
      // Only one has custom order: custom-ordered goes first
      if (aCustom !== undefined) return -1;
      if (bCustom !== undefined) return 1;
    }

    // No custom order for either: use default sort
    return defaultCompare(a, b);
  });

  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    const groupTabs = groupMap.get(key)!;
    const { duplicateCount, hasDuplicates } = countDuplicates(groupTabs);

    groups.push({
      id: key,
      domain: key,
      friendlyName: friendlyNameForDomain(key),
      tabs: groupTabs,
      collapsed: false,
      order: i,
      color: hasDuplicates ? DUPLICATE_COLOR : DEFAULT_COLOR,
      hasDuplicates,
      duplicateCount,
    });
  }

  return groups;
}
