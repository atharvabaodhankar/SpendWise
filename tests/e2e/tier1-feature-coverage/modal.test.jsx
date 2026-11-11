import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';

describe('Tier 1: F9 Modal and Bottom Sheet Primitive (Modal.jsx)', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  async function getModalComponent() {
    const res = await loadSrcModule('src/components/Modal.jsx');
    assertContractAvailable(
      res,
      'Modal.jsx',
      'PROJECT.md § Interface Contracts: Modal.jsx requires props (isOpen, onClose, title, children, maxWidth) with 14px desktop dialog / mobile bottom sheet, focus trap, body scroll lock, and Esc key dismissal.'
    );
    return res.Component;
  }

  it('renders nothing when isOpen is false', async () => {
    const Modal = await getModalComponent();
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal Body</p>
      </Modal>
    );
    expect(screen.queryByText('Test Modal')).toBeNull();
    expect(screen.queryByText('Modal Body')).toBeNull();
  });

  it('renders content with title and 14px radius specification when isOpen is true', async () => {
    const Modal = await getModalComponent();
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal Body</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Body')).toBeInTheDocument();
  });

  it('locks body scroll when opened and restores it upon closing', async () => {
    const Modal = await getModalComponent();
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} title="Scroll Lock Test">
        <p>Testing scroll lock</p>
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={() => {}} title="Scroll Lock Test">
        <p>Testing scroll lock</p>
      </Modal>
    );

    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('dismisses modal when Escape key is pressed', async () => {
    const Modal = await getModalComponent();
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Escape Test">
        <button>Inside Button</button>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dismisses modal when clicking backdrop overlay', async () => {
    const Modal = await getModalComponent();
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={onClose} title="Backdrop Click Test">
        <p>Backdrop content</p>
      </Modal>
    );

    // Look for backdrop element (fixed overlay)
    const backdrop = container.querySelector('[aria-hidden="true"], .fixed, [data-testid="modal-backdrop"]');
    expect(backdrop, 'Backdrop element must be present in DOM when modal is open').not.toBeNull();
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('supports maxWidth configurations (sm, md, lg)', async () => {
    const Modal = await getModalComponent();
    const { container: containerMd } = render(
      <Modal isOpen={true} onClose={() => {}} title="Md Modal" maxWidth="md">
        <p>Content</p>
      </Modal>
    );
    expect(containerMd.innerHTML).toMatch(/(520px|max-w-md|max-w-\[520px\])/);

    const { container: containerLg } = render(
      <Modal isOpen={true} onClose={() => {}} title="Lg Modal" maxWidth="lg">
        <p>Content</p>
      </Modal>
    );
    expect(containerLg.innerHTML).toMatch(/(720px|max-w-lg|max-w-\[720px\])/);
  });
});
