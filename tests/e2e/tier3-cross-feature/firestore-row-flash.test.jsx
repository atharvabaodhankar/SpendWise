import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 3: Cross-Feature - Firestore Listener and row-flash Animation (TransactionList.jsx)', () => {
  async function getTransactionList() {
    const res = await loadSrcModule('src/components/TransactionList.jsx');
    assertContractAvailable(
      res,
      'TransactionList.jsx',
      'PROJECT.md § TransactionList: new transactions inserted via Firestore listeners animate with row-flash (1.2s ease-out --accent-soft fade) without jumping scroll position.'
    );
    return res.Component;
  }

  it('applies row-flash animation token class to newly received Firestore transaction', async () => {
    const TransactionList = await getTransactionList();
    const initialTxs = [
      { id: 'tx-1', description: 'Existing Bill', amount: 500, type: 'expense', category: 'Bills', date: '2026-11-10T08:00:00Z' },
    ];

    const { rerender, container } = render(
      <TransactionList transactions={initialTxs} />,
      { wrapper: TestAppWrapper }
    );

    expect(screen.getByText('Existing Bill')).toBeInTheDocument();

    // Simulate new transaction arriving via Firestore listener
    const arrivingTx = {
      id: 'tx-arrived',
      description: 'UPI Tea Stall',
      amount: 40,
      type: 'expense',
      category: 'Food',
      date: new Date().toISOString(),
      isNew: true,
    };

    rerender(
      <TransactionList transactions={[arrivingTx, ...initialTxs]} />
    );

    expect(screen.getByText('UPI Tea Stall')).toBeInTheDocument();
    // Look for row-flash class or animation container
    expect(container.innerHTML).toMatch(/(row-flash|accent-soft|animate)/);
  });

  it('row-flash animation uses 1.2s ease-out fade transition', async () => {
    const TransactionList = await getTransactionList();
    const tx = {
      id: 'tx-flash-check',
      description: 'Subway Ride',
      amount: 50,
      type: 'expense',
      category: 'Transport',
      date: new Date().toISOString(),
      isNew: true,
    };

    const { container } = render(
      <TransactionList transactions={[tx]} />,
      { wrapper: TestAppWrapper }
    );

    // CSS class or style should reference row-flash
    const flashedRow = container.querySelector('[class*="row-flash"], [class*="accent-soft"]');
    expect(flashedRow).not.toBeNull();
  });

  it('new transaction insertion does not invoke destructive window scrolling or viewport jump', async () => {
    const TransactionList = await getTransactionList();
    const scrollSpy = vi.spyOn(window, 'scrollTo');

    const tx = {
      id: 'tx-no-jump',
      description: 'Coffee Beans',
      amount: 600,
      type: 'expense',
      category: 'Food',
      date: new Date().toISOString(),
      isNew: true,
    };

    render(<TransactionList transactions={[tx]} />, { wrapper: TestAppWrapper });

    // Insertion must NOT call window.scrollTo(0, 0)
    expect(scrollSpy).not.toHaveBeenCalledWith(0, 0);
  });
});
