import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────

interface FooterProps {
  tabCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────

const GITHUB_URL = 'https://github.com/zarazhangrui/tab-out';
const AUTHOR_URL = 'https://x.com/zarazhangrui';

// ─── Component ────────────────────────────────────────────────────────

export function Footer({ tabCount }: FooterProps): React.ReactElement {
  return (
    <footer className="mt-12 border-t border-border-light pt-5 dark:border-border-dark">
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <div className="stat">
          <span className="font-heading text-lg font-light text-text-primary-light dark:text-text-primary-dark">
            {tabCount}
          </span>
          <span className="ml-1.5">open tab{tabCount !== 1 ? 's' : ''}</span>
        </div>
        <span>
          <a
            href={GITHUB_URL}
            target="_top"
            className="text-text-secondary underline underline-offset-2 transition-colors hover:text-text-primary-light dark:hover:text-text-primary-dark"
          >
            Tab Out
          </a>
          {' '}by{' '}
          <a
            href={AUTHOR_URL}
            target="_top"
            className="text-text-secondary underline underline-offset-2 transition-colors hover:text-text-primary-light dark:hover:text-text-primary-dark"
          >
            Zara
          </a>
        </span>
      </div>
    </footer>
  );
}
