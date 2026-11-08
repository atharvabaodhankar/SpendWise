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

export function normalizeInvestmentInput(inv) {
  const investedAmount = toNumber(inv.investedAmount ?? inv.amount);
  const currentValue = inv.currentValue !== undefined && inv.currentValue !== null
    ? toNumber(inv.currentValue)
    : investedAmount;

  return {
    name: inv.name?.trim() || 'Investment',
    assetType: inv.assetType?.trim() || 'other', // gold, silver, mutual_fund, fd, stocks, crypto, other
    provider: inv.provider?.trim() || 'Direct', // PhonePe, Zerodha, Groww, SBI, etc.
    investedAmount,
    currentValue,
    purchaseDate: toDateString(inv.purchaseDate || inv.date),
    maturityDate: inv.maturityDate ? toDateString(inv.maturityDate) : null,
    interestRate: inv.interestRate ? toNumber(inv.interestRate) : null,
    units: inv.units ? toNumber(inv.units) : null,
    notes: inv.notes?.trim() || '',
  };
}

export async function addInvestment(userId, data) {
  const normalized = normalizeInvestmentInput(data);
  const payload = {
    ...normalized,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await addDoc(collection(db, 'investments'), payload);
  return {
    id: docRef.id,
    ...payload,
    message: `Logged ${normalized.name} (${formatCurrency(normalized.investedAmount)}) on ${normalized.provider}.`,
  };
}

export async function updateInvestment(userId, investmentId, updates) {
  const invRef = doc(db, 'investments', investmentId);
  const snapshot = await getDoc(invRef);
  if (!snapshot.exists()) throw new Error('Investment not found.');
  if (snapshot.data().userId !== userId) throw new Error('Unauthorized.');

  const existing = snapshot.data();
  const normalized = normalizeInvestmentInput({ ...existing, ...updates });

  await updateDoc(invRef, {
    ...normalized,
    updatedAt: new Date(),
  });

  return {
    id: investmentId,
    ...normalized,
    message: `Updated ${normalized.name}.`,
  };
}

export async function deleteInvestment(userId, investmentId) {
  const invRef = doc(db, 'investments', investmentId);
  const snapshot = await getDoc(invRef);
  if (!snapshot.exists()) throw new Error('Investment not found.');
  if (snapshot.data().userId !== userId) throw new Error('Unauthorized.');

  const existing = snapshot.data();
  await deleteDoc(invRef);
  return {
    id: investmentId,
    message: `Removed ${existing.name || 'investment'}.`,
  };
}
