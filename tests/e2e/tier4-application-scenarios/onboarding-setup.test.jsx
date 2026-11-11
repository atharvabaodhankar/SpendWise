import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { TestAppWrapper } from '../../utils/test-providers.jsx';

describe('Tier 4: Scenario 1 - Onboarding and Initial Balance Setup Workflow', () => {
  async function getSignupPage() {
    const res = await loadSrcModule('src/pages/Signup.jsx');
    assertContractAvailable(res, 'Signup.jsx', 'PROJECT.md § Signup: 360px centered auth registration.');
    return res.Component;
  }

  async function getInitialBalanceSetup() {
    const res = await loadSrcModule('src/components/InitialBalanceSetup.jsx');
    assertContractAvailable(res, 'InitialBalanceSetup.jsx', 'PROJECT.md § InitialBalanceSetup: initial cash and bank balance modal.');
    return res.Component;
  }

  async function getDashboard() {
    const res = await loadSrcModule('src/pages/Dashboard.jsx');
    assertContractAvailable(res, 'Dashboard.jsx', 'PROJECT.md § Dashboard: unboxed printed ledger dashboard.');
    return res.Component;
  }

  it('completes end-to-end user onboarding: auth registration -> initial balance setup -> unboxed ledger dashboard', async () => {
    const Signup = await getSignupPage();
    const InitialBalanceSetup = await getInitialBalanceSetup();
    const Dashboard = await getDashboard();

    // Step 1: Render Registration form
    const { container: signupContainer } = render(<Signup />, { wrapper: TestAppWrapper });
    expect(signupContainer.innerHTML).not.toContain('statement-card');
    expect(screen.getAllByRole('button', { name: /sign up|create account|register/i })[0]).toBeInTheDocument();

    // Step 2: Render Initial Balance Setup Dialog
    const { container: setupContainer } = render(
      <InitialBalanceSetup isOpen={true} onComplete={() => {}} />,
      { wrapper: TestAppWrapper }
    );
    expect(setupContainer.textContent).toMatch(/(balance|cash|bank)/i);

    // Step 3: Render Dashboard reflecting initial balances
    const { container: dashContainer } = render(
      <Dashboard initialBalances={{ cash: 5000, bank: 45000 }} />,
      { wrapper: TestAppWrapper }
    );
    expect(dashContainer.innerHTML).not.toContain('statement-card');
    // Prominent net balance should reflect total (50,000)
    expect(dashContainer.textContent).toMatch(/(50,000|50000)/);
  });
});
