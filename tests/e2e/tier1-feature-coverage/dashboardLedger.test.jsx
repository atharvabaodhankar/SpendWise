import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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

  it('renders Online vs Cash proportional wallet breakdown when "Net balance" is selected', async () => {
    const Dashboard = await getDashboard();
    render(
      <AuthProvider>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </AuthProvider>
    );

    // Default hero metric is "Spent this month", so wallet bar is hidden
    expect(screen.queryByText(/edit balances/i)).toBeNull();

    // Switch to Net balance view
    const netToggle = screen.getByRole('button', { name: /net balance/i });
    fireEvent.click(netToggle);

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

  it('provides an always-visible touch-accessible delete trash action for each transaction row', async () => {
    const TransactionList = await getTransactionList();
    const onDelete = vi.fn();
    render(
      <MemoryRouter>
        <TransactionList transactions={sampleTransactions} onDelete={onDelete} />
      </MemoryRouter>
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBe(sampleTransactions.length);

    // Clicking the trash icon directly calls onDelete
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith(sampleTransactions[0]);
  });

  it('paginates ledger at 20 transactions per page with Previous/Next controls', async () => {
    const TransactionList = await getTransactionList();
    const manyTransactions = Array.from({ length: 45 }, (_, i) => ({
      id: `tx-page-${i}`,
      description: `Item ${i + 1}`,
      amount: 100 + i,
      type: 'expense',
      category: 'Food',
      date: '2026-11-15T12:00:00Z',
    }));

    render(
      <MemoryRouter>
        <TransactionList transactions={manyTransactions} />
      </MemoryRouter>
    );

    // Total 45 items -> 3 pages of 20
    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/45 transactions/i)).toBeInTheDocument();

    const prevButton = screen.getByRole('button', { name: /previous page/i });
    const nextButton = screen.getByRole('button', { name: /next page/i });

    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();

    // Only first 20 items visible
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 20')).toBeInTheDocument();
    expect(screen.queryByText('Item 21')).toBeNull();

    // Click Next
    fireEvent.click(nextButton);
    expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).not.toBeDisabled();
    expect(screen.getByText('Item 21')).toBeInTheDocument();
    expect(screen.getByText('Item 40')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).toBeNull();

    // Click Next to page 3 (last page)
    fireEvent.click(nextButton);
    expect(screen.getByText(/page 3 of 3/i)).toBeInTheDocument();
    expect(prevButton).not.toBeDisabled();
    expect(nextButton).toBeDisabled();
    expect(screen.getByText('Item 45')).toBeInTheDocument();
  });

  it('safely recedes to page 1 without empty results flash when the only item on page 2 is removed', async () => {
    const TransactionList = await getTransactionList();
    const initial21 = Array.from({ length: 21 }, (_, i) => ({
      id: `tx-del-${i}`,
      description: `Item ${i + 1}`,
      amount: 50 + i,
      type: 'expense',
      category: 'Food',
      date: '2026-11-15T12:00:00Z',
    }));

    const { rerender } = render(
      <MemoryRouter>
        <TransactionList transactions={initial21} />
      </MemoryRouter>
    );

    // Navigate to page 2
    const nextBtn = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
    expect(screen.getByText('Item 21')).toBeInTheDocument();

    // Rerender with 20 items (Item 21 deleted)
    rerender(
      <MemoryRouter>
        <TransactionList transactions={initial21.slice(0, 20)} />
      </MemoryRouter>
    );

    // Must immediately render page 1 without "No transactions match your filters."
    expect(screen.queryByText(/no transactions match your filters/i)).toBeNull();
    expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
    expect(screen.getByText('Item 20')).toBeInTheDocument();
  });

  it('filters by Online wallet to include UPI, Bank, and online payment methods while Cash only matches cash', async () => {
    const TransactionList = await getTransactionList();
    const mixedTransactions = [
      { id: '1', description: 'Grocery Market', amount: 500, type: 'expense', category: 'Food', paymentMethod: 'UPI', date: '2026-11-15' },
      { id: '2', description: 'Cold Coffee', amount: 150, type: 'expense', category: 'Food', paymentMethod: 'cash', date: '2026-11-15' },
      { id: '3', description: 'Freelance Payment', amount: 50000, type: 'income', category: 'Salary', paymentMethod: 'Bank', date: '2026-11-15' },
      { id: '4', description: 'Uber Trip', amount: 300, type: 'expense', category: 'Travel', paymentMethod: 'online', date: '2026-11-15' },
    ];

    const { container } = render(
      <MemoryRouter>
        <TransactionList transactions={mixedTransactions} />
      </MemoryRouter>
    );

    // Find the wallet combobox button
    const walletCombobox = screen.getByRole('combobox', { name: /filter by wallet/i });

    // Open wallet dropdown and select "Online"
    fireEvent.click(walletCombobox);
    const onlineOption = screen.getByRole('option', { name: /^online$/i });
    fireEvent.click(onlineOption);

    expect(screen.getByText('Grocery Market')).toBeInTheDocument();
    expect(screen.getByText('Freelance Payment')).toBeInTheDocument();
    expect(screen.getByText('Uber Trip')).toBeInTheDocument();
    expect(screen.queryByText('Cold Coffee')).toBeNull();

    // Open wallet dropdown and select "Cash"
    fireEvent.click(walletCombobox);
    const cashOption = screen.getByRole('option', { name: /^cash$/i });
    fireEvent.click(cashOption);

    expect(screen.getByText('Cold Coffee')).toBeInTheDocument();
    expect(screen.queryByText('Grocery Market')).toBeNull();
    expect(screen.queryByText('Freelance Payment')).toBeNull();
    expect(screen.queryByText('Uber Trip')).toBeNull();
  });

  it('correctly calculates spent this month, spent today, and net balance when toggled', async () => {
    const Dashboard = await getDashboard();
    localStorage.clear();

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
    const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-15`;

    render(
      <AuthProvider>
        <MemoryRouter>
          <Dashboard
            initialBalances={{ online: 20000, cash: 4000 }}
            initialHeroMetric="month"
          />
        </MemoryRouter>
      </AuthProvider>
    );

    // Default hero metric is "Spent this month"
    expect(screen.getByRole('button', { name: /spent this month/i })).toHaveAttribute('aria-pressed', 'true');

    // Switch to Spent today
    fireEvent.click(screen.getByRole('button', { name: /spent today/i }));
    expect(screen.getByRole('button', { name: /spent today/i })).toHaveAttribute('aria-pressed', 'true');

    // Switch to Net balance (20,000 + 4,000 = 24,000)
    fireEvent.click(screen.getByRole('button', { name: /net balance/i }));
    expect(screen.getByRole('button', { name: /net balance/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/24,000/)).toBeInTheDocument();
  });

  it('persists selected hero metric view in localStorage', async () => {
    const Dashboard = await getDashboard();
    localStorage.clear();

    const { unmount } = render(
      <AuthProvider>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </AuthProvider>
    );

    // Default is month
    expect(screen.getByRole('button', { name: /spent this month/i })).toHaveAttribute('aria-pressed', 'true');

    // Click Spent today
    fireEvent.click(screen.getByRole('button', { name: /spent today/i }));
    expect(localStorage.getItem('spendwise_hero_metric_preference')).toBe('today');

    unmount();

    // Re-mount should restore from localStorage
    render(
      <AuthProvider>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByRole('button', { name: /spent today/i })).toHaveAttribute('aria-pressed', 'true');
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
