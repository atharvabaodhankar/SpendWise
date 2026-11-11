import { useCallback, useSyncExternalStore } from 'react';

const THEME_KEYS = ['theme', 'spendwise_theme'];
const VALID_THEMES = ['light', 'dark', 'system'];
const DEFAULT_THEME = 'system';

/**
 * Determine if running in a client browser environment.
 */
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Detect system OS dark mode preference.
 * @returns {'dark' | 'light'}
 */
function getSystemPreference() {
  if (!isBrowser || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Read stored theme preference from localStorage.
 * Checks 'theme' first, then 'spendwise_theme'. Defaults to 'system'.
 * @returns {'light' | 'dark' | 'system'}
 */
function getStoredTheme() {
  if (!isBrowser) return DEFAULT_THEME;
  for (const key of THEME_KEYS) {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored && VALID_THEMES.includes(stored)) {
        return stored;
      }
    } catch {
      // Storage access may throw in restricted environments (e.g. private browsing)
    }
  }
  return DEFAULT_THEME;
}

/**
 * Resolve preference ('light' | 'dark' | 'system') to actual theme ('light' | 'dark').
 * @param {'light' | 'dark' | 'system'} preference
 * @returns {'light' | 'dark'}
 */
function resolveTheme(preference) {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return getSystemPreference();
}

/**
 * Apply resolved theme to documentElement:
 * 1. Toggle `.dark` class
 * 2. Set style.colorScheme
 * 3. Set data-theme attribute
 * @param {'light' | 'dark'} resolved
 */
function applyThemeToDOM(resolved) {
  if (!isBrowser) return;
  const root = document.documentElement;
  const isDark = resolved === 'dark';

  if (isDark) {
    if (!root.classList.contains('dark')) root.classList.add('dark');
  } else {
    if (root.classList.contains('dark')) root.classList.remove('dark');
  }

  try {
    root.style.colorScheme = resolved;
    root.setAttribute('data-theme', resolved);
  } catch {
    // Ignore DOM styling exceptions in non-standard runtimes
  }
}

/**
 * Synchronize preference across both 'theme' and 'spendwise_theme' in localStorage.
 * @param {'light' | 'dark' | 'system'} preference
 */
function persistTheme(preference) {
  if (!isBrowser) return;
  for (const key of THEME_KEYS) {
    try {
      window.localStorage.setItem(key, preference);
    } catch {
      // Ignore storage write errors (quota exceeded or private browsing)
    }
  }
}

// Module-level state initialization
let currentTheme = getStoredTheme();
let currentResolvedTheme = resolveTheme(currentTheme);

let currentSnapshot = {
  theme: currentTheme,
  resolvedTheme: currentResolvedTheme,
  isDark: currentResolvedTheme === 'dark'
};

if (isBrowser) {
  applyThemeToDOM(currentResolvedTheme);
}

const SERVER_SNAPSHOT = Object.freeze({
  theme: DEFAULT_THEME,
  resolvedTheme: 'light',
  isDark: false
});

const subscribers = new Set();
let mediaQueryList = null;
let mediaListener = null;
let storageListener = null;

function notifySubscribers() {
  subscribers.forEach((callback) => {
    try {
      callback();
    } catch (err) {
      console.error('Error in useTheme subscriber:', err);
    }
  });
}

function updateState(newTheme) {
  const sanitizedTheme = VALID_THEMES.includes(newTheme) ? newTheme : DEFAULT_THEME;
  const nextResolved = resolveTheme(sanitizedTheme);
  const nextIsDark = nextResolved === 'dark';

  if (
    currentSnapshot.theme === sanitizedTheme &&
    currentSnapshot.resolvedTheme === nextResolved &&
    currentSnapshot.isDark === nextIsDark
  ) {
    applyThemeToDOM(nextResolved);
    return;
  }

  currentTheme = sanitizedTheme;
  currentResolvedTheme = nextResolved;
  currentSnapshot = {
    theme: sanitizedTheme,
    resolvedTheme: nextResolved,
    isDark: nextIsDark
  };

  applyThemeToDOM(nextResolved);
  notifySubscribers();
}

function startListeners() {
  if (!isBrowser) return;

  // 1. Cross-tab storage synchronization
  if (!storageListener && typeof window.addEventListener === 'function') {
    storageListener = (event) => {
      if (event.key === null || THEME_KEYS.includes(event.key)) {
        const stored = getStoredTheme();
        updateState(stored);
      }
    };
    window.addEventListener('storage', storageListener);
  }

  // 2. System preference change listener
  if (!mediaListener && typeof window.matchMedia === 'function') {
    mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    mediaListener = (event) => {
      if (currentTheme === 'system') {
        const nextResolved = (event && typeof event.matches === 'boolean')
          ? (event.matches ? 'dark' : 'light')
          : getSystemPreference();
        if (nextResolved !== currentResolvedTheme) {
          currentResolvedTheme = nextResolved;
          currentSnapshot = {
            theme: 'system',
            resolvedTheme: nextResolved,
            isDark: nextResolved === 'dark'
          };
          applyThemeToDOM(nextResolved);
          notifySubscribers();
        }
      }
    };

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', mediaListener);
    } else if (typeof mediaQueryList.addListener === 'function') {
      mediaQueryList.addListener(mediaListener);
    }
  }
}

function stopListeners() {
  if (!isBrowser) return;

  if (storageListener && typeof window.removeEventListener === 'function') {
    window.removeEventListener('storage', storageListener);
    storageListener = null;
  }

  if (mediaListener && mediaQueryList) {
    if (typeof mediaQueryList.removeEventListener === 'function') {
      mediaQueryList.removeEventListener('change', mediaListener);
    } else if (typeof mediaQueryList.removeListener === 'function') {
      mediaQueryList.removeListener(mediaListener);
    }
    mediaListener = null;
    mediaQueryList = null;
  }
}

function subscribe(callback) {
  if (subscribers.size === 0) {
    startListeners();
  }
  subscribers.add(callback);

  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) {
      stopListeners();
    }
  };
}

function getSnapshot() {
  return currentSnapshot;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

/**
 * Hook providing reactive theme state and controls.
 *
 * @returns {{
 *   theme: 'light' | 'dark' | 'system',
 *   resolvedTheme: 'light' | 'dark',
 *   isDark: boolean,
 *   setTheme: (theme: 'light' | 'dark' | 'system') => void,
 *   toggleTheme: () => void
 * }}
 */
export function useTheme() {
  // Sync if localStorage was altered directly outside React (e.g. test setups, scripts)
  if (isBrowser) {
    const stored = getStoredTheme();
    if (stored !== currentTheme) {
      updateState(stored);
    } else {
      const shouldBeDark = currentResolvedTheme === 'dark';
      if (document.documentElement.classList.contains('dark') !== shouldBeDark) {
        applyThemeToDOM(currentResolvedTheme);
      }
    }
  }

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((newTheme) => {
    if (!VALID_THEMES.includes(newTheme)) return;
    persistTheme(newTheme);
    updateState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = currentSnapshot.resolvedTheme === 'dark' ? 'light' : 'dark';
    persistTheme(next);
    updateState(next);
  }, []);

  return {
    theme: snapshot.theme,
    resolvedTheme: snapshot.resolvedTheme,
    isDark: snapshot.isDark,
    setTheme,
    toggleTheme
  };
}

export default useTheme;
