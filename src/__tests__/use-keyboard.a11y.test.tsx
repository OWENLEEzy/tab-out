import React, { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useKeyboard } from '../newtab/hooks/useKeyboard';

function KeyboardHarness(): React.ReactElement {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [closeCount, setCloseCount] = useState(0);

  useKeyboard({
    onSearch: () => {},
    onSave: () => {},
    onEscape: () => {},
    onArrowUp: () => {},
    onArrowDown: () => {},
    onEnter: () => {},
    onDClose: () => setCloseCount((count) => count + 1),
    onDSave: () => setSaveCount((count) => count + 1),
  });

  return (
    <div>
      <button type="button" onClick={() => setDialogOpen((open) => !open)}>
        Toggle dialog
      </button>
      <output data-testid="save-count">{saveCount}</output>
      <output data-testid="close-count">{closeCount}</output>
      {dialogOpen && (
        <div role="dialog" aria-modal="true" aria-label="Keyboard test dialog">
          <button type="button">Dialog action</button>
        </div>
      )}
    </div>
  );
}

describe('useKeyboard', () => {
  it('does not fire global single-key shortcuts while focus is inside a dialog', async () => {
    const user = userEvent.setup();

    render(<KeyboardHarness />);

    await user.click(screen.getByRole('button', { name: 'Toggle dialog' }));

    const dialogButton = screen.getByRole('button', { name: 'Dialog action' });
    dialogButton.focus();

    await user.keyboard('s');
    await user.keyboard('d');

    expect(screen.getByTestId('save-count')).toHaveTextContent('0');
    expect(screen.getByTestId('close-count')).toHaveTextContent('0');
  });
});
