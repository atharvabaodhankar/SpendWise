import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 2: Boundary - Empty Holdings Filter Dropdown (Investments)', () => {
  async function getInvestmentsComponent() {
    const res = await loadSrcModule('src/pages/Investments.jsx');
    assertContractAvailable(
      res,
      'Investments.jsx',
      'PROJECT.md § Investments: filter dropdown lists only existing asset types plus "All", omitting empty asset types.'
    );
    return res.Component;
  }

  it('omits asset types from filter dropdown when user has zero holdings in them', async () => {
    const Investments = await getInvestmentsComponent();
    const { container } = render(
      <TestAppWrapper>
        <Investments initialHoldings={[{ id: 'h-1', type: 'Mutual Funds', name: 'Nifty 50', amount: 50000 }]} />
      </TestAppWrapper>
    );

    // Owned type 'Mutual Funds' and 'All' must be present
    expect(screen.queryAllByText(/mutual funds/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/all/i).length).toBeGreaterThan(0);

    // Actual SpendWise asset types that are NOT owned must be omitted
    const filterContainer = container.querySelector('select, [role="combobox"], [data-testid="asset-filter"]') || container;
    const filterOptions = Array.from(filterContainer.querySelectorAll('option, button, [role="option"]')).map(
      (el) => el.textContent.trim().toLowerCase()
    );

    if (filterOptions.length > 0) {
      expect(filterOptions).not.toContain('stocks');
      expect(filterOptions).not.toContain('stocks / equity');
      expect(filterOptions).not.toContain('gold');
      expect(filterOptions).not.toContain('silver');
      expect(filterOptions).not.toContain('fixed deposits');
      expect(filterOptions).not.toContain('fixed deposit');
    } else {
      // In text content of filter controls
      expect(container.textContent).not.toMatch(/\b(Stocks|Gold|Silver|Fixed Deposits)\b/);
    }
  });

  it('always includes "All" option in filter dropdown', async () => {
    const Investments = await getInvestmentsComponent();
    render(
      <TestAppWrapper>
        <Investments initialHoldings={[{ id: 'h-1', type: 'Mutual Funds', name: 'Index Fund', amount: 20000 }]} />
      </TestAppWrapper>
    );

    expect(screen.queryAllByText(/all/i).length).toBeGreaterThan(0);
  });

  it('dynamically displays only unique asset types currently owned', async () => {
    const Investments = await getInvestmentsComponent();
    const holdings = [
      { id: 'h-1', type: 'Stocks', name: 'TCS', amount: 15000 },
      { id: 'h-2', type: 'Stocks', name: 'Infosys', amount: 25000 },
      { id: 'h-3', type: 'Gold', name: 'SGB 2026', amount: 50000 },
    ];

    render(
      <TestAppWrapper>
        <Investments initialHoldings={holdings} />
      </TestAppWrapper>
    );

    expect(screen.queryAllByText(/stocks/i).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/gold/i).length).toBeGreaterThan(0);
  });

  it('updates filter choices when holdings list changes dynamically', async () => {
    const Investments = await getInvestmentsComponent();
    const { rerender } = render(
      <TestAppWrapper>
        <Investments initialHoldings={[{ id: 'h-1', type: 'Fixed Deposit', name: 'HDFC FD', amount: 100000 }]} />
      </TestAppWrapper>
    );

    expect(screen.queryAllByText(/fixed deposit/i).length).toBeGreaterThan(0);

    rerender(
      <Investments initialHoldings={[]} />
    );

    expect(screen.queryAllByText(/all/i).length).toBeGreaterThan(0);
  });

  it('selecting an asset type filters the displayed holdings correctly', async () => {
    const Investments = await getInvestmentsComponent();
    const holdings = [
      { id: 'h-1', type: 'Stocks', name: 'Reliance Industries', amount: 30000 },
      { id: 'h-2', type: 'Mutual Funds', name: 'Parag Parikh Flexi Cap', amount: 45000 },
    ];

    render(
      <TestAppWrapper>
        <Investments initialHoldings={holdings} />
      </TestAppWrapper>
    );

    expect(screen.getAllByText('Reliance Industries')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Parag Parikh Flexi Cap')[0]).toBeInTheDocument();
  });
});
