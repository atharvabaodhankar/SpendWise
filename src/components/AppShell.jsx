import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import {
  Users, Key, Settings, LogOut, Sun, Moon, Monitor,
  Plus, Wallet, TrendingUp, BarChart3, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import SpendWiseLogo from './SpendWiseLogo';
import SettingsModal from './SettingsModal';
import FriendsManagerModal from './friends/FriendsManagerModal';
import AiChatbot from './AiChatbot';

/**
 * Unified AppShell and Navigation for SpendWise.
 *
 * Desktop (>=768px):
 * - 56px sticky top bar with --bg backdrop blur and 1px line divider.
 * - Brand logo linking to /dashboard.
 * - NavLinks: Home, Investments, Analytics with 2px accent underline on active links.
 * - "Ask SpendWise" text button opening the chat panel.
 * - Single avatar popover menu (Friends and splits, API and MCP keys, Settings, Theme, Log out).
 *
 * Mobile (<768px):
 * - 56px top bar with brand logo + page title on left, avatar trigger on right. No hamburger.
 * - Fixed 56px bottom 4-tab bar (Home, Invest, Analytics, Ask) respecting safe-area-inset-bottom.
 * - Extended "Add expense" button fixed above bottom tab bar on Home (/dashboard) tab only.
 * - Bottom padding calc(56px + 72px + env(safe-area-inset-bottom)) preventing content clipping.
 */
export default function AppShell({ children }) {
  const { currentUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('preferences');
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Avatar popover state
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef(null);

  // Close avatar menu on outside click or Escape
  useEffect(() => {
    if (!isAvatarMenuOpen) return;

    function handleClickOutside(event) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) {
        setIsAvatarMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsAvatarMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAvatarMenuOpen]);

  // Derived user display
  const username = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const initials = username.slice(0, 2).toUpperCase();

  // Determine active route state
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/dashboard/';
  let mobileTitle = 'Home';
  if (location.pathname.startsWith('/investments')) {
    mobileTitle = 'Investments';
  } else if (location.pathname.startsWith('/analytics')) {
    mobileTitle = 'Analytics';
  }

  // Action helpers for outlet context
  const openAddExpense = useCallback(() => setIsAddExpenseOpen(true), []);
  const closeAddExpense = useCallback(() => setIsAddExpenseOpen(false), []);
  const openFriends = useCallback(() => setIsFriendsOpen(true), []);
  const closeFriends = useCallback(() => setIsFriendsOpen(false), []);
  const openSettings = useCallback((tab = 'preferences') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  }, []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
  const openChat = useCallback(() => setIsChatOpen(true), []);
  const closeChat = useCallback(() => setIsChatOpen(false), []);

  const outletContextValue = useMemo(
    () => ({
      isAddExpenseOpen,
      setIsAddExpenseOpen,
      openAddExpense,
      closeAddExpense,
      openFriends,
      closeFriends,
      openSettings,
      closeSettings,
      openChat,
      closeChat,
      theme,
      setTheme,
    }),
    [
      isAddExpenseOpen,
      openAddExpense,
      closeAddExpense,
      openFriends,
      closeFriends,
      openSettings,
      closeSettings,
      openChat,
      closeChat,
      theme,
      setTheme,
    ]
  );

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--ink)] flex flex-col antialiased">
      {/* ── 56px STICKY TOP BAR ── */}
      <header className="sticky top-0 z-40 h-14 bg-[var(--bg)]/90 backdrop-blur-[8px] border-b border-[var(--line)]">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Left section: Logo + Page title (mobile) or Navigation links (desktop) */}
          <div className="flex items-center gap-8 h-full">
            {/* Brand Logo & Name */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 flex-shrink-0"
              aria-label="SpendWise Home"
            >
              <SpendWiseLogo size={28} />
              <span className="font-semibold text-[var(--ink)] tracking-tight text-base">
                SpendWise
              </span>
            </Link>

            {/* Mobile Page Title Indicator */}
            <div className="flex items-center gap-2 md:hidden">
              <span className="text-xs text-[var(--ink-3)]">/</span>
              <span className="text-sm font-medium text-[var(--ink)]">
                {mobileTitle}
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav
              className="hidden md:flex items-center gap-6 h-full"
              aria-label="Main Navigation"
            >
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `h-14 inline-flex items-center text-sm transition-colors border-b-2 -mb-[1px] ${
                    isActive
                      ? 'border-[var(--accent)] font-semibold text-[var(--ink)]'
                      : 'border-transparent font-medium text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/investments"
                className={({ isActive }) =>
                  `h-14 inline-flex items-center text-sm transition-colors border-b-2 -mb-[1px] ${
                    isActive
                      ? 'border-[var(--accent)] font-semibold text-[var(--ink)]'
                      : 'border-transparent font-medium text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`
                }
              >
                Investments
              </NavLink>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  `h-14 inline-flex items-center text-sm transition-colors border-b-2 -mb-[1px] ${
                    isActive
                      ? 'border-[var(--accent)] font-semibold text-[var(--ink)]'
                      : 'border-transparent font-medium text-[var(--ink-2)] hover:text-[var(--ink)]'
                  }`
                }
              >
                Analytics
              </NavLink>
            </nav>
          </div>

          {/* Right section: Ask button + Avatar popover */}
          <div className="flex items-center gap-3">
            {/* Desktop Ask SpendWise Button (text button, replaces floating bubble) */}
            <button
              type="button"
              onClick={openChat}
              className="hidden md:inline-flex items-center justify-center h-8 px-3 rounded-[6px] border border-[var(--line-strong)] bg-transparent text-xs font-medium text-[var(--ink)] hover:bg-[var(--sunken)] transition-colors cursor-pointer"
            >
              Ask SpendWise
            </button>

            {/* Avatar Popover Menu Trigger (Desktop & Mobile) */}
            <div className="relative" ref={avatarMenuRef}>
              <button
                type="button"
                onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
                aria-expanded={isAvatarMenuOpen}
                aria-label="User account menu"
                className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--on-accent)] flex items-center justify-center text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer"
              >
                {initials}
              </button>

              {/* Avatar Popover Dropdown */}
              {isAvatarMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 rounded-[14px] bg-[var(--surface)] border border-[var(--line)] shadow-[var(--shadow-pop)] z-50 overflow-hidden py-1.5 focus:outline-none"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {/* User Profile Header */}
                  <div className="px-4 py-3 border-b border-[var(--line)]">
                    <p className="text-sm font-semibold text-[var(--ink)] truncate">
                      {username}
                    </p>
                    <p className="text-xs text-[var(--ink-3)] truncate mt-0.5">
                      {currentUser?.email}
                    </p>
                  </div>

                  {/* Navigation & Modal Triggers */}
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAvatarMenuOpen(false);
                        openFriends();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[var(--ink)] hover:bg-[var(--sunken)] flex items-center gap-2.5 transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <Users className="w-4 h-4 text-[var(--ink-2)]" />
                      <span>Friends and splits</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAvatarMenuOpen(false);
                        openSettings('api');
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[var(--ink)] hover:bg-[var(--sunken)] flex items-center gap-2.5 transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <Key className="w-4 h-4 text-[var(--ink-2)]" />
                      <span>API and MCP keys</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAvatarMenuOpen(false);
                        openSettings('preferences');
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[var(--ink)] hover:bg-[var(--sunken)] flex items-center gap-2.5 transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <Settings className="w-4 h-4 text-[var(--ink-2)]" />
                      <span>Settings</span>
                    </button>
                  </div>

                  {/* Theme Toggle Controls */}
                  <div className="px-4 py-2.5 border-t border-[var(--line)]">
                    <div className="text-xs font-medium text-[var(--ink-3)] mb-1.5">
                      Theme
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-[var(--sunken)] p-1 rounded-[6px]">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`px-2 py-1 text-xs rounded-[4px] flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          theme === 'light'
                            ? 'bg-[var(--surface)] text-[var(--ink)] font-medium shadow-sm'
                            : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                        }`}
                        title="Light theme"
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`px-2 py-1 text-xs rounded-[4px] flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-[var(--surface)] text-[var(--ink)] font-medium shadow-sm'
                            : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                        }`}
                        title="Dark theme"
                      >
                        <Moon className="w-3.5 h-3.5" />
                        <span>Dark</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('system')}
                        className={`px-2 py-1 text-xs rounded-[4px] flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          theme === 'system'
                            ? 'bg-[var(--surface)] text-[var(--ink)] font-medium shadow-sm'
                            : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                        }`}
                        title="System theme"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>System</span>
                      </button>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <div className="border-t border-[var(--line)] pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAvatarMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[var(--debit)] hover:bg-[var(--sunken)] flex items-center gap-2.5 transition-colors cursor-pointer"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4 text-[var(--debit)]" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT OUTLET ── */}
      <main
        className={`flex-1 ${
          isDashboard
            ? 'pb-[calc(56px+72px+env(safe-area-inset-bottom))] md:pb-12'
            : 'pb-[calc(56px+24px+env(safe-area-inset-bottom))] md:pb-12'
        }`}
      >
        {children || <Outlet context={outletContextValue} />}
      </main>

      {/* ── MOBILE EXTENDED "ADD EXPENSE" BUTTON (Home Tab Only) ── */}
      {isDashboard && (
        <div className="md:hidden fixed bottom-[calc(56px+16px+env(safe-area-inset-bottom))] right-4 z-30">
          <button
            type="button"
            onClick={openAddExpense}
            className="btn btn-primary h-11 px-4 shadow-[var(--shadow-pop)] cursor-pointer"
            aria-label="Add expense"
          >
            <Plus className="w-4 h-4" />
            <span>Add expense</span>
          </button>
        </div>
      )}

      {/* ── MOBILE FIXED 56px BOTTOM 4-TAB BAR ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--bg)]/90 backdrop-blur-[8px] border-t border-[var(--line)] pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-4 h-14">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[44px] py-1 text-xs transition-colors ${
                isActive && !isChatOpen
                  ? 'text-[var(--accent)] font-medium'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`
            }
          >
            <Wallet className="w-4 h-4 mb-0.5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/investments"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[44px] py-1 text-xs transition-colors ${
                isActive && !isChatOpen
                  ? 'text-[var(--accent)] font-medium'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`
            }
          >
            <TrendingUp className="w-4 h-4 mb-0.5" />
            <span>Invest</span>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[44px] py-1 text-xs transition-colors ${
                isActive && !isChatOpen
                  ? 'text-[var(--accent)] font-medium'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`
            }
          >
            <BarChart3 className="w-4 h-4 mb-0.5" />
            <span>Analytics</span>
          </NavLink>

          <button
            type="button"
            onClick={openChat}
            aria-label="Ask SpendWise"
            className={`flex flex-col items-center justify-center min-h-[44px] py-1 text-xs transition-colors cursor-pointer ${
              isChatOpen
                ? 'text-[var(--accent)] font-medium'
                : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            <MessageSquare className="w-4 h-4 mb-0.5" />
            <span>Ask</span>
          </button>
        </div>
      </nav>

      {/* ── HOISTED GLOBAL MODALS ── */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={closeSettings}
          initialTab={settingsTab}
        />
      )}

      {isFriendsOpen && (
        <FriendsManagerModal
          isOpen={isFriendsOpen}
          onClose={closeFriends}
        />
      )}

      {isChatOpen && (
        <AiChatbot
          mode="drawer"
          isOpen={isChatOpen}
          onClose={closeChat}
        />
      )}
    </div>
  );
}
