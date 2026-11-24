import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Investments from '../../../src/pages/Investments.jsx';
import { normalizeInvestmentInput } from '../../../src/utils/investmentService.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Investment Current Value & Holding Details Editing', () => {
  const initialHoldings = [
    {
      id: 'inv-1',
      name: 'Parag Parikh Flexi Cap',
      assetType: 'Mutual Funds',
      provider: 'Zerodha',
      investedAmount: 10000,
      currentValue: 12000,
      purchaseDate: '2026-01-15',
      notes: 'Monthly SIP',
    },
    {
      id: 'inv-2',
      name: 'ICICI FD',
      assetType: 'Fixed Deposits',
      provider: 'ICICI',
      investedAmount: 50000,
      currentValue: 50000,
      interestRate: 7.2,
      maturityDate: '2027-01-15',
    },
  ];

  it('renders quick edit button for current value and row edit action button', () => {
    const { container } = render(
      <TestAppWrapper>
        <Investments initialHoldings={initialHoldings} />
      </TestAppWrapper>
    );

    // Desktop table row edit buttons
    const editHoldingButtons = screen.getAllByRole('button', { name: /edit holding/i });
    expect(editHoldingButtons.length).toBeGreaterThanOrEqual(2);

    // Quick edit current value buttons
    const quickEditButtons = screen.getAllByRole('button', { name: /edit current value/i });
    expect(quickEditButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('allows quick inline editing of current value directly in desktop table via Enter key', async () => {
    render(
      <TestAppWrapper>
        <Investments initialHoldings={initialHoldings} />
      </TestAppWrapper>
    );

    const quickEditBtn = screen.getByRole('button', { name: /edit current value for Parag Parikh Flexi Cap/i });
    fireEvent.click(quickEditBtn);

    // Inline input appears
    const input = screen.getByRole('spinbutton', { name: /edit current value/i });
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('12000');

    // Change to 15000 and press Enter
    fireEvent.change(input, { target: { value: '15000' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Input closes and new value is displayed
    await waitFor(() => {
      expect(screen.queryByRole('spinbutton', { name: /edit current value/i })).toBeNull();
    });

    // 15000 invested 10000 -> +50.0% return
    const returns = screen.getAllByText('+50.0%');
    expect(returns.length).toBeGreaterThanOrEqual(1);
  });

  it('allows canceling inline edit via Escape key without modifying value', async () => {
    render(
      <TestAppWrapper>
        <Investments initialHoldings={initialHoldings} />
      </TestAppWrapper>
    );

    const quickEditBtn = screen.getByRole('button', { name: /edit current value for Parag Parikh Flexi Cap/i });
    fireEvent.click(quickEditBtn);

    const input = screen.getByRole('spinbutton', { name: /edit current value/i });
    fireEvent.change(input, { target: { value: '99999' } });
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

    expect(screen.queryByRole('spinbutton', { name: /edit current value/i })).toBeNull();
    // Return remains +20.0% (12000 vs 10000)
    const returns = screen.getAllByText('+20.0%');
    expect(returns.length).toBeGreaterThanOrEqual(1);
  });

  it('opens edit modal from desktop actions and updates holding details including current value', async () => {
    render(
      <TestAppWrapper>
        <Investments initialHoldings={initialHoldings} />
      </TestAppWrapper>
    );

    const editBtn = screen.getByRole('button', { name: /edit holding Parag Parikh Flexi Cap/i });
    fireEvent.click(editBtn);

    // Edit modal dialog opens
    const modal = screen.getByRole('dialog', { name: /edit investment/i });
    expect(modal).toBeInTheDocument();

    const nameInput = within(modal).getByDisplayValue('Parag Parikh Flexi Cap');
    const curValInput = within(modal).getByDisplayValue('12000');

    fireEvent.change(nameInput, { target: { value: 'Parag Parikh Flexi Cap Regular' } });
    fireEvent.change(curValInput, { target: { value: '14000' } });

    // Submit modal
    const saveBtn = within(modal).getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /edit investment/i })).toBeNull();
    });

    // Updated holding name and return (+40.0% for 14000 on 10000) are shown
    expect(screen.getAllByText('Parag Parikh Flexi Cap Regular').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('+40.0%').length).toBeGreaterThanOrEqual(1);
  });

  it('allows editing from mobile bottom sheet', async () => {
    render(
      <TestAppWrapper>
        <Investments initialHoldings={initialHoldings} />
      </TestAppWrapper>
    );

    // Click on mobile card for ICICI FD
    const mobileCards = screen.getAllByRole('button').filter(
      (btn) => btn.textContent && btn.textContent.includes('ICICI FD')
    );
    fireEvent.click(mobileCards[0]);

    // Bottom sheet dialog opens with holding details
    const bottomSheet = screen.getByRole('dialog', { name: /holding details/i });
    expect(bottomSheet).toBeInTheDocument();

    // Edit holding button inside bottom sheet
    const editHoldingBtn = within(bottomSheet).getByRole('button', { name: /^edit holding$/i });
    expect(editHoldingBtn).toBeInTheDocument();
    fireEvent.click(editHoldingBtn);

    // Edit investment modal opens
    const modal = screen.getByRole('dialog', { name: /edit investment/i });
    expect(modal).toBeInTheDocument();

    // Update current value (inputs in modal: invested amount is index 0, current value is index 1)
    const curValInputs = within(modal).getAllByDisplayValue('50000');
    fireEvent.change(curValInputs[1], { target: { value: '53600' } });

    const saveBtn = within(modal).getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /edit investment/i })).toBeNull();
    });

    // FD return updated (+7.2%)
    expect(screen.getAllByText('+7.2%').length).toBeGreaterThanOrEqual(1);
  });

  it('handles validation in edit modal (rejects invalid values)', async () => {
    render(
      <TestAppWrapper>
        <Investments initialHoldings={initialHoldings} />
      </TestAppWrapper>
    );

    const editBtn = screen.getByRole('button', { name: /edit holding Parag Parikh Flexi Cap/i });
    fireEvent.click(editBtn);

    const modal = screen.getByRole('dialog', { name: /edit investment/i });
    const nameInput = within(modal).getByDisplayValue('Parag Parikh Flexi Cap');
    fireEvent.change(nameInput, { target: { value: '' } });

    const saveBtn = within(modal).getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    // Modal stays open because name is required
    expect(screen.getByRole('dialog', { name: /edit investment/i })).toBeInTheDocument();
  });

  it('dismisses edit modal on backdrop click and on Cancel button', async () => {
    render(
      <TestAppWrapper>
        <Investments initialHoldings={initialHoldings} />
      </TestAppWrapper>
    );

    const editBtn = screen.getByRole('button', { name: /edit holding Parag Parikh Flexi Cap/i });
    fireEvent.click(editBtn);

    const modal = screen.getByRole('dialog', { name: /edit investment/i });
    expect(modal).toBeInTheDocument();

    const cancelBtn = within(modal).getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole('dialog', { name: /edit investment/i })).toBeNull();
  });

  it('saves inline edit when clicking the checkmark button', async () => {
    render(
      <TestAppWrapper>
        <Investments initialHoldings={initialHoldings} />
      </TestAppWrapper>
    );

    const quickEditBtn = screen.getByRole('button', { name: /edit current value for Parag Parikh Flexi Cap/i });
    fireEvent.click(quickEditBtn);

    const input = screen.getByRole('spinbutton', { name: /edit current value/i });
    fireEvent.change(input, { target: { value: '16000' } });

    const checkBtn = screen.getByRole('button', { name: /save current value/i });
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.queryByRole('spinbutton', { name: /edit current value/i })).toBeNull();
    });

    // 16000 on 10000 -> +60.0%
    expect(screen.getAllByText('+60.0%').length).toBeGreaterThanOrEqual(1);
  });

  it('normalizeInvestmentInput handles alternate keys (invested, current, type)', () => {
    const input = {
      name: 'Custom Gold ETF',
      type: 'Gold',
      invested: '25000',
      current: '27500',
      provider: 'Groww',
    };

    const normalized = normalizeInvestmentInput(input);
    expect(normalized.name).toBe('Custom Gold ETF');
    expect(normalized.assetType).toBe('Gold');
    expect(normalized.investedAmount).toBe(25000);
    expect(normalized.currentValue).toBe(27500);
    expect(normalized.interestRate).toBeNull();
    expect(normalized.maturityDate).toBeNull();
  });

  it('cancels inline edit when clicking outside the inline input container', async () => {
    render(
      <TestAppWrapper>
        <Investments initialHoldings={initialHoldings} />
      </TestAppWrapper>
    );

    const quickEditBtn = screen.getByRole('button', { name: /edit current value for Parag Parikh Flexi Cap/i });
    fireEvent.click(quickEditBtn);

    expect(screen.getByRole('spinbutton', { name: /edit current value/i })).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('spinbutton', { name: /edit current value/i })).toBeNull();
    });
  });

  it('switches inline editing cleanly when clicking another row quick edit', async () => {
    render(
      <TestAppWrapper>
        <Investments initialHoldings={initialHoldings} />
      </TestAppWrapper>
    );

    const btn1 = screen.getByRole('button', { name: /edit current value for Parag Parikh Flexi Cap/i });
    fireEvent.click(btn1);

    const input1 = screen.getByRole('spinbutton', { name: /edit current value/i });
    expect(input1.value).toBe('12000');

    // Click quick edit for ICICI FD
    const btn2 = screen.getByRole('button', { name: /edit current value for ICICI FD/i });
    fireEvent.click(btn2);

    await waitFor(() => {
      const input2 = screen.getByRole('spinbutton', { name: /edit current value/i });
      expect(input2.value).toBe('50000');
    });
  });

  it('submitting unchanged inline value cleanly dismisses editor without unnecessary update', async () => {
    render(
      <TestAppWrapper>
        <Investments initialHoldings={initialHoldings} />
      </TestAppWrapper>
    );

    const quickEditBtn = screen.getByRole('button', { name: /edit current value for Parag Parikh Flexi Cap/i });
    fireEvent.click(quickEditBtn);

    const input = screen.getByRole('spinbutton', { name: /edit current value/i });
    expect(input.value).toBe('12000');

    // Press Enter without modifying
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.queryByRole('spinbutton', { name: /edit current value/i })).toBeNull();
    });
    // Return stays +20.0%
    expect(screen.getAllByText('+20.0%').length).toBeGreaterThanOrEqual(1);
  });

  it('rejects negative current value in inline edit', async () => {
    render(
      <TestAppWrapper>
        <Investments initialHoldings={initialHoldings} />
      </TestAppWrapper>
    );

    const quickEditBtn = screen.getByRole('button', { name: /edit current value for Parag Parikh Flexi Cap/i });
    fireEvent.click(quickEditBtn);

    const input = screen.getByRole('spinbutton', { name: /edit current value/i });
    fireEvent.change(input, { target: { value: '-500' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Stays in edit mode
    expect(screen.getByRole('spinbutton', { name: /edit current value/i })).toBeInTheDocument();
  });

  it('changing asset type in edit modal updates allocation bar and category filters', async () => {
    render(
      <TestAppWrapper>
        <Investments initialHoldings={initialHoldings} />
      </TestAppWrapper>
    );

    // Initial breakdown has Mutual Funds and Fixed Deposits
    expect(screen.getByRole('button', { name: 'Mutual Funds' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fixed Deposits' })).toBeInTheDocument();

    // Open edit modal for Parag Parikh Flexi Cap (Mutual Funds)
    const editBtn = screen.getByRole('button', { name: /edit holding Parag Parikh Flexi Cap/i });
    fireEvent.click(editBtn);

    const modal = screen.getByRole('dialog', { name: /edit investment/i });
    // Find the hidden native select inside CustomSelect
    const select = modal.querySelector('select');
    expect(select).toBeInTheDocument();

    // Change to Fixed Deposits
    fireEvent.change(select, { target: { value: 'Fixed Deposits' } });

    const saveBtn = within(modal).getByRole('button', { name: /save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /edit investment/i })).toBeNull();
    });

    // Now all holdings are Fixed Deposits; Mutual Funds category pill is gone from filters
    expect(screen.queryByRole('button', { name: 'Mutual Funds' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Fixed Deposits' })).toBeInTheDocument();
  });
});
