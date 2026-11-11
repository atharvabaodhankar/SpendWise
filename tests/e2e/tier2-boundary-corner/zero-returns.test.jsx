import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 2: Boundary - Zero Returns Styling (Investments & Portfolio Summary)', () => {
  async function getInvestmentsComponent() {
    const res = await loadSrcModule('src/pages/Investments.jsx');
    assertContractAvailable(
      res,
      'Investments.jsx',
      'PROJECT.md § Investments: zero returns display strictly "₹0.00" in --ink-3 with "no change yet", never green +0.0%.'
    );
    return res.Component;
  }

  it('renders strictly "₹0.00" in muted ink (--ink-3) when portfolio returns are zero', async () => {
    const Investments = await getInvestmentsComponent();
    const { container } = render(
      <TestAppWrapper>
        <Investments initialHoldings={[]} />
      </TestAppWrapper>
    );

    // Explicitly assert "₹0.00"
    expect(container.textContent).toContain('₹0.00');

    // Explicitly assert --ink-3 color token
    expect(container.innerHTML).toMatch(/(--ink-3|text-muted)/);

    // Must never render green +0.0% or +0.00%
    expect(container.innerHTML).not.toContain('+0.0%');
    expect(container.innerHTML).not.toContain('+0.00%');
    expect(container.innerHTML).not.toContain('+0%');
    expect(container.innerHTML).not.toMatch(/\+0\.0+%/);
  });

  it('displays "no change yet" explanatory label when returns are zero', async () => {
    const Investments = await getInvestmentsComponent();
    const { container } = render(
      <TestAppWrapper>
        <Investments initialHoldings={[]} />
      </TestAppWrapper>
    );

    // Strictly require "no change yet" without fallback
    expect(container.textContent.toLowerCase()).toContain('no change yet');
  });

  it('prohibits credit and green positive styling classes when return percentage is 0.00%', async () => {
    const Investments = await getInvestmentsComponent();
    const { container } = render(
      <TestAppWrapper>
        <Investments initialHoldings={[{ id: 'h-1', type: 'Mutual Funds', invested: 10000, current: 10000 }]} />
      </TestAppWrapper>
    );

    // Check against redesign token text-[var(--credit)], text-credit, and legacy emerald/green
    const zeroCreditElement = container.querySelector(
      '[class*="text-[var(--credit)]"], [class*="text-credit"], [class*="text-emerald"], [class*="text-green"]'
    );
    if (zeroCreditElement && zeroCreditElement.textContent.includes('0.00')) {
      expect.fail('Zero returns must not be styled with credit/green text token');
    }

    // Ensure no positive plus sign attached to zero return
    expect(container.innerHTML).not.toContain('+0.0%');
    expect(container.innerHTML).not.toContain('+0.00%');
    expect(container.innerHTML).not.toMatch(/\+0\.0+%/);
  });

  it('transitions to credit color when returns become positive (> ₹0.00)', async () => {
    const Investments = await getInvestmentsComponent();
    const { container } = render(
      <TestAppWrapper>
        <Investments initialHoldings={[{ id: 'h-2', type: 'Stocks', invested: 10000, current: 12000 }]} />
      </TestAppWrapper>
    );

    expect(container.innerHTML).toMatch(/(--credit|text-credit|emerald|green)/);
  });

  it('transitions to debit color when returns become negative (< ₹0.00)', async () => {
    const Investments = await getInvestmentsComponent();
    const { container } = render(
      <TestAppWrapper>
        <Investments initialHoldings={[{ id: 'h-3', type: 'Crypto', invested: 10000, current: 8000 }]} />
      </TestAppWrapper>
    );

    expect(container.innerHTML).toMatch(/(--debit|text-debit|rose|red)/);
  });
});
