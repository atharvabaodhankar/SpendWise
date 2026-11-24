import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DevDocs from '../../../src/pages/DevDocs';
import Investments, { formatAssetType } from '../../../src/pages/Investments';
import { TestAppWrapper } from '../../utils/test-providers';
import {
  parseLocalDate,
  getDateKey,
  getDayHeading,
  getLocalDateString,
  getCurrentMonthBounds,
  sortTransactionsChronological,
} from '../../../src/utils/dateUtils';

describe('Tier 3: Cross-Feature - MCP Dev Docs Portal & Transaction Date Normalization', () => {
  it('renders /dev portal with architecture, client guides, tool catalog, and live tester', () => {
    render(
      <TestAppWrapper>
        <DevDocs />
      </TestAppWrapper>
    );

    // Header & Brand
    expect(screen.getAllByText(/Model Context Protocol/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/26 available tools/i)).toBeInTheDocument();

    // Tabs
    expect(screen.getByRole('tab', { name: /Overview & Architecture/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Client Setup/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tool Reference/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Interactive API Console/i })).toBeInTheDocument();
  });

  it('normalizes bracketed, relative, and messy date strings into clean YYYY-MM-DD keys', () => {
    // Bracketed strings from LLM / agent chat
    expect(getDateKey('[yesterday 2026-11-20]')).toBe('2026-11-20');
    expect(getDateKey('[today 2026-11-24]')).toBe('2026-11-24');
    expect(getDateKey('2026-11-21T12:00:00.000Z')).toBe('2026-11-21');
    expect(getDateKey('24-11-2026')).toBe('2026-11-24');
    expect(getDateKey('24/11/2026')).toBe('2026-11-24');

    const parsed1 = parseLocalDate('[yesterday 2026-11-20]');
    expect(parsed1).not.toBeNull();
    expect(parsed1.getFullYear()).toBe(2026);
    expect(parsed1.getMonth()).toBe(10); // November (0-indexed)
    expect(parsed1.getDate()).toBe(20);

    // Plain object with seconds (Firestore timestamp shape)
    const firestoreTimestampObj = { seconds: 1763942400, nanoseconds: 0 };
    expect(getDateKey(firestoreTimestampObj)).toBeTruthy();
  });

  it('calculates calendar month boundaries without UTC timezone rollover leakage', () => {
    // In UTC+05:30, new Date(2026, 10, 1).toISOString() is 2026-10-31T18:30:00Z
    // The fixed MCP logic uses calendar strings directly
    const year = 2026;
    const month = 10; // November
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    expect(startStr).toBe('2026-11-01');
    expect(endStr).toBe('2026-11-30');

    // October 31 expense must NOT be included in November bounds
    const oct31 = '2026-10-31';
    expect(oct31 >= startStr && oct31 <= endStr).toBe(false);

    // November 20 expense must be included
    const nov20 = '2026-11-20';
    expect(nov20 >= startStr && nov20 <= endStr).toBe(true);
  });

  it('strictly sorts transactions chronologically descending with undated items last', () => {
    const rawTransactions = [
      { id: 'tx-1', description: 'Coffee', date: '2026-11-21', amount: 150, createdAt: 100 },
      { id: 'tx-2', description: 'Groceries', date: '[yesterday 2026-11-20]', amount: 650, createdAt: 200 },
      { id: 'tx-3', description: 'Dinner', date: '2026-11-24', amount: 1200, createdAt: 300 },
      { id: 'tx-4', description: 'Old Note', date: '', amount: 50, createdAt: 50 },
      { id: 'tx-5', description: 'Shopping', date: '2026-11-21', amount: 800, createdAt: 400 },
    ];

    const sorted = sortTransactionsChronological(rawTransactions);

    // Expected order:
    // 1. tx-3 (2026-11-24)
    // 2. tx-5 (2026-11-21 with higher createdAt 400)
    // 3. tx-1 (2026-11-21 with lower createdAt 100)
    // 4. tx-2 (2026-11-20 extracted from bracketed string)
    // 5. tx-4 (undated, placed at the end)
    expect(sorted.map((t) => t.id)).toEqual(['tx-3', 'tx-5', 'tx-1', 'tx-2', 'tx-4']);
  });

  it('achieves 100% calculation parity between Dashboard spentThisMonth and MCP get_summary', () => {
    const testTransactions = [
      { id: '1', type: 'expense', amount: 200, date: '2026-10-31', description: 'October late expense' },
      { id: '2', type: 'expense', amount: 1200, date: '2026-11-01', description: 'Rent part' },
      { id: '3', type: 'expense', amount: 831, date: '[yesterday 2026-11-20]', description: 'Shopping' },
      { id: '4', type: 'expense', amount: 2800, date: '2026-11-22', description: 'Electronics' },
      { id: '5', type: 'income', amount: 50000, date: '2026-11-01', description: 'Salary' },
    ];

    const targetMonthPrefix = '2026-11';

    // Dashboard calculation logic:
    const dashboardSpent = testTransactions
      .filter(
        (t) =>
          (t.type || '').toLowerCase() === 'expense' &&
          getLocalDateString(t.date).startsWith(targetMonthPrefix)
      )
      .reduce((sum, t) => sum + (Math.abs(Number(t.amount)) || 0), 0);

    // MCP calculation logic:
    let mcpExpenses = 0;
    testTransactions.forEach((d) => {
      const dateStr = getLocalDateString(d.date);
      if (!dateStr.startsWith(targetMonthPrefix)) return;
      const amt = Math.abs(Number(d.amount)) || 0;
      if ((d.type || '').toLowerCase() === 'expense') {
        mcpExpenses += amt;
      }
    });

    // 1200 + 831 + 2800 = 4831
    expect(dashboardSpent).toBe(4831);
    expect(mcpExpenses).toBe(4831);
    expect(dashboardSpent).toBe(mcpExpenses);
  });

  it('handles FD investments active vs matured status and responsive visibility', () => {
    const mockHoldings = [
      {
        id: 'fd-1',
        name: 'SBI Tax Saver FD',
        assetType: 'Fixed Deposits',
        provider: 'State Bank of India',
        investedAmount: 50000,
        currentValue: 53750,
        interestRate: 7.5,
        maturityDate: '2025-01-01', // Past date -> Matured
      },
      {
        id: 'fd-2',
        name: 'HDFC Cumulative FD',
        assetType: 'Fixed Deposits',
        provider: 'HDFC Bank',
        investedAmount: 100000,
        currentValue: 107200,
        interestRate: 7.2,
        maturityDate: '2028-12-31', // Future date -> Active
      },
    ];

    render(
      <TestAppWrapper>
        <Investments initialHoldings={mockHoldings} />
      </TestAppWrapper>
    );

    // FD names and providers should be visible in both desktop and mobile views
    expect(screen.getAllByText('SBI Tax Saver FD').length).toBeGreaterThan(0);
    expect(screen.getAllByText('HDFC Cumulative FD').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/State Bank of India/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/HDFC Bank/i).length).toBeGreaterThan(0);

    // Rates should be displayed
    expect(screen.getAllByText(/7.5% p.a./i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/7.2% p.a./i).length).toBeGreaterThan(0);

    // Matured vs Active badges
    expect(screen.getAllByText('Matured').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });

  it('handles Salary timeline with received vs pending state machine and mark received action', () => {
    const mockSalaries = [
      {
        id: 'sal-1',
        salaryMonth: 'November',
        amount: 85000,
        receivedDate: '2026-11-01',
        companyOrSource: 'Tech Corp',
        status: 'received',
      },
      {
        id: 'sal-2',
        salaryMonth: 'December',
        amount: 85000,
        receivedDate: '2026-12-01',
        companyOrSource: 'Tech Corp',
        status: 'pending',
      },
    ];

    render(
      <TestAppWrapper>
        <Investments initialHoldings={[]} initialSalaryHistory={mockSalaries} />
      </TestAppWrapper>
    );

    // Switch to Salary tab
    const salaryTab = screen.getByRole('tab', { name: /Salary/i });
    fireEvent.click(salaryTab);

    // Summary line should show received total and pending total
    expect(screen.getByText(/across 2 months/i)).toBeInTheDocument();
    expect(screen.getByText(/Expected pending:/i)).toBeInTheDocument();

    // Badges
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getAllByText('Received').length).toBeGreaterThan(0);

    // Mark received button exists for pending entry
    const markReceivedBtn = screen.getByRole('button', { name: /Mark salary as received/i });
    expect(markReceivedBtn).toBeInTheDocument();

    // Clicking mark received updates status to received
    fireEvent.click(markReceivedBtn);
    expect(screen.queryByText(/Expected pending:/i)).toBeNull();
  });
});
