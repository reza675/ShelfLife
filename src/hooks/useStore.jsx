/**
 * useStore.js – global state management via React Context + useReducer.
 *
 * State shape:
 *   items:          FoodItem[]
 *   log:            LogEntry[]
 *   loggedExpiredIds: string[]
 *   storageAvailable: boolean
 *
 * FoodItem: { id, name, category, price, addedAt, expiryDate, status }
 * LogEntry: { id, text, type ('added'|'consumed'|'expired'), ts }
 *
 * Auto-expire is handled by a useEffect in StoreProvider that
 * watches `now` from useNow() and dispatches EXPIRE_ITEMS when needed.
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
} from 'react';
import {
  STORAGE_KEY_V1,
  STORAGE_LOG_KEY_V1,
  STORAGE_LOGGED_IDS_KEY,
} from '../lib/constants.js';
import { lsGet, lsSet, getUrgency, itemFreshRatio, sortByUrgency } from '../lib/helpers.js';
import { buildSampleData, buildSampleLog } from '../lib/sampleData.js';
import { useNow } from './useNow.js';

// ── Initial state loader ──────────────────────────────────────────────────────
function loadInitialState() {
  const savedItems = lsGet(STORAGE_KEY_V1, null);
  const savedLog   = lsGet(STORAGE_LOG_KEY_V1, null);
  const savedLoggedIds = lsGet(STORAGE_LOGGED_IDS_KEY, null);

  const isFirstRun = !savedItems || (Array.isArray(savedItems) && savedItems.length === 0);

  if (isFirstRun) {
    const items = buildSampleData();
    const { log, loggedIds } = buildSampleLog(items);
    return { items, log, loggedExpiredIds: loggedIds, storageAvailable: true };
  }

  return {
    items:            Array.isArray(savedItems) ? savedItems : [],
    log:              Array.isArray(savedLog)   ? savedLog   : [],
    loggedExpiredIds: Array.isArray(savedLoggedIds) ? savedLoggedIds : [],
    storageAvailable: true,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const items = [...state.items, action.item];
      const log   = [...state.log, {
        id: crypto.randomUUID(),
        text: `${action.item.name} ditambahkan ke daftar`,
        type: 'added',
        ts:   action.item.addedAt,
      }];
      return { ...state, items, log };
    }

    case 'CONSUME_ITEM': {
      const item  = state.items.find((i) => i.id === action.id);
      if (!item) return state;
      const items = state.items.map((i) => i.id === action.id ? { ...i, status: 'consumed' } : i);
      const log   = [...state.log, {
        id: crypto.randomUUID(),
        text: `${item.name} ditandai dikonsumsi`,
        type: 'consumed',
        ts:   Date.now(),
      }];
      return { ...state, items, log };
    }

    case 'DELETE_ITEM': {
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    }

    /**
     * EXPIRE_ITEMS – auto-expire active items past their expiryDate.
     * action.expired: FoodItem[] – items to expire
     * action.now:     number    – current timestamp
     *
     * Exactly one log entry per item; duplicate guard via loggedExpiredIds.
     */
    case 'EXPIRE_ITEMS': {
      const toExpire  = action.expired;
      const newIds    = toExpire.map((i) => i.id);
      const items     = state.items.map((i) =>
        newIds.includes(i.id) ? { ...i, status: 'expired' } : i
      );
      const newLogEntries = toExpire.map((i) => ({
        id: crypto.randomUUID(),
        text: `${i.name} telah kedaluwarsa`,
        type: 'expired',
        ts:   action.now,
      }));
      return {
        ...state,
        items,
        log:              [...state.log, ...newLogEntries],
        loggedExpiredIds: [...state.loggedExpiredIds, ...newIds],
      };
    }

    case 'RESET_SAMPLE': {
      const items = buildSampleData();
      const { log, loggedIds } = buildSampleLog(items);
      return { ...state, items, log, loggedExpiredIds: loggedIds };
    }

    case 'CLEAR_ALL': {
      return { ...state, items: [], log: [], loggedExpiredIds: [] };
    }

    case 'SET_STORAGE_UNAVAILABLE': {
      return { ...state, storageAvailable: false };
    }

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadInitialState);
  const now = useNow();

  // ── Persist on change ─────────────────────────────────────────────────────
  useEffect(() => { lsSet(STORAGE_KEY_V1, state.items); },            [state.items]);
  useEffect(() => { lsSet(STORAGE_LOG_KEY_V1, state.log); },          [state.log]);
  useEffect(() => { lsSet(STORAGE_LOGGED_IDS_KEY, state.loggedExpiredIds); }, [state.loggedExpiredIds]);

  // ── Auto-expire: runs on every `now` tick ──────────────────────────────────
  useEffect(() => {
    const toExpire = state.items.filter(
      (item) =>
        item.status === 'active' &&
        item.expiryDate <= now &&
        !state.loggedExpiredIds.includes(item.id)
    );
    if (toExpire.length > 0) {
      dispatch({ type: 'EXPIRE_ITEMS', expired: toExpire, now });
    }
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values (useMemo – pure, no side effects) ─────────────────────
  const derived = useMemo(() => {
    const enriched = state.items.map((item) => {
      const msLeft  = item.expiryDate - now;
      const urgency = item.status === 'active' ? getUrgency(msLeft) : item.status;
      const freshRatio = item.status === 'active' ? itemFreshRatio(item, now) : 0;
      return { ...item, msLeft, urgency, freshRatio };
    });

    const activeItems    = sortByUrgency(enriched.filter((i) => i.status === 'active'));
    const expiredItems   = enriched.filter((i) => i.status === 'expired');
    const consumedItems  = enriched.filter((i) => i.status === 'consumed');

    // Freshness Score: average(clamp ratio) × 100 across active items
    const freshnessScore = activeItems.length === 0
      ? null
      : Math.round(activeItems.reduce((s, i) => s + i.freshRatio, 0) / activeItems.length * 100);

    // Savings vs Waste
    const savings     = consumedItems.reduce((s, i) => s + i.price, 0);
    const waste       = expiredItems.reduce((s, i)  => s + i.price, 0);
    const savingsRatio = (savings + waste) > 0 ? savings / (savings + waste) : null;

    // Kritis count for sidebar badge
    const kritisCount = activeItems.filter((i) => i.urgency === 'Kritis').length;

    // Items expiring in the next 7 days (active) grouped by day offset 0–6
    const expiringSoon7 = Array.from({ length: 7 }, (_, d) => {
      const dayStart = new Date(); dayStart.setHours(0,0,0,0); dayStart.setDate(dayStart.getDate() + d);
      const dayEnd   = new Date(dayStart); dayEnd.setHours(23,59,59,999);
      return {
        label: d === 0 ? 'Hari ini' : d === 1 ? 'Besok' : `+${d}h`,
        count: activeItems.filter((i) => i.expiryDate >= dayStart.getTime() && i.expiryDate <= dayEnd.getTime()).length,
      };
    });

    return {
      enriched, activeItems, expiredItems, consumedItems,
      freshnessScore, savings, waste, savingsRatio,
      kritisCount, expiringSoon7,
    };
  }, [state.items, now]);

  const value = { state, dispatch, derived, now };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
