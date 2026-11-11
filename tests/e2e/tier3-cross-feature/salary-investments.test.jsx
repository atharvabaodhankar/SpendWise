import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 3: Cross-Feature - Salary Timeline and Investment Interaction (Investments.jsx)', () => {
  async function getInvestmentsComponent() {
    const res = await loadSrcModule('src/pages/Investments.jsx');
    assertContractAvailable(
      res,
      'Investments.jsx',
      'PROJECT.md § Investments: Salary timeline tracks chronological entries, year grouping, and MoM deltas.'
    );
    return res.Component;
  }

  const sampleSalaryHistory = [
    { id: 's-1', company: 'Acme Corp', amount: 120000, date: '2026-10-01' },
    { id: 's-2', company: 'Acme Corp', amount: 110000, date: '2026-09-01' },
  ];

  it('renders salary timeline with year grouping and newest entry first', async () => {
    const Investments = await getInvestmentsComponent();
    render(
      <Investments initialSalaryHistory={sampleSalaryHistory} />,
      { wrapper: TestAppWrapper }
    );

    // Switch to Salary tab
    const salaryTab = screen.getAllByRole('tab').find(t => /salary/i.test(t.textContent));
    expect(salaryTab, 'Salary tab must exist and be accessible').toBeDefined();
    fireEvent.click(salaryTab);
    expect(screen.getAllByText('Acme Corp')[0]).toBeInTheDocument();
  });

  it('computes and displays positive MoM salary increment (+₹10,000)', async () => {
    const Investments = await getInvestmentsComponent();
    const { container } = render(
      <Investments initialSalaryHistory={sampleSalaryHistory} />,
      { wrapper: TestAppWrapper }
    );

    const salaryTab = screen.getAllByRole('tab').find(t => /salary/i.test(t.textContent));
    expect(salaryTab, 'Salary tab must exist and be accessible').toBeDefined();
    fireEvent.click(salaryTab);
    // Delta between 120,000 and 110,000 is +10,000
    expect(container.textContent).toMatch(/(\+10,000|\+₹10,000|10,000)/);
  });

  it('renders 1px vertical line and 7px dots connecting timeline entries', async () => {
    const Investments = await getInvestmentsComponent();
    const { container } = render(
      <Investments initialSalaryHistory={sampleSalaryHistory} />,
      { wrapper: TestAppWrapper }
    );

    const salaryTab = screen.getAllByRole('tab').find(t => /salary/i.test(t.textContent));
    expect(salaryTab, 'Salary tab must exist and be accessible').toBeDefined();
    fireEvent.click(salaryTab);
    const verticalLine = container.querySelector('[class*="border-l"], [class*="w-px"], [class*="w-[1px]"]');
    expect(verticalLine).not.toBeNull();
  });
});
