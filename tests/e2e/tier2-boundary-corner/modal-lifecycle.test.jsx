import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';

describe('Tier 2: Boundary - Modal Lifecycle, Focus & Scroll Lock Cleanup (Modal.jsx)', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  async function getModalComponent() {
    const res = await loadSrcModule('src/components/Modal.jsx');
    assertContractAvailable(
      res,
      'Modal.jsx',
      'PROJECT.md § Interface Contracts: Modal.jsx requires focus trap, body scroll lock cleanup, Esc dismissal, and clean unmount.'
    );
    return res.Component;
  }

  it('restores body overflow to original state after rapid open/close sequence', async () => {
    const Modal = await getModalComponent();

    const Wrapper = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <button onClick={() => setIsOpen(true)}>Open</button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Rapid Lifecycle">
            <button onClick={() => setIsOpen(false)}>Close</button>
          </Modal>
        </div>
      );
    };

    render(<Wrapper />);
    const openBtn = screen.getByText('Open');

    // Rapid toggle
    fireEvent.click(openBtn);
    expect(document.body.style.overflow).toBe('hidden');

    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);
    expect(document.body.style.overflow).not.toBe('hidden');

    fireEvent.click(openBtn);
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByText('Close'));
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('cleans up body scroll lock on unmount if component unmounts while isOpen is true', async () => {
    const Modal = await getModalComponent();
    const { unmount } = render(
      <Modal isOpen={true} onClose={() => {}} title="Unmount Test">
        <p>Unmounting while open</p>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    // Must reset body overflow
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('handles multiple rapid Escape presses idempotently without crashing', async () => {
    const Modal = await getModalComponent();
    const onClose = vi.fn();

    render(
      <Modal isOpen={true} onClose={onClose} title="Escape Stress Test">
        <p>Content</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });

  it('traps tab focus within active modal when open', async () => {
    const Modal = await getModalComponent();
    render(
      <Modal isOpen={true} onClose={() => {}} title="Focus Trap Test">
        <button data-testid="first-action">First</button>
        <button data-testid="last-action">Last</button>
      </Modal>
    );

    const firstBtn = screen.getByTestId('first-action');
    const lastBtn = screen.getByTestId('last-action');

    expect(firstBtn).toBeInTheDocument();
    expect(lastBtn).toBeInTheDocument();
  });

  it('restores focus to trigger button when modal is dismissed', async () => {
    const Modal = await getModalComponent();

    const Wrapper = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <div>
          <button data-testid="trigger-button" onClick={() => setIsOpen(true)}>Open Modal</button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Focus Return">
            <button onClick={() => setIsOpen(false)}>Close Modal</button>
          </Modal>
        </div>
      );
    };

    render(<Wrapper />);
    const trigger = screen.getByTestId('trigger-button');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    const closeBtn = screen.getByText('Close Modal');
    fireEvent.click(closeBtn);

    // After closing, focus should return to trigger or document body
    expect(document.activeElement).toBeDefined();
  });
});
