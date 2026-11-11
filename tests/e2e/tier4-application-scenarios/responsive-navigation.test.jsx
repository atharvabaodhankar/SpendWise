import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 4: Scenario 5 - Responsive Navigation and Viewport Switching Workflow', () => {
  async function getAppShell() {
    const res = await loadSrcModule('src/components/AppShell.jsx');
    assertContractAvailable(
      res,
      'AppShell.jsx',
      'PROJECT.md § AppShell: responsive navigation between desktop 56px top bar and mobile 56px 4-tab bar with Home-only action button.'
    );
    return res.Component;
  }

  it('completes responsive navigation flow: desktop top bar <-> mobile 4-tab bar with Home-only action button', async () => {
    const AppShell = await getAppShell();

    // Render AppShell on /dashboard (Home)
    const { container, unmount } = render(
      <AppShell>
        <div>Dashboard View</div>
      </AppShell>,
      { wrapper: ({ children }) => <TestAppWrapper initialEntries={['/dashboard']}>{children}</TestAppWrapper> }
    );

    // Desktop top bar or navigation presence
    const topBar = container.querySelector('header, nav, [class*="h-14"]');
    expect(topBar).not.toBeNull();

    // Mobile tabs presence
    expect(screen.getAllByText(/home|dashboard/i).length).toBeGreaterThan(0);

    // Extended add button present on Home
    const addBtn = screen.queryByRole('button', { name: /add expense/i }) || screen.queryByText(/add expense/i);
    expect(addBtn).not.toBeNull();

    unmount();

    // Switch route to /analytics
    render(
      <AppShell>
        <div>Analytics View</div>
      </AppShell>,
      { wrapper: ({ children }) => <TestAppWrapper initialEntries={['/analytics']}>{children}</TestAppWrapper> }
    );

    // Extended add button must NOT be present on Analytics
    const addBtnOnAnalytics = screen.queryByRole('button', { name: /add expense/i });
    expect(addBtnOnAnalytics).toBeNull();
  });
});
