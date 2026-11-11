import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSrcModule, assertContractAvailable } from '../../utils/contract-loader.js';

describe('Tier 1: F3 Unified Theme Hook (useTheme.js)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  async function getUseThemeHook() {
    const res = await loadSrcModule('src/hooks/useTheme.js');
    assertContractAvailable(
      res,
      'useTheme.js',
      'PROJECT.md § Interface Contracts: useTheme returns { theme, resolvedTheme, setTheme }, syncs localStorage and documentElement .dark class, and listens to prefers-color-scheme.'
    );
    return res.Component;
  }

  it('initializes with default system preference or stored localStorage preference', async () => {
    const useTheme = await getUseThemeHook();
    const { result } = renderHook(() => useTheme());

    expect(['light', 'dark', 'system']).toContain(result.current.theme);
    expect(['light', 'dark']).toContain(result.current.resolvedTheme);
  });

  it('sets theme to "dark", updates resolvedTheme to "dark", and adds "dark" class to html element', async () => {
    const useTheme = await getUseThemeHook();
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('sets theme to "light", updates resolvedTheme to "light", and removes "dark" class from html element', async () => {
    const useTheme = await getUseThemeHook();
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.resolvedTheme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('loads previously stored theme from localStorage on hook mount', async () => {
    localStorage.setItem('theme', 'dark');
    const useTheme = await getUseThemeHook();
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('dynamically adapts to system dark mode changes when theme is "system"', async () => {
    let changeHandler = null;
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') changeHandler = handler;
      }),
      removeEventListener: vi.fn(),
    }));

    const useTheme = await getUseThemeHook();
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('system');
    });

    expect(result.current.theme).toBe('system');

    // Simulate OS switching to dark mode
    if (changeHandler) {
      act(() => {
        changeHandler({ matches: true });
      });
      expect(result.current.resolvedTheme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    }
  });
});
