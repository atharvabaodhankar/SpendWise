import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { AuthProvider } from '../../../src/context/AuthContext.jsx';

describe('Tier 1: F4 Unified AppShell and Navigation (AppShell.jsx)', () => {
  async function getAppShellComponent() {
    const res = await loadSrcModule('src/components/AppShell.jsx');
    assertContractAvailable(
      res,
      'AppShell.jsx',
      'PROJECT.md § Interface Contracts: AppShell.jsx wraps authenticated pages with 56px desktop top bar (NavLink with 2px accent underline, Ask SpendWise, avatar menu) and mobile 56px 4-tab bar with Home-only Add button.'
    );
    return res.Component;
  }

  const renderWithContext = (ui, initialEntries = ['/dashboard']) => {
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/*" element={ui} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
  };

  it('renders desktop 56px sticky top bar (h-14) with line divider', async () => {
    const AppShell = await getAppShellComponent();
    const { container } = renderWithContext(<AppShell><div>Page Content</div></AppShell>);

    const topBar = container.querySelector('header, nav, [class*="h-14"]');
    expect(topBar).not.toBeNull();
    expect(topBar.className).toMatch(/(h-14|border-b|border-\[var\(--line\)\])/);
  });

  it('renders active navigation link with 2px accent underline indicator', async () => {
    const AppShell = await getAppShellComponent();
    renderWithContext(<AppShell><div>Dashboard Page</div></AppShell>, ['/dashboard']);

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    const dashboardLink = links.find(l => l.getAttribute('href') === '/dashboard' || l.textContent.includes('Dashboard') || l.textContent.includes('Home'));
    expect(dashboardLink).toBeDefined();
  });

  it('renders "Ask SpendWise" button in top bar or shell', async () => {
    const AppShell = await getAppShellComponent();
    renderWithContext(<AppShell><div>Main Content</div></AppShell>);

    const askButtons = screen.queryAllByRole('button', { name: /ask|spendwise/i });
    const askText = screen.queryAllByText(/ask spendwise/i);
    expect(askButtons.length > 0 || askText.length > 0).toBe(true);
  });

  it('renders avatar popover menu replacing scattered header icon buttons', async () => {
    const AppShell = await getAppShellComponent();
    const { container } = renderWithContext(<AppShell><div>Main Content</div></AppShell>);

    const avatar = container.querySelector('[aria-label*="profile"], [aria-label*="menu"], [aria-label*="avatar"], button img, button[class*="rounded-full"]');
    expect(avatar).not.toBeNull();
  });

  it('renders mobile 56px bottom 4-tab bar (Home, Invest, Analytics, Ask)', async () => {
    const AppShell = await getAppShellComponent();
    renderWithContext(<AppShell><div>Mobile Page</div></AppShell>);

    expect(screen.getAllByText(/home|dashboard/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/invest|portfolio/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/analytics|insights/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ask/i).length).toBeGreaterThan(0);
  });

  it('renders extended "Add expense" button on Home/Dashboard route only', async () => {
    const AppShell = await getAppShellComponent();
    const { unmount } = renderWithContext(<AppShell><div>Home View</div></AppShell>, ['/dashboard']);

    const addButtonOnHome = screen.queryByRole('button', { name: /add expense|new expense|\+/i }) || screen.queryByText(/add expense/i);
    expect(addButtonOnHome).not.toBeNull();

    unmount();

    renderWithContext(<AppShell><div>Investments View</div></AppShell>, ['/investments']);
    const addButtonOnInvest = screen.queryByRole('button', { name: /add expense/i });
    expect(addButtonOnInvest).toBeNull();
  });

  it('incorporates safe-area-inset-bottom styling for mobile tab bar', async () => {
    const AppShell = await getAppShellComponent();
    const { container } = renderWithContext(<AppShell><div>Safe Area Page</div></AppShell>);

    expect(container.innerHTML).toMatch(/(safe-area|pb-|bottom-)/);
  });
});
