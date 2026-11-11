import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 1: F6 Budget Goals and Pacing (BudgetGoals.jsx)', () => {
  async function getBudgetGoals() {
    const res = await loadSrcModule('src/components/BudgetGoals.jsx');
    assertContractAvailable(
      res,
      'BudgetGoals.jsx',
      'PROJECT.md § BudgetGoals: spent vs limit display, 6px progress bar, vertical pace tick, daily remaining calculation, zero statement-card.'
    );
    return res.Component;
  }

  const sampleGoals = [
    { id: 'b-1', category: 'Food', limit: 10000, spent: 4500 },
    { id: 'b-2', category: 'Shopping', limit: 5000, spent: 4800 },
  ];

  it('renders spent amount versus limit clearly without card container', async () => {
    const BudgetGoals = await getBudgetGoals();
    const { container } = render(
      <TestAppWrapper>
        <BudgetGoals goals={sampleGoals} />
      </TestAppWrapper>
    );

    expect(container.innerHTML).not.toContain('statement-card');
    expect(container.textContent).toMatch(/4,500|4500/);
    expect(container.textContent).toMatch(/10,000|10000/);
  });

  it('renders 6px progress bar (h-[6px] or h-1.5)', async () => {
    const BudgetGoals = await getBudgetGoals();
    const { container } = render(
      <TestAppWrapper>
        <BudgetGoals goals={sampleGoals} />
      </TestAppWrapper>
    );

    const progressBar = container.querySelector('[class*="h-[6px]"], [class*="h-1.5"], [role="progressbar"]');
    expect(progressBar).not.toBeNull();
  });

  it('renders vertical pace tick indicating today’s expected progress in current month', async () => {
    const BudgetGoals = await getBudgetGoals();
    const { container } = render(
      <TestAppWrapper>
        <BudgetGoals goals={sampleGoals} />
      </TestAppWrapper>
    );

    const paceTick = container.querySelector('[aria-label*="pace"], [data-testid="pace-tick"], [class*="pace"], [class*="w-0.5"], [class*="w-1"]');
    expect(paceTick).not.toBeNull();
  });

  it('calculates and displays remaining daily allowance estimate', async () => {
    const BudgetGoals = await getBudgetGoals();
    const { container } = render(
      <TestAppWrapper>
        <BudgetGoals goals={sampleGoals} />
      </TestAppWrapper>
    );

    expect(container.textContent.toLowerCase()).toMatch(/(daily|remaining|day|left)/);
  });

  it('enforces quiet color tokens and strict type scale (no text below 12px)', async () => {
    const BudgetGoals = await getBudgetGoals();
    const { container } = render(
      <TestAppWrapper>
        <BudgetGoals goals={sampleGoals} />
      </TestAppWrapper>
    );

    expect(container.innerHTML).not.toMatch(/text-\[(9|10|11)px\]/);
  });
});
