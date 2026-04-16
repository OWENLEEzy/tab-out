import React from 'react';

export function LoadingState(): React.ReactElement {
  return (
    <div className="tab-out-container animate-pulse">
      {/* Header skeleton */}
      <div className="mb-12 border-b border-border-light dark:border-border-dark pb-6">
        <div className="h-7 w-48 rounded bg-surface-light dark:bg-surface-dark" />
        <div className="mt-2 h-4 w-32 rounded bg-surface-light dark:bg-surface-dark" />
      </div>

      {/* Card skeletons */}
      <div className="columns-[280px] gap-3">
        {['skeleton-a', 'skeleton-b', 'skeleton-c'].map((key) => (
          <div
            key={key}
            className="mb-3 break-inside-avoid rounded-card border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-4"
          >
            <div className="mb-3 h-5 w-24 rounded bg-surface-light dark:bg-surface-dark" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-surface-light dark:bg-surface-dark" />
              <div className="h-4 w-3/4 rounded bg-surface-light dark:bg-surface-dark" />
              <div className="h-4 w-5/6 rounded bg-surface-light dark:bg-surface-dark" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
