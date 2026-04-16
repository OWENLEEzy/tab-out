import React, { useCallback, useMemo, useState } from 'react';
import type { TabGroup } from '../../types';
import { TabChip } from './TabChip';

// ─── Types ────────────────────────────────────────────────────────────

interface DomainCardProps {
  group: TabGroup;
  dragHandleProps?: Record<string, unknown>;
  onCloseDomain: (group: TabGroup) => void;
  onCloseDuplicates: (urls: string[]) => void;
  onCloseTab: (url: string) => void;
  onSaveTab: (url: string, title: string) => void;
  onFocusTab: (url: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────

const MAX_VISIBLE_CHIPS = 8;

// ─── SVG Icons ────────────────────────────────────────────────────────

function TabsIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
      />
    </svg>
  );
}

function CloseAllIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  );
}

function DedupIcon(): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export function DomainCard({
  group,
  dragHandleProps,
  onCloseDomain,
  onCloseDuplicates,
  onCloseTab,
  onSaveTab,
  onFocusTab,
}: DomainCardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  const tabs = group.tabs || [];
  const tabCount = tabs.length;
  const displayName = group.friendlyName || group.domain;

  // Count URL occurrences to detect duplicates
  const { urlCounts, dupeUrls, totalExtras } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of tabs) {
      counts[tab.url] = (counts[tab.url] || 0) + 1;
    }
    const dupes = Object.entries(counts).filter(([, c]) => c > 1);
    const extras = dupes.reduce((sum, [, c]) => sum + c - 1, 0);
    return { urlCounts: counts, dupeUrls: dupes, totalExtras: extras };
  }, [tabs]);

  const hasDupes = dupeUrls.length > 0;

  // Deduplicate for display: show each URL once, with (Nx) badge if duplicated
  const uniqueTabs = useMemo(() => {
    const seen = new Set<string>();
    return tabs.filter((tab) => {
      if (seen.has(tab.url)) return false;
      seen.add(tab.url);
      return true;
    });
  }, [tabs]);

  const visibleTabs = uniqueTabs.slice(0, MAX_VISIBLE_CHIPS);
  const hiddenTabs = uniqueTabs.slice(MAX_VISIBLE_CHIPS);
  const extraCount = hiddenTabs.length;

  // ─── Handlers ────────────────────────────────────────────────────────

  const handleCloseDomain = useCallback(() => {
    onCloseDomain(group);
  }, [onCloseDomain, group]);

  const handleCloseDuplicates = useCallback(() => {
    const urls = dupeUrls.map(([url]) => url);
    onCloseDuplicates(urls);
  }, [onCloseDuplicates, dupeUrls]);

  const handleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleCloseTab = useCallback(
    (url: string) => {
      onCloseTab(url);
    },
    [onCloseTab],
  );

  const handleSaveTab = useCallback(
    (url: string, title: string) => {
      onSaveTab(url, title);
    },
    [onSaveTab],
  );

  const handleFocusTab = useCallback(
    (url: string) => {
      onFocusTab(url);
    },
    [onFocusTab],
  );

  // ─── Render ──────────────────────────────────────────────────────────

  const statusBarColor = hasDupes ? 'bg-accent-amber' : 'bg-accent-sage';

  return (
    <div className="rounded-card bg-card-light dark:bg-card-dark shadow-card transition-shadow duration-200 hover:shadow-card-hover overflow-hidden">
      {/* Status bar — 3px top accent */}
      <div className={`h-[3px] ${statusBarColor}`} />

      <div className="p-4">
        {/* Header: domain name + badges — drag handle when DnD is active */}
        <div
          className="mb-3 flex flex-wrap items-center gap-2 cursor-grab active:cursor-grabbing"
          {...dragHandleProps}
        >
          {dragHandleProps && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4 text-text-secondary shrink-0"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
          <h3 className="font-heading text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
            {displayName}
          </h3>

          {/* Tab count badge */}
          <span className="inline-flex items-center gap-1 rounded-chip bg-surface-light dark:bg-surface-dark px-2 py-0.5 text-xs text-text-secondary font-body">
            <TabsIcon />
            {tabCount} tab{tabCount !== 1 ? 's' : ''} open
          </span>

          {/* Duplicate count badge */}
          {hasDupes && (
            <span className="inline-flex items-center rounded-chip bg-accent-amber/10 px-2 py-0.5 text-xs text-accent-amber font-body font-medium">
              {totalExtras} duplicate{totalExtras !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Tab chips */}
        <div className="flex flex-col gap-0.5">
          {visibleTabs.map((tab) => (
            <TabChip
              key={tab.url}
              url={tab.url}
              title={tab.title}
              duplicateCount={urlCounts[tab.url] ?? 1}
              onFocus={handleFocusTab}
              onClose={handleCloseTab}
              onSave={handleSaveTab}
            />
          ))}

          {/* Overflow hidden chips */}
          {extraCount > 0 && expanded && (
            <div className="flex flex-col gap-0.5">
              {hiddenTabs.map((tab) => (
                <TabChip
                  key={tab.url}
                  url={tab.url}
                  title={tab.title}
                  duplicateCount={urlCounts[tab.url] ?? 1}
                  onFocus={handleFocusTab}
                  onClose={handleCloseTab}
                  onSave={handleSaveTab}
                />
              ))}
            </div>
          )}
        </div>

        {/* "+N more" expand button */}
        {extraCount > 0 && (
          <button
            type="button"
            className="mt-1 flex items-center rounded-chip px-2.5 py-1.5 text-sm text-accent-blue font-body transition-colors duration-150 hover:bg-accent-blue/10 focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none cursor-pointer"
            onClick={handleExpand}
            aria-expanded={expanded}
            aria-label={
              expanded
                ? `Collapse ${extraCount} more tabs`
                : `Show ${extraCount} more tabs`
            }
          >
            {expanded
              ? 'Show less'
              : `+${extraCount} more`}
          </button>
        )}

        {/* Footer actions */}
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border-light dark:border-border-dark pt-3">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-chip px-3 py-1.5 text-sm text-text-secondary font-body transition-colors duration-150 hover:bg-surface-light hover:text-accent-red dark:hover:bg-surface-dark focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none cursor-pointer"
            onClick={handleCloseDomain}
          >
            <CloseAllIcon />
            Close all {tabCount} tab{tabCount !== 1 ? 's' : ''}
          </button>

          {hasDupes && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-chip px-3 py-1.5 text-sm text-text-secondary font-body transition-colors duration-150 hover:bg-accent-amber/10 hover:text-accent-amber focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none cursor-pointer"
              onClick={handleCloseDuplicates}
            >
              <DedupIcon />
              Close {totalExtras} duplicate{totalExtras !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
