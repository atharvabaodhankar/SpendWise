import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as mockFirebase from './mocks/firebase.js';

// Automatically unmount and cleanup React trees after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  document.documentElement.className = '';
  document.body.className = '';
  document.body.style.overflow = '';
  mockFirebase.mockFirestoreStore.clear();
  vi.clearAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock window.scrollTo and scrollIntoView
window.scrollTo = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockFirebase.mockAuth),
  onAuthStateChanged: mockFirebase.onAuthStateChanged,
  signInWithEmailAndPassword: mockFirebase.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockFirebase.createUserWithEmailAndPassword,
  signOut: mockFirebase.signOut,
  GoogleAuthProvider: mockFirebase.GoogleAuthProvider,
  signInWithPopup: mockFirebase.signInWithPopup,
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: mockFirebase.collection,
  doc: mockFirebase.doc,
  getDoc: mockFirebase.getDoc,
  getDocs: mockFirebase.getDocs,
  setDoc: mockFirebase.setDoc,
  updateDoc: mockFirebase.updateDoc,
  deleteDoc: mockFirebase.deleteDoc,
  addDoc: mockFirebase.addDoc,
  onSnapshot: mockFirebase.onSnapshot,
  query: mockFirebase.query,
  where: mockFirebase.where,
  orderBy: mockFirebase.orderBy,
  limit: mockFirebase.limit,
  serverTimestamp: mockFirebase.serverTimestamp,
  Timestamp: mockFirebase.Timestamp,
}));
