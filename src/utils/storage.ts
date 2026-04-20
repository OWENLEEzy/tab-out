import type { StorageSchema, SavedTab, Workspace, AppSettings } from '../types';

const CURRENT_SCHEMA_VERSION = 2;
const STORAGE_KEYS = [
  'schemaVersion',
  'deferred',
  'workspaces',
  'settings',
  'groupOrder',
] as const;

/**
 * Serial write queue to prevent race conditions during rapid consecutive
 * read-modify-write operations (e.g., checking off multiple saved items).
 * Without this, overlapping reads can cause data loss.
 */
let writeQueue: Promise<void> = Promise.resolve();

function queuedWrite(fn: () => Promise<void>): Promise<void> {
  const task = writeQueue.then(fn);
  writeQueue = task.catch(() => {});
  return task;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  soundEnabled: true,
  confettiEnabled: true,
  maxChipsVisible: 8,
  customGroups: [],
  landingPagePatterns: [],
};

const EMPTY_SCHEMA: StorageSchema = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  deferred: [],
  workspaces: [],
  settings: DEFAULT_SETTINGS,
  groupOrder: {},
};

/**
 * Migrate storage data from older schema versions.
 * Applies migrations sequentially: v0→v1, v1→v2, etc.
 */
function migrate(data: Partial<StorageSchema>): StorageSchema {
  const version = data.schemaVersion ?? 0;

  if (version < 1) {
    // v0 → v1: initial schema
    // Existing "deferred" data from vanilla JS version may exist
    // under the key "deferred" with shape: { id, url, title, savedAt, completed, dismissed }
    // The new schema is compatible — no transformation needed.
  }

  if (version < 2) {
    // v1 → v2: add groupOrder for drag-and-drop persistence
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    deferred: Array.isArray(data.deferred) ? data.deferred : [],
    workspaces: Array.isArray(data.workspaces) ? data.workspaces : [],
    settings: { ...DEFAULT_SETTINGS, ...data.settings },
    groupOrder: data.groupOrder ?? {},
  };
}

async function readStorageSnapshot(): Promise<Partial<StorageSchema>> {
  const result = await chrome.storage.local.get([...STORAGE_KEYS]);

  return {
    schemaVersion: result.schemaVersion as number | undefined,
    deferred: result.deferred as SavedTab[] | undefined,
    workspaces: result.workspaces as Workspace[] | undefined,
    settings: result.settings as AppSettings | undefined,
    groupOrder: result.groupOrder as Record<string, number> | undefined,
  };
}

async function persistStorage(data: StorageSchema): Promise<void> {
  await chrome.storage.local.set({
    schemaVersion: data.schemaVersion,
    deferred: data.deferred,
    workspaces: data.workspaces,
    settings: data.settings,
    groupOrder: data.groupOrder,
  });
}

/**
 * Read the full storage schema, applying migrations if needed.
 */
export async function readStorage(): Promise<StorageSchema> {
  return migrate(await readStorageSnapshot());
}

/**
 * Replace the full storage schema. Prefer updateStorage for read-modify-write flows.
 */
export async function writeStorage(data: StorageSchema): Promise<void> {
  await queuedWrite(async () => {
    await persistStorage(data);
  });
}

/**
 * Safely update storage by reading the latest state inside the write queue.
 * This prevents stale read snapshots from overwriting unrelated keys.
 */
export async function updateStorage(
  updater: (current: StorageSchema) => StorageSchema | Promise<StorageSchema>
): Promise<StorageSchema> {
  let nextState = EMPTY_SCHEMA;

  await queuedWrite(async () => {
    const current = migrate(await readStorageSnapshot());
    nextState = migrate(await updater(current));
    await persistStorage(nextState);
  });

  return nextState;
}

/**
 * Get saved tabs (deferred items), split into active and archived.
 * Filters out dismissed items.
 */
export async function getSavedTabs(): Promise<{
  active: SavedTab[];
  archived: SavedTab[];
}> {
  const storage = await readStorage();
  const visible = storage.deferred.filter((t) => !t.dismissed);
  return {
    active: visible.filter((t) => !t.completed),
    archived: visible.filter((t) => t.completed),
  };
}

/**
 * Save a tab for later. Creates a new SavedTab entry.
 */
export async function saveTabForLater(tab: {
  url: string;
  title: string;
}): Promise<SavedTab> {
  let domain = '';
  try {
    domain = new URL(tab.url).hostname;
  } catch {
    // Leave domain empty for malformed URLs
  }

  const savedTab: SavedTab = {
    id: crypto.randomUUID(),
    url: tab.url,
    title: tab.title,
    domain,
    savedAt: new Date().toISOString(),
    completed: false,
    dismissed: false,
  };

  await updateStorage((storage) => ({
    ...storage,
    deferred: [...storage.deferred, savedTab],
  }));
  return savedTab;
}

/**
 * Mark a saved tab as completed (checked off → archive).
 */
export async function checkOffSavedTab(id: string): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    deferred: storage.deferred.map((t) =>
      t.id === id
        ? { ...t, completed: true, completedAt: new Date().toISOString() }
        : t
    ),
  }));
}

/**
 * Dismiss a saved tab (remove from all views).
 */
export async function dismissSavedTab(id: string): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    deferred: storage.deferred.map((t) =>
      t.id === id ? { ...t, dismissed: true } : t
    ),
  }));
}

/**
 * Read app settings from storage.
 */
export async function readSettings(): Promise<AppSettings> {
  const storage = await readStorage();
  return storage.settings;
}

/**
 * Update app settings in storage.
 */
export async function writeSettings(
  settings: Partial<AppSettings>
): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    settings: { ...storage.settings, ...settings },
  }));
}

/**
 * Read custom group ordering from storage.
 */
export async function readGroupOrder(): Promise<Record<string, number>> {
  const storage = await readStorage();
  return storage.groupOrder;
}

/**
 * Persist custom group ordering from drag-and-drop.
 */
export async function writeGroupOrder(order: Record<string, number>): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    groupOrder: order,
  }));
}

/**
 * Clear custom group ordering, resetting to default alphabetical order.
 */
export async function clearGroupOrder(): Promise<void> {
  await writeGroupOrder({});
}

/**
 * Read all workspaces from storage.
 */
export async function readWorkspaces(): Promise<Workspace[]> {
  const storage = await readStorage();
  return storage.workspaces;
}

/**
 * Replace all workspaces in storage.
 */
export async function writeWorkspaces(workspaces: Workspace[]): Promise<void> {
  await updateStorage((storage) => ({
    ...storage,
    workspaces,
  }));
}

// Export for testing
export { EMPTY_SCHEMA, CURRENT_SCHEMA_VERSION };
