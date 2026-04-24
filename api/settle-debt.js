// Handles one-click debt settlement from email link
// Uses Firebase REST API (no admin SDK needed)

const FIREBASE_PROJECT = process.env.VITE_FIREBASE_PROJECT_ID;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;

async function firestoreGet(path) {
  const res = await fetch(`${FIRESTORE_BASE}/${path}?key=${process.env.VITE_FIREBASE_API_KEY}`);
  if (!res.ok) throw new Error(`Firestore GET failed: ${res.status}`);
  return res.json();
}

async function firestorePatch(path, fields) {
  const body = { fields: {} };
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === 'string') body.fields[k] = { stringValue: v };
    else if (typeof v === 'number') body.fields[k] = { doubleValue: v };
    else if (typeof v === 'boolean') body.fields[k] = { booleanValue: v };
  }
  const updateMask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${k}`).join('&');
  const res = await fetch(
    `${FIRESTORE_BASE}/${path}?${updateMask}&key=${process.env.VITE_FIREBASE_API_KEY}`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  );
  if (!res.ok) throw new Error(`Firestore PATCH failed: ${res.status}`);
  return res.json();
}

function getField(doc, field) {
  const f = doc?.fields?.[field];
  return f?.stringValue ?? f?.doubleValue ?? f?.booleanValue ?? null;
}

export default async function handler(req, res) {
  const { debtId, token } = req.method === 'GET' ? req.query : (req.body || {});

  if (!debtId || !token) {
    return res.status(400).send(errorPage('Missing parameters.'));
  }

  try {
    // Fetch the debt document
    const debtDoc = await firestoreGet(`debts/${debtId}`);
    const status = getField(debtDoc, 'status');
    const amount = getField(debtDoc, 'amount');
    const description = getField(debtDoc, 'description');
    const debtorId = getField(debtDoc, 'debtorId');
    const creditorId = getField(debtDoc, 'creditorId');

    if (!debtorId) {
      return res.status(404).send(errorPage('Debt not found.'));
    }

    // Validate token = simple HMAC-like check using debtId + secret
    const expectedToken = Buffer.from(`${debtId}:${process.env.SETTLE_SECRET || 'spendwise'}`).toString('base64url');
    if (token !== expectedToken) {
      return res.status(403).send(errorPage('Invalid or expired link.'));
    }

    if (status === 'pending_confirmation' || status === 'paid') {
      return res.status(200).send(alreadyPaidPage(description, amount));
    }

    // Mark as pending_confirmation
    await firestorePatch(`debts/${debtId}`, { status: 'pending_confirmation' });

    // Send email to creditor to confirm
    try {
      const creditorDoc = await firestoreGet(`users/${creditorId}`);
      const creditorEmail = getField(creditorDoc, 'email');
      const debtorDoc = await firestoreGet(`users/${debtorId}`);
      const debtorName = getField(debtorDoc, 'displayName') || getField(debtorDoc, 'email') || 'Your friend';

      if (creditorEmail) {
        await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 3000}`}/api/send-email-gmail`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'debt_marked_paid',
            userEmail: creditorEmail,
            data: { debtorName, amount, description },
          }),
        });
      }
    } catch (emailErr) {
      console.error('Failed to notify creditor:', emailErr);
    }

    return res.status(200).send(successPage(description, amount));
  } catch (err) {
    console.error('settle-debt error:', err);
    return res.status(500).send(errorPage('Something went wrong. Please try again.'));
  }
}

function successPage(description, amount) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Marked — SpendWise</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: #0b1220; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 48px 40px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    .icon { width: 72px; height: 72px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 32px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
    .desc { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
    .amount { font-size: 36px; font-weight: 800; color: #10b981; margin-bottom: 8px; }
    .label { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 32px; }
    .note { background: #1e293b; border-radius: 12px; padding: 16px; font-size: 13px; color: #94a3b8; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Payment Marked!</h1>
    <p class="desc">Your payment has been recorded. The creditor will confirm receipt to fully settle this debt.</p>
    <div class="amount">₹${Number(amount).toFixed(2)}</div>
    <div class="label">${description || 'Bill Split'}</div>
    <div class="note">📬 The person you owe has been notified and will confirm your payment in SpendWise.</div>
  </div>
</body>
</html>`;
}

function alreadyPaidPage(description, amount) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Already Marked — SpendWise</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: #0b1220; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 48px 40px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    .icon { width: 72px; height: 72px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 32px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
    .desc { color: #94a3b8; font-size: 15px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">ℹ</div>
    <h1>Already Marked</h1>
    <p class="desc">This payment for <strong>${description || 'this bill'}</strong> (₹${Number(amount).toFixed(2)}) has already been marked as paid and is awaiting confirmation.</p>
  </div>
</body>
</html>`;
}

function errorPage(message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Error — SpendWise</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; background: #0b1220; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 20px; padding: 48px 40px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
    .icon { width: 72px; height: 72px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 32px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; }
    .desc { color: #94a3b8; font-size: 15px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✕</div>
    <h1>Something went wrong</h1>
    <p class="desc">${message}</p>
  </div>
</body>
</html>`;
}
