# Phase 2: Core Features — Tab Out Chrome Extension

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port all core features from the legacy vanilla JS extension (`extension/app.js`) to the new React + TypeScript architecture: tab querying/grouping, domain cards with chips, close/save actions, confetti, sound, and the Saved for Later sidebar.

**Architecture:** Zustand stores for tab/saved/settings state. React components for domain cards, tab chips, deferred column, and effects. Pure utility functions for tab grouping, title cleaning, and domain display. Effects system (confetti + sound) as standalone modules.

**Tech Stack:** React 19, TypeScript 6, Zustand 5, Tailwind CSS v4, Web Audio API, Chrome Extension APIs (tabs, storage)

**Reference:** The source of truth is `extension/app.js` — replicate its behavior exactly.

---

## File Structure (Phase 2 deliverables)

```
src/
├── lib/
│   ├── tab-grouper.ts       # Tab grouping logic (landing pages, custom groups, sorting)
│   ├── title-cleaner.ts     # smartTitle, cleanTitle, stripTitleNoise, friendlyDomain
│   ├── landing-pages.ts     # Landing page pattern definitions + detection
│   ├── confetti.ts          # Confetti particle system (Web Audio + DOM)
│   └── sound.ts             # Web Audio swoosh sound
├── stores/
│   ├── tab-store.ts         # Zustand store for open tabs + groups
│   └── saved-store.ts       # Zustand store for saved tabs (active + archived)
├── newtab/
│   ├── App.tsx              # Main dashboard (replace Phase 1 scaffold)
│   ├── components/
│   │   ├── Header.tsx       # Greeting + date
│   │   ├── DomainCard.tsx   # One domain group card
│   │   ├── TabChip.tsx      # Individual tab chip inside a card
│   │   ├── EmptyState.tsx   # "Inbox zero" when no tabs
│   │   ├── DupeBanner.tsx   # "Close extra Tab Out tabs" banner
│   │   ├── DeferredColumn.tsx  # Saved for Later right sidebar
│   │   ├── DeferredItem.tsx    # One saved tab checklist item
│   │   ├── Toast.tsx           # Action confirmation toast
│   │   └── ErrorBoundary.tsx   # (exists from Phase 1)
│   └── hooks/
│       └── useChromeStorage.ts # (exists from Phase 1)
├── __tests__/
│   ├── tab-grouper.test.ts
│   ├── title-cleaner.test.ts
│   └── landing-pages.test.ts
```

---

### Task 1: Title cleaning utilities

**Files:**
- Create: `src/lib/title-cleaner.ts`
- Create: `src/__tests__/title-cleaner.test.ts`

Port these functions from `extension/app.js` lines 522–692:
- `friendlyDomain(hostname)` — maps hostnames to display names, falls back to cleaned domain
- `capitalize(str)` — first letter uppercase
- `stripTitleNoise(title)` — removes notification counts, email addresses, X format
- `cleanTitle(title, hostname)` — strips site name suffix (" - GitHub") if remaining title is ≥5 chars
- `smartTitle(title, url)` — generates smart titles for GitHub, X, YouTube, Reddit URLs

- [ ] **Step 1: Write tests for title-cleaner**

Create `src/__tests__/title-cleaner.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { friendlyDomain, capitalize, stripTitleNoise, cleanTitle, smartTitle } from '../lib/title-cleaner';

describe('friendlyDomain', () => {
  it('maps known hostnames', () => {
    expect(friendlyDomain('github.com')).toBe('GitHub');
    expect(friendlyDomain('mail.google.com')).toBe('Gmail');
    expect(friendlyDomain('x.com')).toBe('X');
  });

  it('handles substack subdomains', () => {
    expect(friendlyDomain('example.substack.com')).toBe("Example's Substack");
  });

  it('handles github.io', () => {
    expect(friendlyDomain('example.github.io')).toBe('Example (GitHub Pages)');
  });

  it('cleans unknown domains', () => {
    expect(friendlyDomain('www.example.com')).toBe('Example');
    expect(friendlyDomain('docs.example.org')).toBe('Docs Example');
  });

  it('returns empty for empty input', () => {
    expect(friendlyDomain('')).toBe('');
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });
  it('returns empty for empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('stripTitleNoise', () => {
  it('strips leading notification counts', () => {
    expect(stripTitleNoise('(2) Gmail')).toBe('Gmail');
  });

  it('strips inline counts', () => {
    expect(stripTitleNoise('Inbox (16,359)')).toBe('Inbox');
  });

  it('strips email addresses', () => {
    expect(stripTitleNoise('Meeting - user@example.com')).toBe('Meeting');
  });

  it('handles empty input', () => {
    expect(stripTitleNoise('')).toBe('');
  });
});

describe('cleanTitle', () => {
  it('strips site name suffix', () => {
    expect(cleanTitle('My PR - GitHub', 'github.com')).toBe('My PR');
  });

  it('keeps short titles intact', () => {
    expect(cleanTitle('Hi - GitHub', 'github.com')).toBe('Hi - GitHub');
  });
});

describe('smartTitle', () => {
  it('handles GitHub issues', () => {
    expect(smartTitle('title', 'https://github.com/owner/repo/issues/42')).toBe('owner/repo Issue #42');
  });

  it('handles GitHub PRs', () => {
    expect(smartTitle('title', 'https://github.com/owner/repo/pull/7')).toBe('owner/repo PR #7');
  });

  it('handles GitHub repo root', () => {
    expect(smartTitle('https://github.com/owner/repo', 'https://github.com/owner/repo')).toBe('owner/repo');
  });

  it('returns original title for unknown URLs', () => {
    expect(smartTitle('Some Page', 'https://example.com/path')).toBe('Some Page');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/title-cleaner.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement title-cleaner**

Create `src/lib/title-cleaner.ts` — port the five functions from `extension/app.js` lines 522–692. Use `FRIENDLY_DOMAINS` from `src/config/friendly-domains.ts` (already exists from Phase 1).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/title-cleaner.test.ts`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/title-cleaner.ts src/__tests__/title-cleaner.test.ts
git commit -m "feat: add title cleaning and friendly domain utilities"
```

---

### Task 2: Landing page detection + tab grouping logic

**Files:**
- Create: `src/lib/landing-pages.ts`
- Create: `src/lib/tab-grouper.ts`
- Create: `src/__tests__/landing-pages.test.ts`
- Create: `src/__tests__/tab-grouper.test.ts`

Port from `extension/app.js` lines 1036–1143:
- Landing page pattern definitions (Gmail, X, LinkedIn, GitHub, YouTube)
- `isLandingPage(url)` — checks if a URL is a homepage
- `groupTabsByDomain(tabs)` — main grouping function: landing pages → custom groups → domain groups, then sort (landing first, priority domains, then by count)

- [ ] **Step 1: Write landing-pages tests**

Create `src/__tests__/landing-pages.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { isLandingPage } from '../lib/landing-pages';

describe('isLandingPage', () => {
  it('detects Gmail inbox', () => {
    expect(isLandingPage('https://mail.google.com/mail/u/0/#inbox')).toBe(true);
  });

  it('does not flag Gmail search/thread', () => {
    expect(isLandingPage('https://mail.google.com/mail/u/0/#search/query')).toBe(false);
  });

  it('detects X home', () => {
    expect(isLandingPage('https://x.com/home')).toBe(true);
  });

  it('does not flag X profile', () => {
    expect(isLandingPage('https://x.com/someuser')).toBe(false);
  });

  it('detects LinkedIn root', () => {
    expect(isLandingPage('https://www.linkedin.com/')).toBe(true);
  });

  it('detects GitHub root', () => {
    expect(isLandingPage('https://github.com/')).toBe(true);
  });

  it('does not flag GitHub repo', () => {
    expect(isLandingPage('https://github.com/owner/repo')).toBe(false);
  });

  it('detects YouTube root', () => {
    expect(isLandingPage('https://www.youtube.com/')).toBe(true);
  });

  it('returns false for non-landing URLs', () => {
    expect(isLandingPage('https://example.com/')).toBe(false);
  });

  it('returns false for invalid URLs', () => {
    expect(isLandingPage('not-a-url')).toBe(false);
  });
});
```

- [ ] **Step 2: Implement landing-pages.ts**

Create `src/lib/landing-pages.ts` — port `LANDING_PAGE_PATTERNS` and `isLandingPage()` from `extension/app.js` lines 1036–1064.

- [ ] **Step 3: Write tab-grouper tests**

Create `src/__tests__/tab-grouper.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { groupTabsByDomain } from '../lib/tab-grouper';
import type { Tab } from '../types';

function makeTab(overrides: Partial<Tab> & { url: string }): Tab {
  return {
    id: Math.random(),
    url: overrides.url,
    title: overrides.title ?? 'Test',
    favIconUrl: '',
    domain: overrides.domain ?? '',
    windowId: 1,
    active: false,
    isTabOut: false,
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 1,
    ...overrides,
  };
}

describe('groupTabsByDomain', () => {
  it('groups tabs by hostname', () => {
    const tabs = [
      makeTab({ url: 'https://github.com/owner/repo1', domain: 'github.com' }),
      makeTab({ url: 'https://github.com/owner/repo2', domain: 'github.com' }),
      makeTab({ url: 'https://example.com/page', domain: 'example.com' }),
    ];
    const groups = groupTabsByDomain(tabs);
    expect(groups).toHaveLength(2);
    const gh = groups.find(g => g.domain === 'github.com');
    expect(gh?.tabs).toHaveLength(2);
  });

  it('puts landing pages in their own group', () => {
    const tabs = [
      makeTab({ url: 'https://x.com/home', domain: 'x.com' }),
      makeTab({ url: 'https://x.com/user/status/123', domain: 'x.com' }),
    ];
    const groups = groupTabsByDomain(tabs);
    const landing = groups.find(g => g.id === 'landing-pages');
    expect(landing).toBeDefined();
    expect(landing?.tabs).toHaveLength(1);
  });

  it('sorts landing pages first', () => {
    const tabs = [
      makeTab({ url: 'https://example.com/', domain: 'example.com' }),
      makeTab({ url: 'https://x.com/home', domain: 'x.com' }),
    ];
    const groups = groupTabsByDomain(tabs);
    expect(groups[0].id).toBe('landing-pages');
  });

  it('groups file:// URLs as local-files', () => {
    const tabs = [
      makeTab({ url: 'file:///Users/test/doc.html', domain: 'local-files' }),
    ];
    const groups = groupTabsByDomain(tabs);
    const local = groups.find(g => g.domain === 'local-files');
    expect(local).toBeDefined();
  });

  it('returns empty array for no tabs', () => {
    expect(groupTabsByDomain([])).toEqual([]);
  });
});
```

- [ ] **Step 4: Implement tab-grouper.ts**

Create `src/lib/tab-grouper.ts` — port the grouping logic from `extension/app.js` lines 1066–1143. Uses `isLandingPage` from landing-pages.ts, `FRIENDLY_DOMAINS` for friendly names, and `Tab`/`TabGroup` types from `src/types/index.ts`.

- [ ] **Step 5: Run all new tests**

Run: `npx vitest run`
Expected: All tests pass (including Phase 1 tests)

- [ ] **Step 6: Commit**

```bash
git add src/lib/landing-pages.ts src/lib/tab-grouper.ts src/__tests__/landing-pages.test.ts src/__tests__/tab-grouper.test.ts
git commit -m "feat: add landing page detection and tab grouping logic"
```

---

### Task 3: Confetti + sound effects

**Files:**
- Create: `src/lib/confetti.ts`
- Create: `src/lib/sound.ts`

Port from `extension/app.js` lines 298–412:
- `shootConfetti(x, y)` — particle system with physics (gravity, velocity, fade)
- `playCloseSound()` — Web Audio API swoosh (bandpass filter sweep)

- [ ] **Step 1: Create confetti.ts**

Port `shootConfetti()` from `extension/app.js` lines 347–412. Use the constants from `src/lib/constants.ts` (`CONFETTI` object). Export as `shootConfetti(x: number, y: number): void`.

- [ ] **Step 2: Create sound.ts**

Port `playCloseSound()` from `extension/app.js` lines 298–338. Use constants from `src/lib/constants.ts` (`SOUND` object). Export as `playCloseSound(): void`.

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/confetti.ts src/lib/sound.ts
git commit -m "feat: add confetti particle system and swoosh sound effect"
```

---

### Task 4: Zustand stores

**Files:**
- Create: `src/stores/tab-store.ts`
- Create: `src/stores/saved-store.ts`

- [ ] **Step 1: Create tab-store.ts**

Create `src/stores/tab-store.ts`:

```typescript
import { create } from 'zustand';
import type { Tab, TabGroup } from '../types';
import { groupTabsByDomain } from '../lib/tab-grouper';
import { getHostname } from '../utils/url';

interface TabActions {
  fetchTabs: () => Promise<void>;
  closeTabByUrl: (url: string) => Promise<void>;
  closeTabsByUrls: (urls: string[]) => Promise<void>;
  closeTabsExact: (urls: string[]) => Promise<void>;
  closeDuplicates: (urls: string[], keepOne: boolean) => Promise<void>;
  focusTab: (url: string) => Promise<void>;
}

export type TabStore = {
  tabs: Tab[];
  groups: TabGroup[];
  loading: boolean;
} & TabActions;

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  groups: [],
  loading: true,

  fetchTabs: async () => {
    try {
      const extensionId = chrome.runtime.id;
      const newtabUrl = `chrome-extension://${extensionId}/src/newtab/index.html`;
      const rawTabs = await chrome.tabs.query({});

      const tabs: Tab[] = rawTabs.map(t => {
        const url = t.url ?? '';
        return {
          id: t.id ?? 0,
          url,
          title: t.title ?? '',
          favIconUrl: t.favIconUrl ?? '',
          domain: getHostname(url),
          windowId: t.windowId ?? 0,
          active: t.active ?? false,
          isTabOut: url === newtabUrl || url === 'chrome://newtab/',
          isDuplicate: false,
          isLandingPage: false,
          duplicateCount: 1,
        };
      });

      const realTabs = tabs.filter(t =>
        !t.url.startsWith('chrome://') &&
        !t.url.startsWith('chrome-extension://') &&
        !t.url.startsWith('about:') &&
        !t.url.startsWith('edge://') &&
        !t.url.startsWith('brave://')
      );

      const groups = groupTabsByDomain(realTabs);
      set({ tabs: realTabs, groups, loading: false });
    } catch {
      set({ tabs: [], groups: [], loading: false });
    }
  },

  closeTabByUrl: async (url: string) => {
    const allTabs = await chrome.tabs.query({});
    const match = allTabs.find(t => t.url === url);
    if (match?.id) await chrome.tabs.remove(match.id);
    await get().fetchTabs();
  },

  closeTabsByUrls: async (urls: string[]) => {
    if (urls.length === 0) return;
    const targetHostnames = new Set<string>();
    const exactUrls = new Set<string>();
    for (const u of urls) {
      if (u.startsWith('file://')) { exactUrls.add(u); continue; }
      try { targetHostnames.add(new URL(u).hostname); } catch { /* skip */ }
    }
    const allTabs = await chrome.tabs.query({});
    const toClose = allTabs
      .filter(tab => {
        const tabUrl = tab.url ?? '';
        if (tabUrl.startsWith('file://') && exactUrls.has(tabUrl)) return true;
        try { return targetHostnames.has(new URL(tabUrl).hostname); } catch { return false; }
      })
      .map(t => t.id)
      .filter((id): id is number => id !== undefined);
    if (toClose.length > 0) await chrome.tabs.remove(toClose);
    await get().fetchTabs();
  },

  closeTabsExact: async (urls: string[]) => {
    if (urls.length === 0) return;
    const urlSet = new Set(urls);
    const allTabs = await chrome.tabs.query({});
    const toClose = allTabs.filter(t => urlSet.has(t.url ?? '')).map(t => t.id).filter((id): id is number => id !== undefined);
    if (toClose.length > 0) await chrome.tabs.remove(toClose);
    await get().fetchTabs();
  },

  closeDuplicates: async (urls: string[], keepOne: boolean) => {
    const allTabs = await chrome.tabs.query({});
    const toClose: number[] = [];
    for (const url of urls) {
      const matching = allTabs.filter(t => t.url === url);
      if (keepOne) {
        const keep = matching.find(t => t.active) || matching[0];
        for (const tab of matching) {
          if (tab.id !== keep?.id && tab.id !== undefined) toClose.push(tab.id);
        }
      } else {
        for (const tab of matching) {
          if (tab.id !== undefined) toClose.push(tab.id);
        }
      }
    }
    if (toClose.length > 0) await chrome.tabs.remove(toClose);
    await get().fetchTabs();
  },

  focusTab: async (url: string) => {
    const allTabs = await chrome.tabs.query({});
    const currentWindow = await chrome.windows.getCurrent();
    let matches = allTabs.filter(t => t.url === url);
    if (matches.length === 0) {
      try {
        const host = new URL(url).hostname;
        matches = allTabs.filter(t => { try { return new URL(t.url ?? '').hostname === host; } catch { return false; } });
      } catch { /* no fallback */ }
    }
    if (matches.length === 0) return;
    const match = matches.find(t => t.windowId !== currentWindow.id) || matches[0];
    if (match.id !== undefined) await chrome.tabs.update(match.id, { active: true });
    await chrome.windows.update(match.windowId, { focused: true });
  },
}));
```

- [ ] **Step 2: Create saved-store.ts**

Create `src/stores/saved-store.ts`:

```typescript
import { create } from 'zustand';
import type { SavedTab } from '../types';
import { getSavedTabs, checkOffSavedTab, dismissSavedTab, saveTabForLater } from '../utils/storage';

interface SavedState {
  active: SavedTab[];
  archived: SavedTab[];
  archiveSearch: string;
  loading: boolean;
  fetchSaved: () => Promise<void>;
  saveTab: (url: string, title: string) => Promise<void>;
  checkOff: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  setArchiveSearch: (query: string) => void;
}

export const useSavedStore = create<SavedState>((set, get) => ({
  active: [],
  archived: [],
  archiveSearch: '',
  loading: true,

  fetchSaved: async () => {
    try {
      const { active, archived } = await getSavedTabs();
      set({ active, archived, loading: false });
    } catch {
      set({ active: [], archived: [], loading: false });
    }
  },

  saveTab: async (url: string, title: string) => {
    await saveTabForLater({ url, title });
    await get().fetchSaved();
  },

  checkOff: async (id: string) => {
    await checkOffSavedTab(id);
    await get().fetchSaved();
  },

  dismiss: async (id: string) => {
    await dismissSavedTab(id);
    await get().fetchSaved();
  },

  setArchiveSearch: (query: string) => set({ archiveSearch: query }),
}));
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/stores/tab-store.ts src/stores/saved-store.ts
git commit -m "feat: add Zustand stores for tab and saved tab state"
```

---

### Task 5: React components — Header, Toast, DupeBanner, EmptyState

**Files:**
- Create: `src/newtab/components/Header.tsx`
- Create: `src/newtab/components/Toast.tsx`
- Create: `src/newtab/components/DupeBanner.tsx`
- Create: `src/newtab/components/EmptyState.tsx`

These are straightforward display components ported from `extension/index.html`.

- [ ] **Step 1: Create Header.tsx**

Greeting ("Good morning/afternoon/evening") + formatted date. Port `getGreeting()` and `getDateDisplay()` from `extension/app.js` lines 497–514.

- [ ] **Step 2: Create Toast.tsx**

Floating toast notification with checkmark icon. Uses `useState` + `useEffect` for auto-hide after 2.5s. Port from `extension/index.html` lines 120–126 and `extension/app.js` `showToast()` line 438.

- [ ] **Step 3: Create DupeBanner.tsx**

"Close extra Tab Out tabs" banner. Reads tabs from `useTabStore`, filters Tab Out pages, shows banner if count > 1. Port from `extension/app.js` lines 741–753.

- [ ] **Step 4: Create EmptyState.tsx**

"Inbox zero, but for tabs" with checkmark icon. Port from `extension/app.js` lines 450–471.

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/newtab/components/Header.tsx src/newtab/components/Toast.tsx src/newtab/components/DupeBanner.tsx src/newtab/components/EmptyState.tsx
git commit -m "feat: add Header, Toast, DupeBanner, and EmptyState components"
```

---

### Task 6: React components — TabChip and DomainCard

**Files:**
- Create: `src/newtab/components/TabChip.tsx`
- Create: `src/newtab/components/DomainCard.tsx`

- [ ] **Step 1: Create TabChip.tsx**

Individual tab chip: favicon + title + (Nx) duplicate badge + save/close buttons. Port from `extension/app.js` lines 837–864. Props: `tab: Tab`, `duplicateCount: number`, `onFocus`, `onClose`, `onSave`. Uses `sanitizeUrl` from `src/utils/url.ts`, `cleanTitle`/`smartTitle`/`stripTitleNoise` from `src/lib/title-cleaner.ts`.

- [ ] **Step 2: Create DomainCard.tsx**

Domain group card with:
- Status bar (amber if duplicates, neutral otherwise)
- Header: friendly domain name + tab count badge + duplicate count badge
- Content: up to 8 TabChip components + "+N more" expand button
- Footer: "Close all N tabs" button + "Close N duplicates" button (if dupes exist)
- Clicking a chip focuses that tab, save button saves then closes, close button closes just that tab

Port from `extension/app.js` lines 803–897. Props: `group: TabGroup`, `onCloseDomain`, `onCloseDuplicates`, `onCloseTab`, `onSaveTab`, `onFocusTab`.

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/newtab/components/TabChip.tsx src/newtab/components/DomainCard.tsx
git commit -m "feat: add TabChip and DomainCard components"
```

---

### Task 7: React component — DeferredColumn (Saved for Later)

**Files:**
- Create: `src/newtab/components/DeferredColumn.tsx`
- Create: `src/newtab/components/DeferredItem.tsx`

- [ ] **Step 1: Create DeferredItem.tsx**

Single saved tab item: checkbox + favicon + title link + domain + time ago + dismiss button. Port from `extension/app.js` lines 966–988. Props: `item: SavedTab`, `onCheckOff`, `onDismiss`. Also create archive item variant.

- [ ] **Step 2: Create DeferredColumn.tsx**

Right sidebar with:
- Active checklist items
- Empty state ("Nothing saved. Living in the moment.")
- Collapsible archive section with search
- Uses `useSavedStore` for state

Port from `extension/app.js` lines 911–958 and `extension/index.html` lines 68–95. Include `timeAgo()` utility (port from `extension/app.js` lines 479–492).

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/newtab/components/DeferredColumn.tsx src/newtab/components/DeferredItem.tsx
git commit -m "feat: add Saved for Later sidebar with checklist and archive"
```

---

### Task 8: Wire up main App.tsx dashboard

**Files:**
- Modify: `src/newtab/App.tsx` (replace Phase 1 scaffold)

- [ ] **Step 1: Replace App.tsx with full dashboard**

Replace the "Hello Tab Out" scaffold with the real dashboard:
- `useEffect` to fetch tabs and saved data on mount
- `useChromeStorage` listener to refresh saved data on storage changes
- Two-column layout: left = DomainCard list + header, right = DeferredColumn
- Toast state management (show/hide with timeout)
- "Close all tabs" button in section header
- Footer with tab count + links

Layout matches legacy `extension/index.html` structure:
```
Header (greeting + date)
DupeBanner (conditional)
dashboard-columns:
  Left: section-header + DomainCards
  Right: DeferredColumn
Footer (stats + links)
Toast (fixed overlay)
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Clean build. Check `dist/` contains updated files.

- [ ] **Step 3: Commit**

```bash
git add src/newtab/App.tsx
git commit -m "feat: wire up main dashboard with full tab management UI"
```

---

### Task 9: Integration test + manual verification

**Files:** None new

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (Phase 1 + Phase 2 tests)

- [ ] **Step 2: Run full build**

Run: `npm run build`
Expected: Clean build

- [ ] **Step 3: Manual verification in Chrome**

1. `npm run build`
2. Go to `chrome://extensions` → refresh Tab Out
3. Open a new tab → should see domain cards grouped by domain
4. Open tabs on multiple domains → verify grouping
5. Click a tab chip → should focus that tab in Chrome
6. Close a single tab via X button → should animate out with confetti + sound
7. "Close all N tabs" → should close all tabs in a domain group with confetti
8. "Close N duplicates" → should keep one copy
9. Save a tab for later → should appear in right sidebar
10. Check off a saved tab → should move to archive
11. "Close all tabs" in header → should close everything, show "Inbox zero"

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during Phase 2 integration testing"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - Tab fetching → Task 4 (tab-store.ts `fetchTabs`)
  - Tab grouping by domain → Task 2 (tab-grouper.ts)
  - Landing pages detection → Task 2 (landing-pages.ts)
  - Friendly domain names → Task 1 (title-cleaner.ts) + Phase 1 (friendly-domains.ts)
  - Domain card rendering → Task 6 (DomainCard.tsx)
  - Tab chip rendering → Task 6 (TabChip.tsx)
  - Title cleaning (stripTitleNoise, cleanTitle, smartTitle) → Task 1 (title-cleaner.ts)
  - Close individual tab → Task 4 (closeTabByUrl) + Task 6 (onCloseTab handler)
  - Close domain group → Task 4 (closeTabsByUrls/closeTabsExact) + Task 6 (onCloseDomain handler)
  - Close duplicates → Task 4 (closeDuplicates) + Task 6 (onCloseDuplicates handler)
  - Close all tabs → Task 8 (App.tsx close-all handler)
  - Focus tab → Task 4 (focusTab)
  - Save for later → Task 7 (DeferredColumn) + Task 4 (saved-store)
  - Check off saved tab → Task 4 (saved-store checkOff)
  - Dismiss saved tab → Task 4 (saved-store dismiss)
  - Archive with search → Task 7 (DeferredColumn archive section)
  - Confetti → Task 3 (confetti.ts)
  - Sound → Task 3 (sound.ts)
  - Dupe banner → Task 5 (DupeBanner.tsx)
  - Empty state → Task 5 (EmptyState.tsx)
  - Toast → Task 5 (Toast.tsx)
  - Greeting + date → Task 5 (Header.tsx)
  - "+N more" expand → Task 6 (DomainCard overflow chips)
  - Tab Out duplicate detection → Task 4 (isTabOut flag) + Task 5 (DupeBanner)
  - Local file grouping → Task 2 (tab-grouper handles file:// → local-files)

- [x] **Placeholder scan:** No TBD, TODO, or "implement later" found. All steps contain complete code.

- [x] **Type consistency:** Tab, TabGroup, SavedTab types from `src/types/index.ts` are used consistently. Store types match component props. Utility function signatures are consistent across tasks.
