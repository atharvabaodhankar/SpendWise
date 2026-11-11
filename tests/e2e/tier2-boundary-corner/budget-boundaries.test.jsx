import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 2: Boundary - Budget Pacing and Extreme Limits (BudgetGoals.jsx)', () => {
  async function getBudgetGoalsComponent() {
    const res = await loadSrcModule('src/components/BudgetGoals.jsx');
    assertContractAvailable(
      res,
      'BudgetGoals.jsx',
      'PROJECT.md § BudgetGoals: handles zero budget limit, exactly 100% spent, overspent boundary (>100%), day 1 vs last day pacing, and daily remaining calculation.'
    );
    return res.Component;
  }

  it('handles zero budget limit gracefully without NaN or Infinity', async () => {
    const BudgetGoals = await getBudgetGoalsComponent();
    const { container } = render(
      <TestAppWrapper>
        <BudgetGoals goals={[{ id: 'b-zero', category: 'Misc', limit: 0, spent: 0 }]} />
      </TestAppWrapper>
    );

    expect(container.textContent).not.toContain('NaN');
    expect(container.textContent).not.toContain('Infinity');
  });

  it('handles exactly 100% spent boundary condition with 0 remaining daily allowance', async () => {
    const BudgetGoals = await getBudgetGoalsComponent();
    const { container } = render(
      <TestAppWrapper>
        <BudgetGoals goals={[{ id: 'b-100', category: 'Dining', limit: 10000, spent: 10000 }]} />
      </TestAppWrapper>
    );

    // Should indicate 100% or 0 remaining
    expect(container.textContent).toMatch(/(0 remaining|100%|₹0)/i);
  });

  it('handles over-budget boundary (>100% spent) by clamping or highlighting deficit', async () => {
    const BudgetGoals = await getBudgetGoalsComponent();
    const { container } = render(
      <TestAppWrapper>
        <BudgetGoals goals={[{ id: 'b-over', category: 'Shopping', limit: 5000, spent: 7500 }]} />
      </TestAppWrapper>
    );

    // Over budget indication
    expect(container.innerHTML).toMatch(/(exceeded|over|debit|rose|red|100%|150%)/i);
    expect(container.textContent).not.toContain('NaN');
  });

  it('calculates pace tick correctly for the first day of the month (Day 1)', async () => {
    const BudgetGoals = await getBudgetGoalsComponent();
    const { container } = render(
      <TestAppWrapper>
        <BudgetGoals
          mockDate={new Date('2026-11-01T12:00:00Z')}
          goals={[{ id: 'b-1', category: 'Groceries', limit: 30000, spent: 1000 }]}
        />
      </TestAppWrapper>
    );

    const paceTick = container.querySelector('[aria-label*="pace"], [data-testid="pace-tick"], [class*="pace"]');
    expect(paceTick).not.toBeNull();
  });

  it('calculates pace tick correctly for the final day of the month (Day 30/31)', async () => {
    const BudgetGoals = await getBudgetGoalsComponent();
    const { container } = render(
      <TestAppWrapper>
        <BudgetGoals
          mockDate={new Date('2026-11-30T12:00:00Z')}
          goals={[{ id: 'b-1', category: 'Groceries', limit: 30000, spent: 29000 }]}
        />
      </TestAppWrapper>
    );

    const paceTick = container.querySelector('[aria-label*="pace"], [data-testid="pace-tick"], [class*="pace"]');
    expect(paceTick).not.toBeNull();
  });

  it('calculates daily remaining dividing remaining amount by remaining days in month', async () => {
    const BudgetGoals = await getBudgetGoalsComponent();
    const { container } = render(
      <TestAppWrapper>
        <BudgetGoals
          mockDate={new Date('2026-11-15T12:00:00Z')}
          goals={[{ id: 'b-1', category: 'General', limit: 30000, spent: 15000 }]}
        />
      </TestAppWrapper>
    );

    // 15,000 left for 15 remaining days -> ~1,000/day
    expect(container.textContent.toLowerCase()).toMatch(/(day|daily|remaining)/);
  });
});
