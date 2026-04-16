import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readStorage, saveTabForLater, checkOffSavedTab, dismissSavedTab, writeGroupOrder } from '../utils/storage';

// Mock chrome.storage.local
const storage: Record<string, unknown> = {};

beforeEach(() => {
  Object.keys(storage).forEach((k) => delete storage[k]);
});

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn((keys: string[]) => {
        const result: Record<string, unknown> = {};
        (Array.isArray(keys) ? keys : [keys]).forEach((k) => {
          if (k in storage) result[k] = storage[k];
        });
        return Promise.resolve(result);
      }),
      set: vi.fn((items: Record<string, unknown>) => {
        Object.assign(storage, items);
        return Promise.resolve();
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://fake-id/${path}`),
  },
});

describe('readStorage', () => {
  it('returns default schema when storage is empty', async () => {
    const result = await readStorage();
    expect(result.schemaVersion).toBe(2);
    expect(result.deferred).toEqual([]);
    expect(result.workspaces).toEqual([]);
    expect(result.settings.theme).toBe('system');
    expect(result.groupOrder).toEqual({});
  });

  it('migrates from v0 (no schemaVersion) to v2', async () => {
    storage['deferred'] = [{ id: '1', url: 'https://example.com', title: 'Test', domain: 'example.com', savedAt: '2026-01-01T00:00:00.000Z', completed: false, dismissed: false }];
    const result = await readStorage();
    expect(result.schemaVersion).toBe(2);
    expect(result.deferred).toHaveLength(1);
    expect(result.groupOrder).toEqual({});
  });

  it('migrates from v1 (no groupOrder) to v2', async () => {
    storage['schemaVersion'] = 1;
    storage['deferred'] = [];
    storage['workspaces'] = [];
    storage['settings'] = { theme: 'dark', soundEnabled: true, confettiEnabled: true, maxChipsVisible: 8, customGroups: [], landingPagePatterns: [] };
    const result = await readStorage();
    expect(result.schemaVersion).toBe(2);
    expect(result.groupOrder).toEqual({});
  });

  it('preserves existing groupOrder from v2', async () => {
    storage['schemaVersion'] = 2;
    storage['deferred'] = [];
    storage['workspaces'] = [];
    storage['settings'] = { theme: 'system', soundEnabled: true, confettiEnabled: true, maxChipsVisible: 8, customGroups: [], landingPagePatterns: [] };
    storage['groupOrder'] = { 'github.com': 0, 'google.com': 1 };
    const result = await readStorage();
    expect(result.groupOrder).toEqual({ 'github.com': 0, 'google.com': 1 });
  });
});

describe('saveTabForLater', () => {
  it('creates a SavedTab and persists it', async () => {
    const saved = await saveTabForLater({ url: 'https://github.com/test', title: 'Test Repo' });
    expect(saved.url).toBe('https://github.com/test');
    expect(saved.title).toBe('Test Repo');
    expect(saved.domain).toBe('github.com');
    expect(saved.completed).toBe(false);
    expect(saved.dismissed).toBe(false);

    const storage2 = await readStorage();
    expect(storage2.deferred).toHaveLength(1);
  });
});

describe('checkOffSavedTab', () => {
  it('marks a saved tab as completed', async () => {
    const saved = await saveTabForLater({ url: 'https://example.com', title: 'Test' });
    await checkOffSavedTab(saved.id);
    const result = await readStorage();
    expect(result.deferred[0].completed).toBe(true);
    expect(result.deferred[0].completedAt).toBeDefined();
  });
});

describe('dismissSavedTab', () => {
  it('marks a saved tab as dismissed', async () => {
    const saved = await saveTabForLater({ url: 'https://example.com', title: 'Test' });
    await dismissSavedTab(saved.id);
    const result = await readStorage();
    expect(result.deferred[0].dismissed).toBe(true);
  });
});

describe('writeGroupOrder', () => {
  it('persists group ordering to storage', async () => {
    await writeGroupOrder({ 'github.com': 1, 'google.com': 0 });
    const result = await readStorage();
    expect(result.groupOrder).toEqual({ 'github.com': 1, 'google.com': 0 });
  });
});
