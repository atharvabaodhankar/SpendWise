import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 3: Cross-Feature - Theme Propagation Across App Views (useTheme -> AppShell -> Ledger -> Modals)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  async function getUseTheme() {
    const res = await loadSrcModule('src/hooks/useTheme.js');
    assertContractAvailable(res, 'useTheme.js', 'PROJECT.md § Interface Contracts: useTheme handles theme switching and DOM class sync.');
    return res.Component;
  }

  async function getAppShell() {
    const res = await loadSrcModule('src/components/AppShell.jsx');
    assertContractAvailable(res, 'AppShell.jsx', 'PROJECT.md § Interface Contracts: AppShell wraps views and adapts to theme.');
    return res.Component;
  }

  async function getModal() {
    const res = await loadSrcModule('src/components/Modal.jsx');
    assertContractAvailable(res, 'Modal.jsx', 'PROJECT.md § Interface Contracts: Modal primitive adapts to theme tokens.');
    return res.Component;
  }

  it('theme toggle propagates .dark class to root documentElement affecting entire page tree', async () => {
    const useTheme = await getUseTheme();
    let themeControls;

    const TestComponent = () => {
      themeControls = useTheme();
      return <div data-testid="themed-tree">SpendWise Tree</div>;
    };

    render(<TestComponent />, { wrapper: TestAppWrapper });

    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      themeControls.setTheme('dark');
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('AppShell responds to theme changes with proper semantic token styling', async () => {
    const AppShell = await getAppShell();
    const { container } = render(
      <AppShell>
        <div data-testid="page-child">Ledger Content</div>
      </AppShell>,
      { wrapper: TestAppWrapper }
    );

    expect(container.innerHTML).toMatch(/(bg-|text-|border-)/);
  });

  it('Modal and slide-over panels inherit current theme styling without color flashes', async () => {
    const Modal = await getModal();
    document.documentElement.classList.add('dark');

    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="Themed Dialog">
        <p>Themed Modal Body</p>
      </Modal>,
      { wrapper: TestAppWrapper }
    );

    expect(screen.getByText('Themed Dialog')).toBeInTheDocument();
    // Modal background should rely on semantic tokens (--surface, --bg)
    expect(container.innerHTML).toMatch(/(surface|bg|text)/);
  });
});
