import { describe, it, expect } from 'vitest';
import { groupTabsByDomain } from '../lib/tab-grouper';
import type { Tab } from '../types';

// ─── Test helpers ──────────────────────────────────────────────────

function makeTab(overrides: Partial<Tab> & Pick<Tab, 'id' | 'url'>): Tab {
  return {
    title: 'Test Tab',
    favIconUrl: '',
    domain: '',
    windowId: 1,
    active: false,
    isTabOut: false,
    isDuplicate: false,
    isLandingPage: false,
    duplicateCount: 0,
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('groupTabsByDomain', () => {
  it('returns empty array for empty input', () => {
    expect(groupTabsByDomain([])).toEqual([]);
  });

  it('groups tabs by hostname', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://github.com/user/repo1' }),
      makeTab({ id: 2, url: 'https://github.com/user/repo2' }),
      makeTab({ id: 3, url: 'https://stackoverflow.com/questions/1' }),
    ];

    const groups = groupTabsByDomain(tabs);

    expect(groups).toHaveLength(2);

    const githubGroup = groups.find((g) => g.domain === 'github.com');
    const soGroup = groups.find((g) => g.domain === 'stackoverflow.com');

    expect(githubGroup).toBeDefined();
    expect(githubGroup!.tabs).toHaveLength(2);
    expect(soGroup).toBeDefined();
    expect(soGroup!.tabs).toHaveLength(1);
  });

  it('places landing pages in their own group', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://github.com/' }),           // landing
      makeTab({ id: 2, url: 'https://github.com/user/repo' }),  // not landing
      makeTab({ id: 3, url: 'https://x.com/home' }),            // landing
    ];

    const groups = groupTabsByDomain(tabs);

    const landingGroup = groups.find((g) => g.domain === '__landing-pages__');
    const githubGroup = groups.find((g) => g.domain === 'github.com');

    expect(landingGroup).toBeDefined();
    expect(landingGroup!.tabs).toHaveLength(2); // github.com/ and x.com/home
    expect(githubGroup).toBeDefined();
    expect(githubGroup!.tabs).toHaveLength(1); // github.com/user/repo
  });

  it('sorts landing pages group first', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://stackoverflow.com/questions/1' }),
      makeTab({ id: 2, url: 'https://x.com/home' }),
      makeTab({ id: 3, url: 'https://example.com/page' }),
    ];

    const groups = groupTabsByDomain(tabs);

    expect(groups[0].domain).toBe('__landing-pages__');
  });

  it('sorts landing-page domains (priority) before non-landing domains', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/page1' }),
      makeTab({ id: 2, url: 'https://github.com/user/repo' }),
      makeTab({ id: 3, url: 'https://x.com/someuser/status' }),
    ];

    const groups = groupTabsByDomain(tabs);

    // Landing-page domains (github.com, x.com) should sort before example.com
    const domains = groups.map((g) => g.domain);
    const githubIdx = domains.indexOf('github.com');
    const xIdx = domains.indexOf('x.com');
    const exampleIdx = domains.indexOf('example.com');

    expect(githubIdx).toBeLessThan(exampleIdx);
    expect(xIdx).toBeLessThan(exampleIdx);
  });

  it('handles file:// URLs as local-files group', () => {
    const tabs = [
      makeTab({ id: 1, url: 'file:///Users/test/document.html' }),
      makeTab({ id: 2, url: 'file:///Users/test/other.pdf' }),
      makeTab({ id: 3, url: 'https://example.com/page' }),
    ];

    const groups = groupTabsByDomain(tabs);

    const localGroup = groups.find((g) => g.domain === 'local-files');
    expect(localGroup).toBeDefined();
    expect(localGroup!.tabs).toHaveLength(2);
    expect(localGroup!.friendlyName).toBe('Local Files');
  });

  it('assigns correct friendly names from FRIENDLY_DOMAINS', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://github.com/user/repo' }),
    ];

    const groups = groupTabsByDomain(tabs);
    expect(groups[0].friendlyName).toBe('GitHub');
  });

  it('detects duplicate tabs and sets color and flags', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/page' }),
      makeTab({ id: 2, url: 'https://example.com/page' }),
    ];

    const groups = groupTabsByDomain(tabs);

    expect(groups[0].hasDuplicates).toBe(true);
    expect(groups[0].duplicateCount).toBe(1);
    expect(groups[0].color).toBe('#DFAB01');
  });

  it('uses default color when no duplicates', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/page1' }),
      makeTab({ id: 2, url: 'https://example.com/page2' }),
    ];

    const groups = groupTabsByDomain(tabs);

    expect(groups[0].hasDuplicates).toBe(false);
    expect(groups[0].duplicateCount).toBe(0);
    expect(groups[0].color).toBe('#4DAB9A');
  });

  it('assigns sequential order values', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/a' }),
      makeTab({ id: 2, url: 'https://other.com/b' }),
      makeTab({ id: 3, url: 'https://third.com/c' }),
    ];

    const groups = groupTabsByDomain(tabs);

    const orders = groups.map((g) => g.order);
    expect(orders).toEqual([0, 1, 2]);
  });

  it('sets collapsed to false for all groups', () => {
    const tabs = [
      makeTab({ id: 1, url: 'https://example.com/a' }),
    ];

    const groups = groupTabsByDomain(tabs);

    for (const group of groups) {
      expect(group.collapsed).toBe(false);
    }
  });

  it('skips malformed URLs without crashing', () => {
    const tabs = [
      makeTab({ id: 1, url: 'not-a-url' }),
      makeTab({ id: 2, url: 'https://example.com/valid' }),
    ];

    const groups = groupTabsByDomain(tabs);

    // Only the valid URL should produce a group
    expect(groups).toHaveLength(1);
    expect(groups[0].domain).toBe('example.com');
  });

  // ─── customOrder parameter ──────────────────────────────────────────

  describe('customOrder', () => {
    it('behaves the same when customOrder is undefined', () => {
      const tabs = [
        makeTab({ id: 1, url: 'https://github.com/user/repo' }),
        makeTab({ id: 2, url: 'https://example.com/page' }),
        makeTab({ id: 3, url: 'https://x.com/status' }),
      ];

      const withoutOrder = groupTabsByDomain(tabs);
      const withEmpty = groupTabsByDomain(tabs, {});

      const domainsWithout = withoutOrder.map((g) => g.domain);
      const domainsWith = withEmpty.map((g) => g.domain);

      expect(domainsWith).toEqual(domainsWithout);
    });

    it('applies custom order when all domains are ordered', () => {
      const tabs = [
        makeTab({ id: 1, url: 'https://github.com/user/repo' }),
        makeTab({ id: 2, url: 'https://example.com/page' }),
        makeTab({ id: 3, url: 'https://x.com/status' }),
      ];

      const groups = groupTabsByDomain(tabs, {
        'example.com': 0,
        'x.com': 1,
        'github.com': 2,
      });

      const domains = groups.map((g) => g.domain);
      expect(domains).toEqual(['example.com', 'x.com', 'github.com']);
    });

    it('sorts ordered domains before unordered ones', () => {
      const tabs = [
        makeTab({ id: 1, url: 'https://github.com/user/repo' }),
        makeTab({ id: 2, url: 'https://example.com/page' }),
        makeTab({ id: 3, url: 'https://x.com/status' }),
      ];

      // Only order example.com; github.com and x.com should sort after
      const groups = groupTabsByDomain(tabs, {
        'example.com': 0,
      });

      const domains = groups.map((g) => g.domain);
      expect(domains[0]).toBe('example.com');
      // github.com and x.com come after, in default sort order
      expect(domains.length).toBe(3);
    });

    it('preserves landing-page-first rule for unordered domains', () => {
      const tabs = [
        makeTab({ id: 1, url: 'https://x.com/home' }),           // landing
        makeTab({ id: 2, url: 'https://example.com/page' }),      // normal
        makeTab({ id: 3, url: 'https://github.com/user/repo' }),  // priority domain
      ];

      // Order only example.com; landing pages and priority domains
      // without custom order should use default sort
      const groups = groupTabsByDomain(tabs, {
        'example.com': 2,
      });

      const domains = groups.map((g) => g.domain);
      // example.com has custom order, but custom-ordered items sort BEFORE unordered
      // So example.com goes first because it has a custom order
      expect(domains[0]).toBe('example.com');
    });
  });
});
