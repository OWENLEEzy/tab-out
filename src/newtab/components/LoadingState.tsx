import React from 'react';

export function LoadingState(): React.ReactElement {
  return (
    <div className="tab-out-container">
      {/* Header skeleton */}
      <div className="mb-12 border-b border-border-light dark:border-border-dark pb-6">
        <div className="animate-pulse h-7 w-48 rounded bg-surface-light dark:bg-surface-dark" />
        <div className="animate-pulse mt-2 h-4 w-32 rounded bg-surface-light dark:bg-surface-dark" />
        <div className="mt-2 flex gap-2">
          <div className="animate-pulse h-5 w-14 rounded-chip bg-surface-light dark:bg-surface-dark" />
          <div className="animate-pulse h-5 w-16 rounded-chip bg-surface-light dark:bg-surface-dark" />
          <div className="animate-pulse h-5 w-18 rounded-chip bg-surface-light dark:bg-surface-dark" />
        </div>
      </div>

      {/* Section header skeleton */}
      <div className="animate-pulse mb-4 flex items-center gap-3">
        <div className="h-4 w-20 rounded bg-surface-light dark:bg-surface-dark" />
        <div className="h-px flex-1 bg-surface-light dark:bg-surface-dark" />
        <div className="h-3 w-12 rounded bg-surface-light dark:bg-surface-dark" />
      </div>

      {/* Card skeletons — match DomainCard structure */}
      <div className="columns-[300px] gap-3">
        {['skel-a', 'skel-b', 'skel-c'].map((key) => (
          <div
            key={key}
            className="mb-3 break-inside-avoid overflow-hidden rounded-card shadow-card"
          >
            {/* Status bar */}
            <div className="animate-pulse h-[3px] bg-surface-light dark:bg-surface-dark" />
            <div className="bg-card-light dark:bg-card-dark p-4">
              {/* Header row: favicon + name + badge */}
              <div className="mb-3 flex items-center gap-2">
                <div className="animate-pulse h-5 w-5 rounded-[3px] bg-surface-light dark:bg-surface-dark" />
                <div className="animate-pulse h-4 w-20 rounded bg-surface-light dark:bg-surface-dark" />
                <div className="animate-pulse h-4 w-16 rounded-chip bg-surface-light dark:bg-surface-dark" />
              </div>
              {/* Chip rows */}
              <div className="flex flex-col gap-0.5">
                <div className="animate-pulse h-7 w-full rounded-chip bg-surface-light dark:bg-surface-dark" />
                <div className="animate-pulse h-7 w-4/5 rounded-chip bg-surface-light dark:bg-surface-dark" />
                <div className="animate-pulse h-7 w-[90%] rounded-chip bg-surface-light dark:bg-surface-dark" />
              </div>
              {/* Footer action skeleton */}
              <div className="mt-3 border-t border-border-light dark:border-border-dark pt-3">
                <div className="animate-pulse h-6 w-24 rounded-chip bg-surface-light dark:bg-surface-dark" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}