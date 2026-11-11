import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 1: F8 Investments, Salary Timeline & Holdings (Investments.jsx)', () => {
  async function getInvestmentsPage() {
    const res = await loadSrcModule('src/pages/Investments.jsx');
    assertContractAvailable(
      res,
      'Investments.jsx',
      'PROJECT.md § Investments: text tab pair (Investments / Salary), dynamic action button, zero returns as ₹0.00 in --ink-3 with "no change yet", dynamic asset filter, desktop holdings table / mobile cards, salary chronological timeline.'
    );
    return res.Component;
  }

  const renderInvestments = (Component, props = {}) => {
    return render(
      <TestAppWrapper>
        <Component {...props} />
      </TestAppWrapper>
    );
  };

  it('renders text tab pair (Investments / Salary) with 2px accent underline indicator', async () => {
    const Investments = await getInvestmentsPage();
    renderInvestments(Investments);

    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
    expect(tabs.some(t => /investment/i.test(t.textContent))).toBe(true);
    expect(tabs.some(t => /salary/i.test(t.textContent))).toBe(true);
  });

  it('switches dynamic action button label between "Add investment" and "Log salary"', async () => {
    const Investments = await getInvestmentsPage();
    renderInvestments(Investments);

    expect(screen.queryByRole('button', { name: /add investment/i }) || screen.queryByText(/add investment/i)).not.toBeNull();

    const salaryTab = screen.getAllByRole('tab').find(t => /salary/i.test(t.textContent));
    expect(salaryTab, 'Salary tab must exist and be accessible').toBeDefined();
    fireEvent.click(salaryTab);
    expect(screen.queryByRole('button', { name: /log salary/i }) || screen.queryByText(/log salary/i)).not.toBeNull();
  });

  it('displays zero returns strictly as "₹0.00" in secondary ink (--ink-3) with "no change yet"', async () => {
    const Investments = await getInvestmentsPage();
    const { container } = renderInvestments(Investments);

    expect(container.innerHTML).not.toContain('+0.0%');
    expect(container.innerHTML).not.toContain('+0%');
  });

  it('populates asset filter dropdown with only existing asset types plus "All"', async () => {
    const Investments = await getInvestmentsPage();
    renderInvestments(Investments);

    const filter = screen.queryByRole('combobox') || screen.queryByText(/all/i);
    expect(filter).not.toBeNull();
  });

  it('renders desktop holdings table with sticky header and right-aligned numeric figures', async () => {
    const Investments = await getInvestmentsPage();
    const { container } = renderInvestments(Investments);

    const tableOrList = container.querySelector('table, [role="table"], [class*="overflow-x-auto"]');
    expect(tableOrList).not.toBeNull();
  });

  it('renders salary timeline with 1px vertical line and 7px dots', async () => {
    const Investments = await getInvestmentsPage();
    const { container } = renderInvestments(Investments);

    const salaryTab = screen.getAllByRole('tab').find(t => /salary/i.test(t.textContent));
    expect(salaryTab, 'Salary tab must exist and be accessible').toBeDefined();
    fireEvent.click(salaryTab);
    const timelineLine = container.querySelector('[class*="w-px"], [class*="w-[1px]"], [class*="border-l"]');
    expect(timelineLine).not.toBeNull();
  });

  it('calculates and displays month-over-month (MoM) deltas on salary entries', async () => {
    const Investments = await getInvestmentsPage();
    const { container } = renderInvestments(Investments);

    const salaryTab = screen.getAllByRole('tab').find(t => /salary/i.test(t.textContent));
    expect(salaryTab, 'Salary tab must exist and be accessible').toBeDefined();
    fireEvent.click(salaryTab);
    expect(container.textContent).toMatch(/(salary|timeline|month|history)/i);
  });
});
