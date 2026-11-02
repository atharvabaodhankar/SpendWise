import admin from 'firebase-admin';

let cachedDb = null;

export function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }

  // 1. Try full JSON string in FIREBASE_SERVICE_ACCOUNT
  const serviceAccountRaw =
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  if (serviceAccountRaw) {
    try {
      let parsed = JSON.parse(
        serviceAccountRaw.startsWith('{')
          ? serviceAccountRaw
          : Buffer.from(serviceAccountRaw, 'base64').toString('utf8')
      );
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(parsed),
      });
      return admin;
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', err);
    }
  }

  // 2. Try individual env variables: FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.VITE_FIREBASE_PROJECT_ID;

  if (privateKey && clientEmail && projectId) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      return admin;
    } catch (err) {
      console.error('Failed to init with FIREBASE_PRIVATE_KEY:', err);
    }
  }

  // 3. Fallback: Default application credentials or project ID only
  if (projectId) {
    try {
      admin.initializeApp({
        projectId,
      });
      return admin;
    } catch (err) {
      console.error('Failed to init with default projectId:', err);
    }
  }

  throw new Error(
    'Firebase Admin could not be initialized. Please set FIREBASE_SERVICE_ACCOUNT or FIREBASE_PRIVATE_KEY & FIREBASE_CLIENT_EMAIL in your environment variables.'
  );
}

export function getAdminDb() {
  if (!cachedDb) {
    const app = getFirebaseAdmin();
    cachedDb = app.firestore();
  }
  return cachedDb;
}
