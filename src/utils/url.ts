/**
 * Check if a URL is a real web page (not browser-internal).
 */
export function isRealTab(url: string): boolean {
  return (
    !url.startsWith('chrome://') &&
    !url.startsWith('chrome-extension://') &&
    !url.startsWith('about:') &&
    !url.startsWith('edge://') &&
    !url.startsWith('brave://')
  );
}

/**
 * Sanitize a URL for safe use in HTML attributes (prevents XSS).
 */
export function sanitizeUrl(url: string): string {
  return url.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Extract hostname from a URL, returns empty string on failure.
 */
export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

/**
 * Get favicon URL for a domain using Google's favicon service.
 */
export function getFaviconUrl(domain: string, size: number = 16): string {
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

/**
 * Check if a URL is a Tab Out new tab page.
 */
export function isTabOutPage(url: string): boolean {
  if (!url) return false;
  if (url === 'chrome://newtab/') return true;
  try {
    const extensionPrefix = chrome.runtime.getURL('');
    return url.startsWith(extensionPrefix);
  } catch {
    return false;
  }
}
