import { vi } from 'vitest';

// In-memory Firestore store for test isolation
export class MockFirestoreStore {
  constructor() {
    this.data = new Map();
    this.listeners = new Map();
  }

  clear() {
    this.data.clear();
    this.listeners.clear();
  }

  set(path, docData) {
    this.data.set(path, { ...docData });
    this.notify(path);
  }

  get(path) {
    return this.data.get(path) || null;
  }

  delete(path) {
    this.data.delete(path);
    this.notify(path);
  }

  notify(path) {
    const docListeners = this.listeners.get(path);
    if (docListeners) {
      const data = this.get(path);
      const snapshot = {
        exists: () => data !== null,
        data: () => data,
        id: path.split('/').pop(),
      };
      docListeners.forEach(cb => cb(snapshot));
    }
  }

  subscribe(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path).add(callback);

    // Initial callback
    const data = this.get(path);
    const snapshot = {
      exists: () => data !== null,
      data: () => data,
      id: path.split('/').pop(),
    };
    callback(snapshot);

    return () => {
      const set = this.listeners.get(path);
      if (set) {
        set.delete(callback);
      }
    };
  }
}

export const mockFirestoreStore = new MockFirestoreStore();

// Mock Auth
export const mockUser = {
  uid: 'test-user-123',
  email: 'testuser@example.com',
  displayName: 'Test User',
  photoURL: null,
};

let currentAuthUser = mockUser;
const authListeners = new Set();

export const setMockAuthUser = (user) => {
  currentAuthUser = user;
  authListeners.forEach(cb => cb(currentAuthUser));
};

export const mockAuth = {
  currentUser: currentAuthUser,
};

export const onAuthStateChanged = vi.fn((auth, callback) => {
  authListeners.add(callback);
  callback(currentAuthUser);
  return () => authListeners.delete(callback);
});

export const signInWithEmailAndPassword = vi.fn(async (auth, email, password) => {
  const user = { uid: 'logged-in-user', email, displayName: 'Logged In User' };
  setMockAuthUser(user);
  return { user };
});

export const createUserWithEmailAndPassword = vi.fn(async (auth, email, password) => {
  const user = { uid: 'new-user', email, displayName: 'New User' };
  setMockAuthUser(user);
  return { user };
});

export const signOut = vi.fn(async () => {
  setMockAuthUser(null);
});

export const GoogleAuthProvider = vi.fn();
export const signInWithPopup = vi.fn(async () => {
  const user = { uid: 'google-user', email: 'google@example.com', displayName: 'Google User' };
  setMockAuthUser(user);
  return { user };
});

// Mock Firestore functions
export const collection = vi.fn((db, ...pathSegments) => ({
  type: 'collection',
  path: pathSegments.join('/'),
}));

export const doc = vi.fn((db, ...pathSegments) => {
  let fullPath = '';
  if (typeof db === 'object' && db.type === 'collection') {
    fullPath = `${db.path}/${pathSegments.join('/')}`;
  } else {
    fullPath = pathSegments.join('/');
  }
  return {
    type: 'doc',
    path: fullPath,
    id: pathSegments[pathSegments.length - 1],
  };
});

export const getDoc = vi.fn(async (docRef) => {
  const data = mockFirestoreStore.get(docRef.path);
  return {
    exists: () => data !== null,
    data: () => data,
    id: docRef.id || docRef.path.split('/').pop(),
  };
});

export const setDoc = vi.fn(async (docRef, data, options = {}) => {
  const existing = options.merge ? (mockFirestoreStore.get(docRef.path) || {}) : {};
  mockFirestoreStore.set(docRef.path, { ...existing, ...data });
});

export const updateDoc = vi.fn(async (docRef, data) => {
  const existing = mockFirestoreStore.get(docRef.path) || {};
  mockFirestoreStore.set(docRef.path, { ...existing, ...data });
});

export const deleteDoc = vi.fn(async (docRef) => {
  mockFirestoreStore.delete(docRef.path);
});

export const addDoc = vi.fn(async (colRef, data) => {
  const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fullPath = `${colRef.path}/${id}`;
  mockFirestoreStore.set(fullPath, { ...data, id });
  return { id, path: fullPath };
});

export const getDocs = vi.fn(async (queryRef) => {
  const docs = [];
  mockFirestoreStore.data.forEach((val, key) => {
    if (queryRef.path && key.startsWith(queryRef.path)) {
      docs.push({
        id: key.split('/').pop(),
        data: () => val,
        exists: () => true,
      });
    }
  });
  return {
    docs,
    forEach: (cb) => docs.forEach(cb),
    empty: docs.length === 0,
    size: docs.length,
  };
});

export const onSnapshot = vi.fn((targetRef, onNext, onError) => {
  if (targetRef.type === 'doc') {
    return mockFirestoreStore.subscribe(targetRef.path, onNext);
  }
  // For collection
  const listener = () => {
    const docs = [];
    mockFirestoreStore.data.forEach((val, key) => {
      if (key.startsWith(targetRef.path)) {
        docs.push({
          id: key.split('/').pop(),
          data: () => val,
          exists: () => true,
        });
      }
    });
    onNext({
      docs,
      forEach: (cb) => docs.forEach(cb),
      docChanges: () => [],
      empty: docs.length === 0,
    });
  };
  listener();
  return () => {};
});

export const query = vi.fn((ref) => ref);
export const where = vi.fn(() => ({ type: 'where' }));
export const orderBy = vi.fn(() => ({ type: 'orderBy' }));
export const limit = vi.fn(() => ({ type: 'limit' }));
export const serverTimestamp = vi.fn(() => new Date().toISOString());
export const Timestamp = {
  now: () => ({ toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) }),
  fromDate: (date) => ({ toDate: () => date, seconds: Math.floor(date.getTime() / 1000) }),
};
