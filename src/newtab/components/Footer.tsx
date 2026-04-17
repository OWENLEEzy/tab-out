import React, { useEffect, useRef, useState } from 'react';

interface FooterProps {
  tabCount: number;
}

const POP_DURATION = 300;

export function Footer({ tabCount }: FooterProps): React.ReactElement {
  const [popping, setPopping] = useState(false);
  const prevCount = useRef(tabCount);

  /* eslint-disable react-hooks/set-state-in-effect */
  // One-shot animation: trigger pop when tab count decreases.
  // setState-in-effect is intentional here — this is a side-effect reaction
  // to a prop change, not a derived state computation.
  useEffect(() => {
    if (tabCount < prevCount.current) {
      setPopping(true);
      const timer = setTimeout(() => setPopping(false), POP_DURATION);
      prevCount.current = tabCount;
      return () => clearTimeout(timer);
    }
    prevCount.current = tabCount;
    return undefined;
  }, [tabCount]);

  const GITHUB_URL = 'https://github.com/zarazhangrui/tab-out';
  const AUTHOR_URL = 'https://x.com/zarazhangrui';

  return (
    <footer className="mt-12 border-t border-border-light pt-5 dark:border-border-dark">
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <div className="stat">
          <span
            className={`font-heading text-lg font-light text-text-primary-light dark:text-text-primary-dark inline-block${popping ? ' animate-[countPop_0.3s_ease]' : ''}`}
          >
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
