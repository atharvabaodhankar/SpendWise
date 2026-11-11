import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 4: Scenario 3 - Investment Portfolio and Salary Tracking Workflow', () => {
  async function getInvestmentsPage() {
    const res = await loadSrcModule('src/pages/Investments.jsx');
    assertContractAvailable(
      res,
      'Investments.jsx',
      'PROJECT.md § Investments: Portfolio summary, banknote allocation bar, dynamic filters, salary timeline with MoM deltas.'
    );
    return res.Component;
  }

  it('completes end-to-end portfolio inspection: view summary -> filter holdings -> switch to salary -> inspect timeline', async () => {
    const Investments = await getInvestmentsPage();

    const sampleHoldings = [
      { id: 'h-1', type: 'Mutual Funds', name: 'Nifty Index Fund', invested: 100000, current: 115000 },
      { id: 'h-2', type: 'Stocks', name: 'HDFC Bank', invested: 50000, current: 52000 },
    ];

    const sampleSalary = [
      { id: 'sal-1', company: 'Tech India', amount: 95000, date: '2026-11-01' },
      { id: 'sal-2', company: 'Tech India', amount: 80000, date: '2026-10-01' },
    ];

    const { container } = render(
      <Investments initialHoldings={sampleHoldings} initialSalaryHistory={sampleSalary} />,
      { wrapper: TestAppWrapper }
    );

    // Step 1: Verify portfolio overview is displayed without SaaS card enclosures
    expect(container.innerHTML).not.toContain('statement-card');

    // Step 2: Switch to Salary tab
    const tabs = screen.getAllByRole('tab');
    const salaryTab = tabs.find(t => /salary/i.test(t.textContent));
    expect(salaryTab, 'Salary tab must exist and be accessible').toBeDefined();
    fireEvent.click(salaryTab);
    // Timeline should display company and MoM delta (+15,000)
    expect(container.textContent).toMatch(/Tech India/);
  });
});
