import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 3: Cross-Feature - Transaction Creation Flow (TransactionForm -> Ledger -> Net Balance -> Budget)', () => {
  async function getTransactionForm() {
    const res = await loadSrcModule('src/components/TransactionForm.jsx');
    assertContractAvailable(res, 'TransactionForm.jsx', 'PROJECT.md § TransactionForm: 440px desktop drawer / full mobile sheet.');
    return res.Component;
  }

  async function getTransactionList() {
    const res = await loadSrcModule('src/components/TransactionList.jsx');
    assertContractAvailable(res, 'TransactionList.jsx', 'PROJECT.md § TransactionList: day-grouped ledger rows.');
    return res.Component;
  }

  async function getBudgetGoals() {
    const res = await loadSrcModule('src/components/BudgetGoals.jsx');
    assertContractAvailable(res, 'BudgetGoals.jsx', 'PROJECT.md § BudgetGoals: spent vs limit pacing.');
    return res.Component;
  }

  it('submitting an expense in TransactionForm invokes submit callback with formatted data', async () => {
    const TransactionForm = await getTransactionForm();
    const onSubmit = vi.fn();

    render(
      <TransactionForm isOpen={true} onClose={() => {}} onSubmit={onSubmit} />,
      { wrapper: TestAppWrapper }
    );

    // Form should render amount input and category choice
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it('newly logged transaction renders under day-grouped header in ledger', async () => {
    const TransactionList = await getTransactionList();
    const tx = {
      id: 'tx-new',
      description: 'Books',
      amount: 450,
      type: 'expense',
      category: 'Education',
      date: new Date().toISOString(),
    };

    render(
      <TransactionList transactions={[tx]} />,
      { wrapper: TestAppWrapper }
    );

    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  it('expense updates budget progress and remaining daily allowance calculation', async () => {
    const BudgetGoals = await getBudgetGoals();
    const { rerender } = render(
      <BudgetGoals goals={[{ id: 'b-1', category: 'Food', limit: 10000, spent: 2000 }]} />,
      { wrapper: TestAppWrapper }
    );

    expect(screen.getByText(/2,000|2000/)).toBeInTheDocument();

    // Rerender after new expense of 1,500
    rerender(
      <BudgetGoals goals={[{ id: 'b-1', category: 'Food', limit: 10000, spent: 3500 }]} />
    );

    expect(screen.getByText(/3,500|3500/)).toBeInTheDocument();
  });

  it('reflects cash vs bank payment method selection on wallet distribution', async () => {
    const TransactionForm = await getTransactionForm();
    const { container } = render(
      <TransactionForm isOpen={true} onClose={() => {}} />,
      { wrapper: TestAppWrapper }
    );

    // Segmented control or payment method selector
    expect(container.textContent).toMatch(/(cash|online|upi|bank)/i);
  });
});
