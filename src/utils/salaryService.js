import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

function toNumber(val, fallback = 0) {
  const p = Number.parseFloat(val ?? fallback);
  return Number.isFinite(p) ? p : fallback;
}

export function normalizeSalaryInput(s) {
  return {
    salaryMonth: s.salaryMonth?.trim() || 'Salary', // e.g. "Jun 2026" or "June"
    amount: toNumber(s.amount),
    receivedDate: s.receivedDate || new Date().toISOString().split('T')[0], // e.g. "2026-07-17"
    companyOrSource: s.companyOrSource?.trim() || '', // e.g. "Acme Corp" or "Freelance"
    status: s.status || 'received', // "received" | "pending"
    notes: s.notes?.trim() || '', // e.g. "got on 17th july"
  };
}

export async function addSalary(userId, data) {
  const normalized = normalizeSalaryInput(data);
  const payload = {
    ...normalized,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await addDoc(collection(db, 'salaries'), payload);
  return {
    id: docRef.id,
    ...payload,
  };
}

export async function updateSalary(userId, salaryId, updates) {
  const ref = doc(db, 'salaries', salaryId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('Salary record not found.');
  if (snapshot.data().userId !== userId) throw new Error('Unauthorized.');

  const existing = snapshot.data();
  const normalized = normalizeSalaryInput({ ...existing, ...updates });

  await updateDoc(ref, {
    ...normalized,
    updatedAt: new Date(),
  });

  return {
    id: salaryId,
    ...normalized,
  };
}

export async function deleteSalary(userId, salaryId) {
  const ref = doc(db, 'salaries', salaryId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('Salary record not found.');
  if (snapshot.data().userId !== userId) throw new Error('Unauthorized.');

  await deleteDoc(ref);
  return { id: salaryId };
}
