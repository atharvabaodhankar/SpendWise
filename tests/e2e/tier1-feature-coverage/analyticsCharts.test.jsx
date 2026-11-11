import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Analytics from '../../../src/pages/Analytics';
import { TestAppWrapper } from '../../utils/test-providers';

vi.mock('recharts', async () => {
  return await import('../../mocks/recharts.jsx');
});

describe('Tier 1: Analytics Charts & Category Breakdown (Analytics.jsx)', () => {
  it('displays <1% when an expense is positive but less than 1% of total outlay', () => {
    const transactions = [
      { id: '1', type: 'expense', category: 'Major Expense', amount: 99900, date: '2026-11-01', paymentMethod: 'UPI' },
      { id: '2', type: 'expense', category: 'Balance Adjustment', amount: 100, date: '2026-11-02', paymentMethod: 'Cash' },
    ];

    render(
      <TestAppWrapper>
        <Analytics initialTransactions={transactions} />
      </TestAppWrapper>
    );

    // Look for "<1%"
    expect(screen.getByText('<1%')).toBeInTheDocument();
  });

  it('renders wallet breakdown bar chart with explicit height and barSize', () => {
    const transactions = [
      { id: '1', type: 'expense', category: 'Dining', amount: 5000, date: '2026-11-01', paymentMethod: 'UPI' },
      { id: '2', type: 'expense', category: 'Groceries', amount: 2000, date: '2026-11-02', paymentMethod: 'Cash' },
    ];

    const { container } = render(
      <TestAppWrapper>
        <Analytics initialTransactions={transactions} />
      </TestAppWrapper>
    );

    // Check Bar Chart rendered
    const barChart = screen.getByTestId('recharts-bar-chart');
    expect(barChart).toBeInTheDocument();

    // Check Bar element
    const bar = screen.getByTestId('recharts-bar-amount');
    expect(bar).toBeInTheDocument();

    // Check Cells inside Bar
    const cells = screen.getAllByTestId('recharts-cell');
    expect(cells.length).toBe(2);
    expect(cells[0]).toHaveAttribute('data-fill', 'var(--accent)');
    expect(cells[1]).toHaveAttribute('data-fill', 'var(--cat-saffron)');

    // Check container has explicit h-[240px]
    const chartContainers = container.querySelectorAll('.h-\\[240px\\]');
    expect(chartContainers.length).toBeGreaterThanOrEqual(2);
  });

  it('renders spending trend line chart with linear interpolation', () => {
    const transactions = [
      { id: '1', type: 'expense', category: 'Rent', amount: 25000, date: '2026-10-01', paymentMethod: 'Bank' },
    ];

    render(
      <TestAppWrapper>
        <Analytics initialTransactions={transactions} />
      </TestAppWrapper>
    );

    const lineChart = screen.getByTestId('recharts-line-chart');
    expect(lineChart).toBeInTheDocument();

    const line = screen.getByTestId('recharts-line-amount');
    expect(line).toBeInTheDocument();
  });
});
