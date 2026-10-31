/**
 * sampleData.js – generates ~12 sample items and matching log entries.
 * All dates are RELATIVE to Date.now(), never hardcoded calendar dates.
 * Called only on first run (empty localStorage) or when user clicks "Reset data contoh".
 */
import { daysFromNow, hoursFromNow, dateStrToEndOfDay } from './helpers.js';

function active(name, cat, price, dayOffset) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    category: cat,
    price,
    addedAt: now - 2 * 3_600_000,          // added 2h ago
    expiryDate: dateStrToEndOfDay(daysFromNow(dayOffset)),
    status: 'active',
  };
}

function activeH(name, cat, price, hourOffset) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    category: cat,
    price,
    addedAt: now - 3 * 3_600_000,
    expiryDate: dateStrToEndOfDay(hoursFromNow(hourOffset)),
    status: 'active',
  };
}

function expired(name, cat, price, daysAgo) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    category: cat,
    price,
    addedAt: now - (daysAgo + 3) * 86_400_000,
    expiryDate: now - daysAgo * 86_400_000,
    status: 'expired',
  };
}

function consumed(name, cat, price, daysAgo = 5) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    category: cat,
    price,
    addedAt: now - (daysAgo + 2) * 86_400_000,
    expiryDate: now + 3 * 86_400_000,
    status: 'consumed',
  };
}

export function buildSampleData() {
  return [
    activeH('Susu UHT Full Cream',   'Susu & Telur',  15_000,  6),   // ~6h  → Kritis
    activeH('Tahu Putih',            'Sayur',          8_000,  20),   // ~20h → Kritis
    active('Ayam Potong (500g)',     'Daging/Ikan',   35_000,   1),   // +1d  → Segera
    active('Tempe',                  'Makanan Jadi',   6_000,   2),   // +2d  → Segera
    active('Bayam Segar',            'Sayur',          5_000,   3),   // +3d  → Segera
    active('Ikan Salmon',            'Daging/Ikan',   60_000,   2),   // +2d  → Segera
    active('Apel Fuji (1 kg)',       'Buah',          25_000,   9),   // +9d  → Aman
    active('Telur Ayam (12 butir)',  'Susu & Telur',  28_000,  14),  // +14d → Aman
    expired('Yogurt Stroberi',       'Susu & Telur',  12_000,   2),   // expired 2d ago
    expired('Roti Tawar',            'Makanan Jadi',   9_000,   1),   // expired 1d ago
    consumed('Wortel Organik',       'Sayur',          7_000,   3),
    consumed('Pepaya Matang',        'Buah',          10_000,   5),
  ];
}

/**
 * buildSampleLog – creates log entries matching sample data.
 * Returns { log: LogEntry[], loggedIds: string[] }
 *   loggedIds: IDs of expired items already logged → prevents duplicate on reload.
 */
export function buildSampleLog(items) {
  const now = Date.now();
  const log = [];
  const loggedIds = new Set();

  items.forEach((item) => {
    // Expired items get an "expired" log entry
    if (item.status === 'expired') {
      log.push({
        id: crypto.randomUUID(),
        text: `${item.name} telah kedaluwarsa`,
        type: 'expired',
        ts: item.expiryDate + 60_000,      // logged just after expiry
      });
      loggedIds.add(item.id);
    }
    // Consumed items get a "consumed" log entry
    if (item.status === 'consumed') {
      log.push({
        id: crypto.randomUUID(),
        text: `${item.name} ditandai dikonsumsi`,
        type: 'consumed',
        ts: now - Math.floor(Math.random() * 5 * 86_400_000 + 86_400_000),
      });
    }
    // Every item gets an "added" entry
    log.push({
      id: crypto.randomUUID(),
      text: `${item.name} ditambahkan ke daftar`,
      type: 'added',
      ts: item.addedAt,
    });
  });

  log.sort((a, b) => a.ts - b.ts);
  return { log, loggedIds: [...loggedIds] };
}
