import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { MemoryRouter } from 'react-router-dom';

describe('Tier 1: F2 Monetary Display Component (Money.jsx)', () => {
  async function getMoneyComponent() {
    const res = await loadSrcModule('src/components/Money.jsx');
    assertContractAvailable(
      res,
      'Money.jsx',
      'PROJECT.md § Interface Contracts: Money.jsx requires props (amount, type, showSign, currency, subtext, isCash) and strict formatting (U+20B9, U+2212, tabular-nums font-sans).'
    );
    return res.Component;
  }

  it('renders native IBM Plex Sans rupee glyph (U+20B9)', async () => {
    const Money = await getMoneyComponent();
    const { container } = render(<Money amount={1500} />);
    expect(container.textContent).toContain('₹');
    expect(container.textContent).toContain('1,500');
  });

  it('enforces tabular figures (tabular-nums font-sans) and strictly prohibits font-mono', async () => {
    const Money = await getMoneyComponent();
    const { container } = render(<Money amount={2400} />);
    const el = container.firstElementChild;
    expect(el).not.toBeNull();
    // Must contain tabular-nums and font-sans
    expect(el.className).toMatch(/tabular-nums/);
    expect(el.className).not.toMatch(/font-mono/);
  });

  it('uses true mathematical minus sign (U+2212) for negative amounts', async () => {
    const Money = await getMoneyComponent();
    const { container } = render(<Money amount={-450} />);
    // True minus is \u2212
    expect(container.textContent).toContain('\u2212');
    // Must strictly catch standard ASCII hyphen even if followed by ₹ (e.g. -₹450, - 450, -450)
    expect(container.textContent).not.toMatch(/-[₹\s]*450/);
    expect(container.textContent).not.toContain('-₹');
  });

  it('applies --credit token styling for positive or credit type', async () => {
    const Money = await getMoneyComponent();
    const { container } = render(<Money amount={5000} type="credit" showSign />);
    const el = container.firstElementChild;
    expect(el.className).toMatch(/(--credit|text-credit)/);
    expect(container.textContent).toContain('+');
  });

  it('applies --debit token styling for negative or debit type', async () => {
    const Money = await getMoneyComponent();
    const { container } = render(<Money amount={1200} type="debit" showSign />);
    const el = container.firstElementChild;
    expect(el.className).toMatch(/(--debit|text-debit)/);
    expect(container.textContent).toContain('\u2212');
  });

  it('applies muted --ink-3 token styling for zero or neutral amount', async () => {
    const Money = await getMoneyComponent();
    const { container } = render(<Money amount={0} type="neutral" />);
    const el = container.firstElementChild;
    expect(el.className).toMatch(/(--ink-3|--ink|text-muted)/);
    expect(container.textContent).toContain('0');
  });

  it('renders balance manager link when cash balance is negative', async () => {
    const Money = await getMoneyComponent();
    const { container } = render(
      <MemoryRouter>
        <Money amount={-500} isCash={true} />
      </MemoryRouter>
    );
    expect(container.textContent).toContain('\u2212');
    // Expect inline link or trigger to balance manager
    const link = container.querySelector('a, button');
    expect(link).not.toBeNull();
    expect(link.textContent.toLowerCase()).toMatch(/(balance|edit|fix|manage)/);
  });
});
