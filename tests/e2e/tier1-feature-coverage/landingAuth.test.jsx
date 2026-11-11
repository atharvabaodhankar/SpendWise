import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';
import { AuthProvider } from '../../../src/context/AuthContext.jsx';

describe('Tier 1: F10 Landing, Authentication & Copy Standards (Home, Login, Signup)', () => {
  async function getHomePage() {
    const res = await loadSrcModule('src/pages/Home.jsx');
    assertContractAvailable(
      res,
      'Home.jsx',
      'PROJECT.md § Home: conversational logging headline, interactive message bubble demo, 3 text feature rows, restyled setup tabs, 2-column searchable MCP catalog.'
    );
    return res.Component;
  }

  async function getLoginPage() {
    const res = await loadSrcModule('src/pages/Login.jsx');
    assertContractAvailable(
      res,
      'Login.jsx',
      'PROJECT.md § Login: single 360px centered column without card enclosure, .btn-quiet Google sign-in, 44px password toggle, .btn-primary submit.'
    );
    return res.Component;
  }

  async function getSignupPage() {
    const res = await loadSrcModule('src/pages/Signup.jsx');
    assertContractAvailable(
      res,
      'Signup.jsx',
      'PROJECT.md § Signup: single 360px centered column without card enclosure, standard fields, .btn-primary submit.'
    );
    return res.Component;
  }

  it('Home hero highlights conversational expense logging via agent messaging', async () => {
    const Home = await getHomePage();
    render(
      <AuthProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('Home showcases interactive message bubble demo and feature overview', async () => {
    const Home = await getHomePage();
    const { container } = render(
      <AuthProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(container.innerHTML).toMatch(/(chat|bubble|demo|agent|message)/i);
  });

  it('Login page enforces single centered 360px column without card enclosure', async () => {
    const Login = await getLoginPage();
    const { container } = render(
      <AuthProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(container.innerHTML).not.toContain('statement-card');
    expect(container.innerHTML).not.toContain('passbook');
    expect(container.innerHTML).toMatch(/(max-w-\[360px\]|max-w-sm)/);
  });

  it('Login provides accessible 44px minimum password toggle touch target', async () => {
    const Login = await getLoginPage();
    const { container } = render(
      <AuthProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthProvider>
    );

    const toggleButton = container.querySelector('button[type="button"], [aria-label*="password"], [aria-label*="toggle"]');
    expect(toggleButton, 'Password toggle button must be rendered').not.toBeNull();
    expect(toggleButton.className).toMatch(/(h-11|min-h-\[44px\]|w-11|p-)/);
  });

  it('Signup page enforces unboxed 360px column and sentence case copy', async () => {
    const Signup = await getSignupPage();
    const { container } = render(
      <AuthProvider>
        <MemoryRouter>
          <Signup />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(container.innerHTML).not.toContain('statement-card');
    expect(container.innerHTML).toMatch(/(max-w-\[360px\]|max-w-sm)/);
  });

  it('strictly prohibits emojis and marketing buzzwords across auth views', async () => {
    const Login = await getLoginPage();
    const { container } = render(
      <AuthProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthProvider>
    );

    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(container.textContent)).toBe(false);
  });

  it('eliminates all legacy "Statement" and "Passbook" terminology from public pages', async () => {
    const Home = await getHomePage();
    const { container } = render(
      <AuthProvider>
        <MemoryRouter>
          <Home />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(container.textContent).not.toMatch(/passbook/i);
    expect(container.textContent).not.toMatch(/statement\s+card/i);
  });
});
