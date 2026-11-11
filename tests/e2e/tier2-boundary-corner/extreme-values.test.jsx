import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';

describe('Tier 2: Boundary - Extreme Monetary Values and Precision (Money.jsx)', () => {
  async function getMoneyComponent() {
    const res = await loadSrcModule('src/components/Money.jsx');
    assertContractAvailable(
      res,
      'Money.jsx',
      'PROJECT.md § Interface Contracts: Money.jsx handles negative values (\u2212), Indian number format (lakh/crore), paise precision, and cash deficit warnings.'
    );
    return res.Component;
  }

  it('formats large crore amounts (₹1,00,00,000) using Indian numbering system', async () => {
    const Money = await getMoneyComponent();
    const { container } = render(<Money amount={10000000} />);
    expect(container.textContent).toMatch(/1,00,00,000/);
  });

  it('formats large lakh amounts (₹5,50,000) using Indian grouping (2,2,3)', async () => {
    const Money = await getMoneyComponent();
    const { container } = render(<Money amount={550000} />);
    expect(container.textContent).toMatch(/5,50,000/);
  });

  it('preserves exact fractional paise precision (₹1,23,456.78)', async () => {
    const Money = await getMoneyComponent();
    const { container } = render(<Money amount={123456.78} />);
    expect(container.textContent).toMatch(/1,23,456\.78/);
  });

  it('handles negative net balance with true minus sign and debit token', async () => {
    const Money = await getMoneyComponent();
    const { container } = render(<Money amount={-75000} />);
    expect(container.textContent).toContain('\u2212');
    expect(container.innerHTML).toMatch(/(--debit|text-debit|rose|red)/);
  });

  it('does NOT render negative cash warning when cash balance is exactly zero', async () => {
    const Money = await getMoneyComponent();
    const { container } = render(
      <MemoryRouter>
        <Money amount={0} isCash={true} />
      </MemoryRouter>
    );
    expect(container.textContent).not.toContain('\u2212');
    expect(container.querySelector('a, button')).toBeNull();
  });

  it('renders inline balance manager link when cash balance is strictly negative (< 0)', async () => {
    const Money = await getMoneyComponent();
    const { container } = render(
      <MemoryRouter>
        <Money amount={-150} isCash={true} />
      </MemoryRouter>
    );
    expect(container.textContent).toContain('\u2212');
    const link = container.querySelector('a, button');
    expect(link).not.toBeNull();
  });
});
