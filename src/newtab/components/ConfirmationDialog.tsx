import React, { useCallback, useEffect, useRef } from 'react';
import type { ConfirmDialogProps } from '../../types';

// ─── Component ────────────────────────────────────────────────────────

export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        onCancel();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  // Trap focus inside dialog
  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const previouslyFocused = document.activeElement as HTMLElement;

    const focusableElements = dialog.querySelectorAll<HTMLElement>(focusableSelector);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    function handleTabKey(e: KeyboardEvent): void {
      if (e.key !== 'Tab') return;
      if (!dialog) return;

      const focusables = dialog.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    dialog.addEventListener('keydown', handleTabKey);
    return () => {
      dialog.removeEventListener('keydown', handleTabKey);
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel],
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
      aria-label={title}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm rounded-card bg-bg-light p-6 shadow-card-hover dark:bg-bg-dark animate-[fadeUp_0.3s_ease_both]"
      >
        <h3 className="font-heading text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {message}
        </p>
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-chip px-4 py-2 text-sm font-body text-text-secondary transition-colors hover:bg-surface-light dark:hover:bg-surface-dark focus-visible:ring-2 focus-visible:ring-accent-blue/40 focus-visible:outline-none"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-chip bg-accent-red px-4 py-2 text-sm font-body font-semibold text-white transition-all duration-200 hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent-red/50 focus-visible:outline-none"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
