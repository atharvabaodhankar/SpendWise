import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 1: F7 Debts & Settlements Block (Dashboard.jsx & Debts Widget)', () => {
  async function getDashboard() {
    const res = await loadSrcModule('src/pages/Dashboard.jsx');
    assertContractAvailable(
      res,
      'Dashboard.jsx',
      'PROJECT.md § Dashboard: Debts block displays owed amounts in two plain rows (hidden if both zero) with chevron linking to Friends modal.'
    );
    return res.Component;
  }

  it('renders two plain rows displaying owed amounts (owed to you and you owe)', async () => {
    const Dashboard = await getDashboard();
    const { container } = render(
      <TestAppWrapper>
        <Dashboard initialDebts={{ owed: 1500, lent: 2800 }} />
      </TestAppWrapper>
    );

    // Two distinct labels for debts
    const oweLabel = screen.queryByText(/^you owe$/i) || screen.queryAllByText(/you owe/i)[0];
    const lentLabel = screen.queryByText(/owed to you|you are owed|lent/i);

    expect(oweLabel, 'Debts block must render a "you owe" row').not.toBeNull();
    expect(lentLabel, 'Debts block must render an "owed to you" row').not.toBeNull();

    // Check for monetary values rendered in the rows
    expect(container.textContent).toMatch(/1,?500/);
    expect(container.textContent).toMatch(/2,?800/);
  });

  it('completely hides Debts block from DOM when both owed and lent are zero', async () => {
    const Dashboard = await getDashboard();
    const { container } = render(
      <TestAppWrapper>
        <Dashboard initialDebts={{ owed: 0, lent: 0 }} />
      </TestAppWrapper>
    );

    // Text labels must be absent
    expect(screen.queryByText(/you owe/i)).toBeNull();
    expect(screen.queryByText(/you are owed/i)).toBeNull();

    // Section container or heading must not be rendered in DOM
    const debtsContainer = container.querySelector('[data-testid="debts-block"], [aria-label*="debt"], #debts-block');
    expect(debtsContainer).toBeNull();
    expect(screen.queryByRole('heading', { name: /^debts$/i })).toBeNull();
  });

  it('provides a chevron link or button navigating to Friends modal', async () => {
    const Dashboard = await getDashboard();
    const { container } = render(
      <TestAppWrapper>
        <Dashboard initialDebts={{ owed: 1200, lent: 3400 }} />
      </TestAppWrapper>
    );

    // Must provide chevron linking to Friends modal
    const friendsTrigger = container.querySelector(
      '[aria-label*="friend" i], [aria-label*="debt" i], svg[class*="lucide-chevron"], svg[class*="chevron"]'
    );
    expect(friendsTrigger, 'Chevron trigger to Friends modal must exist in Debts block').not.toBeNull();
  });

  it('updates displayed debts dynamically when a debt settlement occurs', async () => {
    const Dashboard = await getDashboard();
    const { rerender } = render(
      <TestAppWrapper>
        <Dashboard initialDebts={{ owed: 900, lent: 1400 }} />
      </TestAppWrapper>
    );

    expect(screen.queryAllByText(/you owe|owe/i).length).toBeGreaterThan(0);

    // Settle owed amount down to 0
    rerender(
      <Dashboard initialDebts={{ owed: 0, lent: 1400 }} />
    );

    // Lent remains, owed is cleared or zeroed
    expect(screen.queryByText(/owed to you|you are owed|lent/i)).not.toBeNull();
  });

  it('enforces plain text typography without cards, gradients, or pastel badges', async () => {
    const Dashboard = await getDashboard();
    const { container } = render(
      <TestAppWrapper>
        <Dashboard initialDebts={{ owed: 500, lent: 750 }} />
      </TestAppWrapper>
    );

    // Debts block must not use legacy cards or pastel chips
    const debtsSection = container.querySelector('[data-testid="debts-block"]') || container;
    expect(debtsSection.innerHTML).not.toContain('statement-card');
    expect(debtsSection.innerHTML).not.toContain('passbook-card');
    expect(debtsSection.innerHTML).not.toContain('stamp-pill');
    expect(debtsSection.innerHTML).not.toMatch(/bg-(emerald|rose|blue)-100/);
  });
});
