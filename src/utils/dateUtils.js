/**
 * SpendWise Unified Date and Time Utility
 * Provides calendar-accurate, timezone-resilient date parsing, formatting,
 * and chronological sorting across all app components and services.
 */

/**
 * Safely parse any date value into a local calendar day Date object.
 * Handles strings (YYYY-MM-DD, [yesterday YYYY-MM-DD], [today ...], DD-MM-YYYY, DD/MM/YYYY, ISO timestamps),
 * relative keywords ("yesterday", "today"), Firestore Timestamps, and Date instances.
 */
export function parseLocalDate(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;

  if (typeof dateVal === 'object') {
    if (typeof dateVal.toDate === 'function') {
      try {
        const d = dateVal.toDate();
        return isNaN(d.getTime()) ? null : d;
      } catch {
        return null;
      }
    }
    if (typeof dateVal.seconds === 'number') {
      const d = new Date(dateVal.seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();

    // 1. If it's a full ISO timestamp with time component (T), parse via Date
    if (trimmed.includes('T')) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
    }

    // 2. Embedded YYYY-MM-DD pattern (e.g. "[yesterday 2026-11-20]", "2026-11-20")
    const isoMatch = trimmed.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      const m = parseInt(isoMatch[2], 10) - 1;
      const d = parseInt(isoMatch[3], 10);
      return new Date(y, m, d);
    }

    // 3. Embedded DD-MM-YYYY or DD/MM/YYYY pattern
    const ddmmyyyy = trimmed.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (ddmmyyyy) {
      const d = parseInt(ddmmyyyy[1], 10);
      const m = parseInt(ddmmyyyy[2], 10) - 1;
      const y = parseInt(ddmmyyyy[3], 10);
      return new Date(y, m, d);
    }

    // 4. Relative keyword fallbacks
    const lower = trimmed.toLowerCase();
    if (lower.includes('yesterday')) {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    if (lower.includes('today')) {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    // 5. Standard Date parsing fallback
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
  }

  return null;
}

/**
 * Returns a standardized "YYYY-MM-DD" local calendar date string, or empty string if invalid.
 */
export function getLocalDateString(dateVal) {
  const d = parseLocalDate(dateVal);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns today's date in local calendar format "YYYY-MM-DD" (resilient to midnight UTC rollbacks).
 */
export function getLocalTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns current local month in "YYYY-MM" format.
 */
export function getCurrentMonthString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Returns calendar month boundary info for queries and summary calculations.
 */
export function getCurrentMonthBounds() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${y}-${m}`;
  const firstDayOfMonth = `${monthPrefix}-01`;
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
  const lastDayOfMonth = `${monthPrefix}-${String(lastDay).padStart(2, '0')}`;
  return { now, monthPrefix, firstDayOfMonth, lastDayOfMonth };
}

/**
 * Returns a sortable date key "YYYY-MM-DD" or "undated".
 */
export function getDateKey(dateVal) {
  const str = getLocalDateString(dateVal);
  return str || 'undated';
}

/**
 * Generates human-friendly ledger day headings: "Today", "Yesterday", or "21 November".
 */
export function getDayHeading(dateVal) {
  const d = parseLocalDate(dateVal);
  if (!d) return 'Undated';

  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (isToday) return 'Today';

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return 'Yesterday';

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

/**
 * Safely extracts a millisecond timestamp from Firestore Timestamps, Date instances,
 * plain { seconds, nanoseconds } objects, or strings without ever producing NaN.
 */
export function getTimestampMs(val) {
  if (!val) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      return isNaN(d.getTime()) ? 0 : d.getTime();
    } catch {
      return 0;
    }
  }
  if (typeof val.seconds === 'number') {
    return val.seconds * 1000 + (val.nanoseconds ? Math.floor(val.nanoseconds / 1e6) : 0);
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? 0 : val.getTime();
  }
  const t = new Date(val).getTime();
  return isNaN(t) ? 0 : t;
}

/**
 * Strictly sorts a list of transactions chronologically descending (newest calendar date first,
 * tie-breaking with newest creation timestamp). Undated transactions always sort to the bottom.
 */
export function sortTransactionsChronological(list) {
  if (!Array.isArray(list)) return [];
  return list.sort((a, b) => {
    const keyA = getDateKey(a.date);
    const keyB = getDateKey(b.date);

    if (keyA === 'undated' && keyB === 'undated') {
      return getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt);
    }
    if (keyA === 'undated') return 1;
    if (keyB === 'undated') return -1;

    const cmp = keyB.localeCompare(keyA);
    if (cmp !== 0) return cmp;

    return getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt);
  });
}
