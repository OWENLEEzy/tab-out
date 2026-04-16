import { updateBadge } from '../utils/badge';
import { isRealTab } from '../utils/url';

/**
 * Count real web tabs and update the toolbar badge.
 * "Real" = not chrome://, not extension pages, not about:blank.
 */
async function refreshBadge(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({});
    const count = tabs.filter((t) => isRealTab(t.url ?? '')).length;
    await updateBadge(count);
  } catch {
    try {
      await chrome.action.setBadgeText({ text: '' });
    } catch {
      // Silently fail
    }
  }
}

// Update badge on install
chrome.runtime.onInstalled.addListener(() => {
  refreshBadge();
});

// Update badge on browser startup
chrome.runtime.onStartup.addListener(() => {
  refreshBadge();
});

// Update badge when tabs change
chrome.tabs.onCreated.addListener(() => {
  refreshBadge();
});

chrome.tabs.onRemoved.addListener(() => {
  refreshBadge();
});

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
chrome.tabs.onUpdated.addListener(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(refreshBadge, 300);
});

// Initial run when service worker loads
refreshBadge();
