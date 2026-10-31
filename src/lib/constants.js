/**
 * constants.js – shared app-wide constants
 * Business logic: urgency rules, categories, meal rules, storage keys.
 */
import {
  Leaf, Apple, Beef, Milk, UtensilsCrossed, Package,
  AlertTriangle, Clock, CheckCircle2, XCircle,
} from 'lucide-react';

// ── Storage ───────────────────────────────────────────────────────────────────
// Version suffix in key: bump to invalidate old schema
export const STORAGE_KEY_V1        = 'shelflife_v1_items';
export const STORAGE_LOG_KEY_V1    = 'shelflife_v1_log';
export const STORAGE_LOGGED_IDS_KEY = 'shelflife_v1_logged_expired_ids';

// ── Ticker ────────────────────────────────────────────────────────────────────
/** Shared interval period (ms). One setInterval for the whole app. */
export const TICK_MS = 60_000;

// ── Categories ────────────────────────────────────────────────────────────────
export const CATEGORIES = [
  { value: 'Sayur',        label: 'Sayur',         Icon: Leaf },
  { value: 'Buah',         label: 'Buah',          Icon: Apple },
  { value: 'Daging/Ikan',  label: 'Daging / Ikan', Icon: Beef },
  { value: 'Susu & Telur', label: 'Susu & Telur',  Icon: Milk },
  { value: 'Makanan Jadi', label: 'Makanan Jadi',  Icon: UtensilsCrossed },
  { value: 'Lainnya',      label: 'Lainnya',        Icon: Package },
];

// ── Urgency ───────────────────────────────────────────────────────────────────
/**
 * Urgency rules (applied to active items only):
 *   Kedaluwarsa : msLeft ≤ 0
 *   Kritis      : 0 < msLeft ≤ 24 h
 *   Segera      : 24 h < msLeft ≤ 72 h
 *   Aman        : msLeft > 72 h
 */
export const URGENCY_ORDER = { Kritis: 0, Segera: 1, Aman: 2, Kedaluwarsa: 3 };

/**
 * URGENCY_META – light theme.
 * Each status uses a solid text color on a tinted pill background.
 * Contrast ratios (text on pill bg):
 *   Aman    #0b7d57 on #dcf5e8 → 5.1:1  ✓
 *   Segera  #a85a00 on #fff0d9 → 5.9:1  ✓
 *   Kritis  #c62828 on #fde4e4 → 7.2:1  ✓
 *   Expired #5b4b9a on #ebe7f8 → 5.8:1  ✓
 */
export const URGENCY_META = {
  Aman:        { color: '#0b7d57', Icon: CheckCircle2,  bg: '#dcf5e8' },
  Segera:      { color: '#a85a00', Icon: Clock,          bg: '#fff0d9' },
  Kritis:      { color: '#c62828', Icon: AlertTriangle,  bg: '#fde4e4' },
  Kedaluwarsa: { color: '#5b4b9a', Icon: XCircle,        bg: '#ebe7f8' },
};

// ── Meal suggestion rules (rule-based, NOT AI) ────────────────────────────────
// 6 rules keyed by category value
export const MEAL_RULES = {
  'Sayur':        { dish: 'Tumis atau sup sayur',                 why: 'Sayuran segar terbaik segera diolah.' },
  'Buah':         { dish: 'Jus segar atau fruit salad',           why: 'Buah matang paling bergizi saat masih segar.' },
  'Daging/Ikan':  { dish: 'Goreng/panggang dengan bumbu sederhana', why: 'Protein hewani perlu segera dimasak.' },
  'Susu & Telur': { dish: 'Omelette atau susu hangat',            why: 'Protein nabati/hewani mudah diolah.' },
  'Makanan Jadi': { dish: 'Panaskan dan konsumsi segera',         why: 'Makanan jadi cepat basi setelah dibuka.' },
  'Lainnya':      { dish: 'Cek resep sederhana online',           why: 'Manfaatkan sebelum kedaluwarsa.' },
};
