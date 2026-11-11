import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 2: Boundary - Debts Block Hidden State (Dashboard.jsx & DebtList.jsx)', () => {
  async function getDashboardComponent() {
    const res = await loadSrcModule('src/pages/Dashboard.jsx');
    assertContractAvailable(
      res,
      'Dashboard.jsx',
      'PROJECT.md § Dashboard: Debts block displays owed amounts in two plain rows with chevron linking to Friends modal, hidden if both zero.'
    );
    return res.Component;
  }

  it('completely hides Debts block container from DOM when owed and lent are both exactly 0', async () => {
    const Dashboard = await getDashboardComponent();
    const { container } = render(
      <TestAppWrapper>
        <Dashboard initialDebts={{ owed: 0, lent: 0 }} />
      </TestAppWrapper>
    );

    // Text labels must be absent
    expect(screen.queryByText(/you owe/i)).toBeNull();
    expect(screen.queryByText(/you are owed/i)).toBeNull();

    // Debts container element or section header must be completely absent from DOM
    const debtsContainer = container.querySelector('[data-testid="debts-block"], [aria-label*="debt"], #debts-block');
    expect(debtsContainer).toBeNull();
    expect(screen.queryByRole('heading', { name: /^debts$/i })).toBeNull();
  });

  it('displays Debts block when user owes money (owed > 0, lent = 0)', async () => {
    const Dashboard = await getDashboardComponent();
    render(
      <TestAppWrapper>
        <Dashboard initialDebts={{ owed: 2500, lent: 0 }} />
      </TestAppWrapper>
    );

    expect(screen.queryByText(/you owe/i) || screen.queryByText(/owe/i)).not.toBeNull();
  });

  it('displays Debts block when user is owed money (lent > 0, owed = 0)', async () => {
    const Dashboard = await getDashboardComponent();
    render(
      <TestAppWrapper>
        <Dashboard initialDebts={{ owed: 0, lent: 1800 }} />
      </TestAppWrapper>
    );

    expect(screen.queryByText(/owed to you|lent/i)).not.toBeNull();
  });

  it('renders two plain rows with chevron linking to Friends modal when active debts exist', async () => {
    const Dashboard = await getDashboardComponent();
    const { container } = render(
      <TestAppWrapper>
        <Dashboard initialDebts={{ owed: 1500, lent: 3200 }} />
      </TestAppWrapper>
    );

    const link = container.querySelector('[aria-label*="friend" i], [aria-label*="debt" i], svg[class*="lucide-chevron"], svg[class*="chevron"]');
    expect(link).not.toBeNull();
  });

  it('dynamically hides the Debts block container when debts are settled down to 0', async () => {
    const Dashboard = await getDashboardComponent();
    const { container, rerender } = render(
      <TestAppWrapper>
        <Dashboard initialDebts={{ owed: 500, lent: 0 }} />
      </TestAppWrapper>
    );

    expect(screen.queryAllByText(/owe/i).length).toBeGreaterThan(0);

    rerender(
      <Dashboard initialDebts={{ owed: 0, lent: 0 }} />
    );

    expect(screen.queryByText(/you owe/i)).toBeNull();
    const debtsContainer = container.querySelector('[data-testid="debts-block"], [aria-label*="debt"], #debts-block');
    expect(debtsContainer).toBeNull();
    expect(screen.queryByRole('heading', { name: /^debts$/i })).toBeNull();
  });
});
