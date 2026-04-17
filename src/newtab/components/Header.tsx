import React from 'react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getDateDisplay(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface HeaderProps {
  totalTabs: number;
  totalDupes: number;
  totalDomains: number;
}

export function Header({ totalTabs, totalDupes, totalDomains }: HeaderProps): React.ReactElement {
  return (
    <header className="mb-12 border-b border-border-light pb-6 dark:border-border-dark">
      <h1 className="font-heading text-3xl font-light text-text-primary-light dark:text-text-primary-dark">
        {getGreeting()}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        {getDateDisplay()}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className="inline-flex items-center rounded-chip bg-accent-blue/[0.08] px-2.5 py-0.5 text-xs text-accent-blue font-body font-medium">
          {totalTabs} tab{totalTabs !== 1 ? 's' : ''}
        </span>
        {totalDupes > 0 && (
          <span className="inline-flex items-center rounded-chip bg-accent-amber/[0.08] px-2.5 py-0.5 text-xs text-accent-amber font-body font-medium">
            {totalDupes} dupe{totalDupes !== 1 ? 's' : ''}
          </span>
        )}
        <span className="inline-flex items-center rounded-chip bg-accent-sage/[0.08] px-2.5 py-0.5 text-xs text-accent-sage font-body font-medium">
          {totalDomains} domain{totalDomains !== 1 ? 's' : ''}
        </span>
      </div>
    </header>
  );
}
