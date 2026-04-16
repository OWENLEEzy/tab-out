import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────

interface NudgeBannerProps {
  tabCount: number;
  threshold?: number;
  onDismiss: () => void;
}

// ─── Component ────────────────────────────────────────────────────────

export function NudgeBanner({
  tabCount,
  threshold = 15,
  onDismiss,
}: NudgeBannerProps): React.ReactElement | null {
  if (tabCount <= threshold) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-4 flex items-center justify-between rounded-card border border-accent-red/20 bg-gradient-to-br from-accent-red/[0.04] to-accent-red/[0.09] px-6 py-4 animate-[fadeUp_0.5s_ease_both]"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-red/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-[18px] w-[18px] text-accent-red"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <p className="text-sm leading-relaxed text-text-primary-light dark:text-text-primary-dark">
          You have <strong className="font-semibold">{tabCount}</strong> tabs open. Consider closing the ones you&apos;re not using.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-chip text-text-secondary transition-colors hover:bg-accent-red/10 hover:text-accent-red focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none"
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
