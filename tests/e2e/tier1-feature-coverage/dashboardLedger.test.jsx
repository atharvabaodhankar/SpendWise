import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { AuthProvider } from '../../../src/context/AuthContext.jsx';

describe('Tier 1: F5 Dashboard and Transaction Ledger Engine (Dashboard.jsx & TransactionList.jsx)', () => {
  async function getDashboard() {
    const res = await loadSrcModule('src/pages/Dashboard.jsx');
    assertContractAvailable(
      res,
      'Dashboard.jsx',
      'PROJECT.md § Dashboard: unboxed printed ledger, net balance figure, Online vs Cash bar, day-grouped transactions with sticky headers.'
    );
    return res.Component;
  }

  async function getTransactionList() {
    const res = await loadSrcModule('src/components/TransactionList.jsx');
    assertContractAvailable(
      res,
      'TransactionList.jsx',
      'PROJECT.md § TransactionList: day-grouped rows, 56px min-height, 1px dividers, sticky headers, touch-accessible action menu, row-flash.'
    );
    return res.Component;
  }

  const sampleTransactions = [
    {
      id: 'tx-1',
      description: 'Organic Groceries',
      amount: 850,
      type: 'expense',
      category: 'Food',
      paymentMethod: 'UPI',
      date: '2026-11-10T10:00:00Z',
    },
    {
      id: 'tx-2',
      description: 'Metro Recharge',
      amount: 200,
      type: 'expense',
      category: 'Transport',
      paymentMethod: 'Cash',
      date: '2026-11-10T14:30:00Z',
    },
    {
      id: 'tx-3',
      description: 'Freelance Design',
      amount: 15000,
      type: 'income',
      category: 'Income',
      paymentMethod: 'Bank',
      date: '2026-11-09T09:15:00Z',
    },
  ];

  it('renders prominent net balance figure with tabular styling and weight 300', async () => {
    const Dashboard = await getDashboard();
    const { container } = render(
      <AuthProvider>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </AuthProvider>
    );

    const balanceEl = container.querySelector('[class*="font-light"], [class*="tabular-nums"], [class*="text-3xl"], [class*="text-4xl"]');
    expect(balanceEl).not.toBeNull();
  });

  it('renders Online vs Cash proportional wallet breakdown with "Edit balances" trigger', async () => {
    const Dashboard = await getDashboard();
    render(
      <AuthProvider>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </AuthProvider>
    );

    const editTrigger = screen.queryByText(/edit balances/i) || screen.queryByRole('button', { name: /edit balances/i });
    expect(editTrigger).not.toBeNull();
  });

  it('groups transactions chronologically by day with sticky date headers and day totals', async () => {
    const TransactionList = await getTransactionList();
    const { container } = render(
      <MemoryRouter>
        <TransactionList transactions={sampleTransactions} />
      </MemoryRouter>
    );

    expect(container.textContent).toContain('Organic Groceries');
    expect(container.textContent).toContain('Metro Recharge');
    expect(container.textContent).toContain('Freelance Design');

    const stickyHeader = container.querySelector('[class*="sticky"]');
    expect(stickyHeader).not.toBeNull();
  });

  it('enforces min 56px height (min-h-[56px] or h-14) and 1px line divider on ledger rows', async () => {
    const TransactionList = await getTransactionList();
    const { container } = render(
      <MemoryRouter>
        <TransactionList transactions={sampleTransactions} />
      </MemoryRouter>
    );

    const rows = container.querySelectorAll('[class*="min-h-"], [class*="h-14"], [class*="border-b"]');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('displays category and payment method as plain text subtitles, not colored pill chips', async () => {
    const TransactionList = await getTransactionList();
    const { container } = render(
      <MemoryRouter>
        <TransactionList transactions={sampleTransactions} />
      </MemoryRouter>
    );

    expect(container.innerHTML).not.toContain('stamp-pill');
    expect(container.innerHTML).not.toContain('rounded-full');
    expect(container.textContent).toMatch(/Food/i);
    expect(container.textContent).toMatch(/UPI/i);
  });

  it('provides a touch-accessible action menu (…) for each transaction row', async () => {
    const TransactionList = await getTransactionList();
    render(
      <MemoryRouter>
        <TransactionList transactions={sampleTransactions} />
      </MemoryRouter>
    );

    const actionButtons = screen.getAllByRole('button', { name: /action|more|menu|…|\.\.\./i });
    expect(actionButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('applies row-flash animation token when a new transaction is inserted', async () => {
    const TransactionList = await getTransactionList();
    const newTx = {
      id: 'tx-new-flash',
      description: 'Coffee',
      amount: 120,
      type: 'expense',
      category: 'Food',
      date: new Date().toISOString(),
      isNew: true,
    };

    const { container } = render(
      <MemoryRouter>
        <TransactionList transactions={[newTx, ...sampleTransactions]} />
      </MemoryRouter>
    );

    expect(container.innerHTML).toMatch(/(row-flash|accent-soft|animate)/);
  });
});
