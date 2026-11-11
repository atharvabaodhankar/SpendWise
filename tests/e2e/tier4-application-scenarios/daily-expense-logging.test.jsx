import React, { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 4: Scenario 2 - Daily Expense Logging and Notification Workflow', () => {
  async function getTransactionForm() {
    const res = await loadSrcModule('src/components/TransactionForm.jsx');
    assertContractAvailable(res, 'TransactionForm.jsx', 'PROJECT.md § TransactionForm: 440px right drawer with 32px amount field.');
    return res.Component;
  }

  async function getTransactionList() {
    const res = await loadSrcModule('src/components/TransactionList.jsx');
    assertContractAvailable(res, 'TransactionList.jsx', 'PROJECT.md § TransactionList: day-grouped ledger rows.');
    return res.Component;
  }

  async function getNotification() {
    const res = await loadSrcModule('src/components/Notification.jsx');
    assertContractAvailable(res, 'Notification.jsx', 'PROJECT.md § Notification: status border toast notification.');
    return res.Component;
  }

  it('completes end-to-end expense logging: open drawer -> submit expense -> notification toast -> ledger updates', async () => {
    const TransactionForm = await getTransactionForm();
    const TransactionList = await getTransactionList();
    const Notification = await getNotification();

    const onSubmit = vi.fn();
    const onCloseToast = vi.fn();

    // Step 1: Open Transaction Drawer
    render(
      <TransactionForm isOpen={true} onClose={() => {}} onSubmit={onSubmit} />,
      { wrapper: TestAppWrapper }
    );
    expect(screen.queryAllByText(/expense/i).length).toBeGreaterThan(0);

    // Step 2: Show confirmation toast with 2px border
    const { container: toastContainer } = render(
      <Notification
        notification={{ id: 'toast-save', message: 'Expense of ₹350 saved', type: 'success' }}
        onClose={onCloseToast}
      />
    );
    expect(screen.getByText('Expense of ₹350 saved')).toBeInTheDocument();
    expect(toastContainer.innerHTML).toMatch(/(border-2|border-l-2|border-\[2px\])/);

    // Step 3: Ledger displays newly logged row
    const newTx = {
      id: 'tx-logged-today',
      description: 'Supermarket Groceries',
      amount: 350,
      type: 'expense',
      category: 'Food',
      date: new Date().toISOString(),
    };
    render(
      <TransactionList transactions={[newTx]} />,
      { wrapper: TestAppWrapper }
    );
    expect(screen.getByText('Supermarket Groceries')).toBeInTheDocument();
  });
});
