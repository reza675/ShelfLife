/**
 * helpers.js – pure utility functions (no React imports)
 * Countdown, formatting, date math, urgency, freshness, storage wrappers.
 */
import { URGENCY_ORDER } from './constants.js';

// ── LocalStorage ──────────────────────────────────────────────────────────────
// Returns true/false; callers check this to show the warning banner.
let _storageAvailable = true;
export function isStorageAvailable() { return _storageAvailable; }

export function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    _storageAvailable = false;
    return fallback;
  }
}

export function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    _storageAvailable = false;
  }
}

// ── Date helpers ──────────────────────────────────────────────────────────────
/** YYYY-MM-DD for (today + offsetDays) in local time */
export function daysFromNow(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

/** YYYY-MM-DD for (now + offsetHours) in local time */
export function hoursFromNow(offsetHours) {
  const d = new Date(Date.now() + offsetHours * 3_600_000);
  return d.toISOString().split('T')[0];
}

/**
 * Convert "YYYY-MM-DD" → timestamp at end of that local day (23:59:59.999).
 * This is what <input type="date"> returns and what the user means.
 */
export function dateStrToEndOfDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

/** Format a timestamp → "HH:MM DD/MM/YY" */
export function fmtTimestamp(ts) {
  const d   = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
}

/** "DD MMM" short date */
export function fmtShortDate(ts) {
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/** Format price as "Rp X.XXX" */
export function fmtRp(amount) {
  return 'Rp\u00a0' + Math.round(amount).toLocaleString('id-ID');
}

// ── Urgency ───────────────────────────────────────────────────────────────────
/**
 * getUrgency(msLeft) – pure, based on constants.js rules.
 * Called with item.expiryDate - now.
 */
export function getUrgency(msLeft) {
  if (msLeft <= 0)               return 'Kedaluwarsa';
  if (msLeft <= 24 * 3_600_000)  return 'Kritis';
  if (msLeft <= 72 * 3_600_000)  return 'Segera';
  return 'Aman';
}

// ── Countdown text ────────────────────────────────────────────────────────────
/**
 * formatCountdown(msLeft) – human-readable remaining time.
 * Not read by screen readers on every tick (aria-live is on the event log only).
 */
export function formatCountdown(msLeft) {
  if (msLeft <= 0) return 'Kedaluwarsa';
  const totalSecs = Math.floor(msLeft / 1_000);
  const days  = Math.floor(totalSecs / 86_400);
  const hours = Math.floor((totalSecs % 86_400) / 3_600);
  const mins  = Math.floor((totalSecs % 3_600) / 60);
  if (days > 0)  return `${days}h ${hours}j`;
  if (hours > 0) return `${hours}j ${mins}m`;
  return `${mins}m`;
}

// ── Freshness ratio for one item ──────────────────────────────────────────────
/**
 * itemFreshRatio – clamp((expiryDate - now) / (expiryDate - addedAt), 0, 1)
 * Degenerate: if addedAt >= expiryDate, returns 0.
 */
export function itemFreshRatio(item, now) {
  const total = item.expiryDate - item.addedAt;
  const left  = item.expiryDate - now;
  return total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
}

// ── Sort items by urgency (most urgent first) ─────────────────────────────────
export function sortByUrgency(items) {
  return [...items].sort(
    (a, b) => (URGENCY_ORDER[a.urgency] ?? 9) - (URGENCY_ORDER[b.urgency] ?? 9)
  );
}
