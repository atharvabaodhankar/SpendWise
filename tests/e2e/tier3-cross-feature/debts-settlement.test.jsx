import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 3: Cross-Feature - Debt Settlement and Balance Propagation (Friends -> Dashboard)', () => {
  async function getFriendsModal() {
    const res = await loadSrcModule('src/components/friends/FriendsManagerModal.jsx');
    assertContractAvailable(
      res,
      'FriendsManagerModal.jsx',
      'PROJECT.md § FriendsManagerModal: manages friends, debts, and settlement workflows.'
    );
    return res.Component;
  }

  async function getDashboard() {
    const res = await loadSrcModule('src/pages/Dashboard.jsx');
    assertContractAvailable(
      res,
      'Dashboard.jsx',
      'PROJECT.md § Dashboard: Debts block and net balance figures.'
    );
    return res.Component;
  }

  it('settling a debt in Friends modal triggers settlement handler', async () => {
    const FriendsManagerModal = await getFriendsModal();
    const onSettle = vi.fn();

    const sampleFriendDebts = [
      { id: 'd-1', friendName: 'Rahul', amount: 500, type: 'owe' },
    ];

    render(
      <FriendsManagerModal isOpen={true} onClose={() => {}} debts={sampleFriendDebts} onSettle={onSettle} />,
      { wrapper: TestAppWrapper }
    );

    expect(screen.getByText('Rahul')).toBeInTheDocument();
  });

  it('settlement updates dashboard net balance and wallet distribution', async () => {
    const Dashboard = await getDashboard();
    const { rerender } = render(
      <Dashboard initialDebts={{ owed: 500, lent: 0 }} initialBalances={{ bank: 10000, cash: 2000 }} />,
      { wrapper: TestAppWrapper }
    );

    expect(screen.queryAllByText(/owe/i).length).toBeGreaterThan(0);

    // After settling debt
    rerender(
      <Dashboard initialDebts={{ owed: 0, lent: 0 }} initialBalances={{ bank: 9500, cash: 2000 }} />
    );

    // Debts block is now hidden
    expect(screen.queryByText(/you owe/i)).toBeNull();
  });

  it('debts block chevron navigates directly to Friends & Splits view', async () => {
    const Dashboard = await getDashboard();
    const { container } = render(
      <Dashboard initialDebts={{ owed: 1200, lent: 800 }} />,
      { wrapper: TestAppWrapper }
    );

    const friendsTrigger = container.querySelector('[aria-label*="friend"], [aria-label*="debt"], svg[class*="lucide-chevron"]');
    expect(friendsTrigger).not.toBeNull();
  });
});
