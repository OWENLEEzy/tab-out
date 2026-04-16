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

export function Header(): React.ReactElement {
  return (
    <header className="mb-12 border-b border-border-light pb-6 dark:border-border-dark">
      <h1 className="font-heading text-3xl font-light text-text-primary-light dark:text-text-primary-dark">
        {getGreeting()}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        {getDateDisplay()}
      </p>
    </header>
  );
}
