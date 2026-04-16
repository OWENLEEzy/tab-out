import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────

interface UpdateBannerProps {
  version: string;
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────

export function UpdateBanner({
  version,
  onDismiss,
}: UpdateBannerProps): React.ReactElement {
  return (
    <div
      role="status"
      className="mb-4 flex items-center justify-between rounded-card border border-accent-sage/20 bg-gradient-to-br from-accent-sage/[0.04] to-accent-sage/[0.09] px-6 py-4 animate-[fadeUp_0.5s_ease_both]"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-sage/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-[18px] w-[18px] text-accent-sage"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <p className="text-sm leading-relaxed text-text-primary-light dark:text-text-primary-dark">
          Tab Out updated to <strong className="font-semibold">v{version}</strong> &mdash; What&apos;s new?
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-chip text-text-secondary transition-colors hover:bg-accent-sage/10 hover:text-accent-sage"
        aria-label="Dismiss"
      >
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
      </button>
    </div>
  );
}
