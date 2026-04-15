import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatCurrency } from './aiFinanceContext';

function toNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toDateString(dateValue) {
  if (!dateValue) {
    return new Date().toISOString().split('T')[0];
  }

  if (typeof dateValue === 'string') {
    return dateValue;
  }

  if (typeof dateValue?.toDate === 'function') {
    return dateValue.toDate().toISOString().split('T')[0];
  }

  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

function normalizeTransactionInput(transaction, fallbackType = 'expense') {
  return {
    type: transaction.type ?? fallbackType,
    amount: toNumber(transaction.amount),
    category: transaction.category?.trim() || 'Other',
    description: transaction.description?.trim() || '',
    date: toDateString(transaction.date),
    paymentMethod: transaction.paymentMethod ?? 'online',
    affectCurrentBalance: transaction.affectCurrentBalance !== false,
    isSplit: Boolean(transaction.isSplit),
    isBalanceAdjustment: Boolean(transaction.isBalanceAdjustment),
    totalPaid:
      transaction.totalPaid !== undefined
        ? toNumber(transaction.totalPaid)
        : toNumber(transaction.amount),
  };
}

function getBalanceImpactAmount(transaction) {
  if (transaction.type !== 'expense' && transaction.type !== 'income') {
    return 0;
  }

  if (transaction.type === 'expense') {
    return toNumber(transaction.totalPaid ?? transaction.amount);
  }

  return toNumber(transaction.amount);
}

function getTransactionBalanceDelta(transaction) {
  if (
    transaction.affectCurrentBalance === false ||
    !['online', 'cash'].includes(transaction.paymentMethod)
  ) {
    return { online: 0, cash: 0 };
  }

  const impactAmount = getBalanceImpactAmount(transaction);
  const signedAmount = transaction.type === 'income' ? impactAmount : -impactAmount;
  return {
    online: transaction.paymentMethod === 'online' ? signedAmount : 0,
    cash: transaction.paymentMethod === 'cash' ? signedAmount : 0,
  };
}

async function applyBalanceDelta(userId, delta, reason) {
  if (!delta.online && !delta.cash) {
    return null;
  }

  const balanceRef = doc(db, 'currentBalances', userId);
  const balanceSnapshot = await getDoc(balanceRef);
  const currentBalances = balanceSnapshot.exists()
    ? balanceSnapshot.data()
    : { online: 0, cash: 0 };

  const nextBalances = {
    online: toNumber(currentBalances.online) + toNumber(delta.online),
    cash: toNumber(currentBalances.cash) + toNumber(delta.cash),
    lastUpdated: new Date(),
    updatedBy: 'ai_assistant',
    reason,
  };

  await setDoc(balanceRef, nextBalances, { merge: true });
  return nextBalances;
}

function ensureOwnership(snapshot, userId) {
  if (!snapshot.exists()) {
    throw new Error('Record not found.');
  }

  const data = snapshot.data();
  if (data.userId !== userId) {
    throw new Error('You can only update your own records.');
  }

  return data;
}

export async function createTransactionFromAssistant(userId, transaction) {
  const normalizedTransaction = normalizeTransactionInput(transaction);
  const payload = {
    ...normalizedTransaction,
    userId,
    createdAt: new Date(),
  };

  const transactionRef = await addDoc(collection(db, 'transactions'), payload);
  await applyBalanceDelta(
    userId,
    getTransactionBalanceDelta(payload),
    `AI added ${payload.description || payload.category}`,
  );

  return {
    id: transactionRef.id,
    message: `Added ${payload.description || payload.category} for ${formatCurrency(payload.amount)}.`,
  };
}

export async function updateTransactionFromAssistant(userId, transactionId, updates) {
  const transactionRef = doc(db, 'transactions', transactionId);
  const snapshot = await getDoc(transactionRef);
  const currentRecord = ensureOwnership(snapshot, userId);
  const normalizedUpdates = normalizeTransactionInput({ ...currentRecord, ...updates }, currentRecord.type);

  const previousDelta = getTransactionBalanceDelta(currentRecord);
  const nextDelta = getTransactionBalanceDelta(normalizedUpdates);
  const netDelta = {
    online: toNumber(nextDelta.online) - toNumber(previousDelta.online),
    cash: toNumber(nextDelta.cash) - toNumber(previousDelta.cash),
  };

  await updateDoc(transactionRef, {
    ...normalizedUpdates,
    updatedAt: new Date(),
    updatedBy: 'ai_assistant',
  });

  await applyBalanceDelta(
    userId,
    netDelta,
    `AI updated ${normalizedUpdates.description || normalizedUpdates.category}`,
  );

  return {
    id: transactionId,
    message: `Updated ${normalizedUpdates.description || normalizedUpdates.category}.`,
  };
}

export async function deleteTransactionFromAssistant(userId, transactionId) {
  const transactionRef = doc(db, 'transactions', transactionId);
  const snapshot = await getDoc(transactionRef);
  const currentRecord = ensureOwnership(snapshot, userId);
  const reversalDelta = getTransactionBalanceDelta(currentRecord);

  await deleteDoc(transactionRef);
  await applyBalanceDelta(
    userId,
    {
      online: -toNumber(reversalDelta.online),
      cash: -toNumber(reversalDelta.cash),
    },
    `AI deleted ${currentRecord.description || currentRecord.category}`,
  );

  return {
    id: transactionId,
    message: `Deleted ${currentRecord.description || currentRecord.category}.`,
  };
}

export async function setBudgetFromAssistant(userId, monthlyLimit) {
  const value = toNumber(monthlyLimit);
  await setDoc(
    doc(db, 'budgets', userId),
    {
      monthlyLimit: value,
      userId,
      updatedAt: new Date(),
      updatedBy: 'ai_assistant',
    },
    { merge: true },
  );

  return {
    message: `Set monthly budget to ${formatCurrency(value)}.`,
  };
}

export async function adjustBalanceFromAssistant(userId, payload) {
  const onlineDelta = toNumber(payload.onlineDelta);
  const cashDelta = toNumber(payload.cashDelta);
  const reason = payload.reason?.trim() || 'AI balance adjustment';

  const nextBalances = await applyBalanceDelta(
    userId,
    { online: onlineDelta, cash: cashDelta },
    reason,
  );

  if (onlineDelta) {
    await addDoc(collection(db, 'transactions'), {
      type: onlineDelta > 0 ? 'income' : 'expense',
      amount: Math.abs(onlineDelta),
      category: 'Balance Adjustment',
      description: `Online balance adjustment: ${reason}`,
      paymentMethod: 'online',
      date: new Date().toISOString().split('T')[0],
      userId,
      createdAt: new Date(),
      affectCurrentBalance: false,
      isBalanceAdjustment: true,
    });
  }

  if (cashDelta) {
    await addDoc(collection(db, 'transactions'), {
      type: cashDelta > 0 ? 'income' : 'expense',
      amount: Math.abs(cashDelta),
      category: 'Balance Adjustment',
      description: `Cash balance adjustment: ${reason}`,
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
      userId,
      createdAt: new Date(),
      affectCurrentBalance: false,
      isBalanceAdjustment: true,
    });
  }

  return {
    message: `Adjusted balances. Online ${formatCurrency(
      nextBalances?.online ?? 0,
    )}, Cash ${formatCurrency(nextBalances?.cash ?? 0)}.`,
  };
}
