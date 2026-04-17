import React from 'react';

interface DupeBannerProps {
  count: number;
  onClose: () => void;
}

export function DupeBanner({ count, onClose }: DupeBannerProps): React.ReactElement | null {
  if (count <= 1) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-4 flex items-center justify-between rounded-card border border-accent-amber/20 bg-gradient-to-br from-accent-amber/[0.04] to-accent-amber/[0.09] px-6 py-4 animate-[fadeUp_0.5s_ease_both]"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-amber/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-[18px] w-[18px] text-accent-amber"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
            />
          </svg>
        </div>
        <p className="text-sm leading-relaxed text-text-primary-light dark:text-text-primary-dark">
          You have <strong className="font-semibold">{count}</strong> Tab Out tabs open. Keep just this one?
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="whitespace-nowrap rounded-chip bg-accent-amber px-5 py-2 font-body text-xs font-semibold text-white transition-all duration-200 hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent-amber/50 focus-visible:outline-none cursor-pointer"
      >
        Close extras
      </button>
    </div>
  );
}
