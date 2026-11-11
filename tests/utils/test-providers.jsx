import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/context/AuthContext.jsx';
import { NotificationProvider } from '../../src/context/NotificationContext.jsx';

/**
 * Universal Test Provider wrapper for rendering SpendWise components
 * Provides AuthProvider, NotificationProvider, and MemoryRouter.
 */
export const TestAppWrapper = ({ children, initialEntries = ['/'] }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export const createTestWrapper = (initialEntries = ['/']) => {
  return ({ children }) => (
    <TestAppWrapper initialEntries={initialEntries}>
      {children}
    </TestAppWrapper>
  );
};
