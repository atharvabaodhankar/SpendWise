import React, { createContext, useContext } from 'react';
import { vi } from 'vitest';
import { mockUser } from './firebase.js';

export const TestAuthContext = createContext({
  currentUser: mockUser,
  userProfile: { name: 'Test User', email: 'testuser@example.com' },
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
  loginWithGoogle: vi.fn(),
});

export const MockAuthProvider = ({
  children,
  user = mockUser,
  profile = { name: 'Test User' },
}) => {
  const value = {
    currentUser: user,
    userProfile: profile,
    login: vi.fn(),
    logout: vi.fn(),
    signup: vi.fn(),
    loginWithGoogle: vi.fn(),
  };

  return (
    <TestAuthContext.Provider value={value}>
      {children}
    </TestAuthContext.Provider>
  );
};
