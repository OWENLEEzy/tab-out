import React, { useCallback, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  confettiEnabled: boolean;
  onSetTheme: (theme: 'light' | 'dark' | 'system') => void;
  onToggleSound: () => void;
  onToggleConfetti: () => void;
  onResetSortOrder: () => void;
}

// ─── Component ────────────────────────────────────────────────────────

export function SettingsPanel({
  open,
  onClose,
  theme,
  soundEnabled,
  confettiEnabled,
  onSetTheme,
  onToggleSound,
  onToggleConfetti,
  onResetSortOrder,
}: SettingsPanelProps): React.ReactElement | null {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropClick as unknown as React.KeyboardEventHandler<HTMLDivElement>}
      aria-modal="true"
      role="dialog"
      aria-label="Settings"
    >
      <div
        ref={panelRef}
        className="w-full max-w-sm rounded-card bg-bg-light p-6 shadow-card-hover dark:bg-bg-dark animate-[fadeUp_0.3s_ease_both]"
      >
        {/* Title + Close */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Settings
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-chip text-text-secondary transition-colors hover:bg-surface-light hover:text-text-primary-light dark:hover:bg-surface-dark dark:hover:text-text-primary-dark focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none cursor-pointer"
            aria-label="Close settings"
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

        {/* Toggles */}
        <div className="flex flex-col gap-4">
          <ThemeRow value={theme} onChange={onSetTheme} />
          <ToggleRow
            id="setting-sound"
            label="Sound effects"
            checked={soundEnabled}
            onChange={onToggleSound}
          />
          <ToggleRow
            id="setting-confetti"
            label="Confetti animation"
            checked={confettiEnabled}
            onChange={onToggleConfetti}
          />
          {/* Sort order reset */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-body text-text-primary-light dark:text-text-primary-dark">
              Sort order
            </span>
            <button
              type="button"
              onClick={onResetSortOrder}
              className="rounded-chip px-3 py-1 text-xs font-body text-accent-blue transition-colors hover:bg-accent-blue/10 focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none cursor-pointer"
            >
              Reset to default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Theme selector sub-component ────────────────────────────────────

interface ThemeRowProps {
  value: 'light' | 'dark' | 'system';
  onChange: (theme: 'light' | 'dark' | 'system') => void;
}

const THEME_OPTIONS: { value: 'light' | 'dark' | 'system'; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function ThemeRow({ value, onChange }: ThemeRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-body text-text-primary-light dark:text-text-primary-dark">
        Theme
      </label>
      <div className="inline-flex rounded-chip border border-border-light dark:border-border-dark overflow-hidden">
        {THEME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 text-xs font-body transition-colors cursor-pointer ${
              value === opt.value
                ? 'bg-accent-sage text-white'
                : 'text-text-secondary hover:bg-surface-light dark:hover:bg-surface-dark'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Toggle sub-component ─────────────────────────────────────────────

interface ToggleRowProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleRow({ id, label, checked, onChange }: ToggleRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <label
        htmlFor={id}
        className="text-sm font-body text-text-primary-light dark:text-text-primary-dark"
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:ring-offset-2 ${
          checked
            ? 'bg-accent-sage'
            : 'bg-border-light dark:bg-border-dark'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
