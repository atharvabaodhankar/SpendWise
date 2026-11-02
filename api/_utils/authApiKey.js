import crypto from 'crypto';
import { getAdminDb } from './firebaseAdmin.js';

export function hashSecretKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export async function authenticateApiKey(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.query?.apiKey) {
    token = String(req.query.apiKey).trim();
  } else if (req.body?.apiKey) {
    token = String(req.body.apiKey).trim();
  }

  if (!token || !token.startsWith('spw_live_')) {
    return null;
  }

  try {
    const db = getAdminDb();
    const keyHash = hashSecretKey(token);

    const snapshot = await db
      .collection('apiKeys')
      .where('keyHash', '==', keyHash)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Fire-and-forget update of lastUsedAt
    doc.ref.update({ lastUsedAt: new Date().toISOString() }).catch((err) => {
      console.warn('Failed to update lastUsedAt on apiKey:', err?.message);
    });

    return {
      userId: data.userId,
      keyId: doc.id,
      name: data.name,
    };
  } catch (err) {
    console.error('Error during API key authentication:', err);
    throw err;
  }
}
