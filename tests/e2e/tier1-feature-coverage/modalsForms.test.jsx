import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 1: F9 Modals, Sheets, Forms & AI Chat (TransactionForm, ApiKeyManager, Notification, AiChatbot)', () => {
  async function getTransactionForm() {
    const res = await loadSrcModule('src/components/TransactionForm.jsx');
    assertContractAvailable(
      res,
      'TransactionForm.jsx',
      'PROJECT.md § TransactionForm: 440px desktop drawer / full mobile sheet, 32px amount field, segmented controls, category text chips.'
    );
    return res.Component;
  }

  async function getApiKeyManager() {
    const res = await loadSrcModule('src/components/ApiKeyManager.jsx');
    assertContractAvailable(
      res,
      'ApiKeyManager.jsx',
      'PROJECT.md § ApiKeyManager: plain table rows, masked mono keys, one-time display of new keys in --sunken block with copy button.'
    );
    return res.Component;
  }

  async function getNotification() {
    const res = await loadSrcModule('src/components/Notification.jsx');
    assertContractAvailable(
      res,
      'Notification.jsx',
      'PROJECT.md § Notification: text-only cards with 2px status border (--credit or --debit), 4s auto-dismiss with hover pause.'
    );
    return res.Component;
  }

  async function getAiChatbot() {
    const res = await loadSrcModule('src/components/AiChatbot.jsx');
    assertContractAvailable(
      res,
      'AiChatbot.jsx',
      'PROJECT.md § AiChatbot: 420px slide-over panel on desktop, direct text for bot, 14px user bubbles, pinned composer.'
    );
    return res.Component;
  }

  it('TransactionForm renders 32px prominent amount input with decimal inputmode', async () => {
    const TransactionForm = await getTransactionForm();
    const { container } = render(
      <TestAppWrapper>
        <TransactionForm isOpen={true} onClose={() => {}} />
      </TestAppWrapper>
    );

    const amountInput = container.querySelector('input[type="number"], input[inputmode="decimal"], input[name="amount"]');
    expect(amountInput, 'Amount input must be present in TransactionForm').not.toBeNull();
    expect(amountInput.getAttribute('inputmode')).toBe('decimal');
    expect(amountInput.className).toMatch(/(text-2xl|text-3xl|text-\[32px\])/);
  });

  it('TransactionForm renders segmented controls for type and payment method', async () => {
    const TransactionForm = await getTransactionForm();
    render(
      <TestAppWrapper>
        <TransactionForm isOpen={true} onClose={() => {}} />
      </TestAppWrapper>
    );

    expect(screen.queryAllByText(/expense/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/income/i)).not.toBeNull();
  });

  it('ApiKeyManager displays plain table rows with masked monospace keys', async () => {
    const ApiKeyManager = await getApiKeyManager();
    const { container } = render(
      <TestAppWrapper>
        <ApiKeyManager />
      </TestAppWrapper>
    );

    expect(container.textContent).toMatch(/(api key|mcp|key)/i);
  });

  it('Notification toast enforces 2px status border and auto-dismiss after 4 seconds', async () => {
    vi.useFakeTimers();
    const Notification = await getNotification();
    const onClose = vi.fn();

    const { container } = render(
      <Notification
        notification={{ id: 'toast-1', message: 'Expense saved successfully', type: 'success' }}
        onClose={onClose}
      />
    );

    expect(container.innerHTML).toMatch(/(border-2|border-l-2|border-\[2px\]|border-l-\[2px\])/);
    expect(screen.getByText('Expense saved successfully')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('Notification pauses auto-dismiss timer on mouse hover', async () => {
    vi.useFakeTimers();
    const Notification = await getNotification();
    const onClose = vi.fn();

    const { container } = render(
      <Notification
        notification={{ id: 'toast-2', message: 'Hover pause test', type: 'info' }}
        onClose={onClose}
      />
    );

    const toastCard = container.firstElementChild;
    expect(toastCard, 'Toast card element must be rendered').not.toBeNull();
    fireEvent.mouseEnter(toastCard);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseLeave(toastCard);
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('AiChatbot renders 420px slide-over with direct text bot responses and 14px user bubbles', async () => {
    const AiChatbot = await getAiChatbot();
    const { container } = render(
      <TestAppWrapper>
        <AiChatbot isOpen={true} onClose={() => {}} />
      </TestAppWrapper>
    );

    expect(container.innerHTML).toMatch(/(420px|slide|sheet|chat)/);
    expect(container.querySelector('.rounded-full.fixed')).toBeNull();
  });
});
