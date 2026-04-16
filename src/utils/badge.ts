/**
 * Get badge color based on tab count.
 * Green ≤10, Amber 11-20, Red 21+.
 */
export function getBadgeColor(count: number): string {
  if (count <= 10) return '#4DAB9A';
  if (count <= 20) return '#DFAB01';
  return '#EB5757';
}

/**
 * Update the extension toolbar badge with current tab count.
 * Hides badge when count is 0.
 */
export async function updateBadge(count: number): Promise<void> {
  try {
    await chrome.action.setBadgeText({
      text: count > 0 ? String(count) : '',
    });
    if (count === 0) return;
    await chrome.action.setBadgeBackgroundColor({
      color: getBadgeColor(count),
    });
  } catch {
    try {
      await chrome.action.setBadgeText({ text: '' });
    } catch {
      // Silently fail if chrome API is unavailable
    }
  }
}
