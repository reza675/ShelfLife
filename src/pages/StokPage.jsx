/**
 * StokPage.jsx – full food inventory with:
 *   - Search box
 *   - Category filter dropdown
 *   - Urgency filter chips with counts
 *   - Sort: paling mendesak | harga | nama
 *   - Card/Table view toggle
 *   - Empty states per filter
 *   - Row actions: Tandai dikonsumsi, Hapus
 */
import React, { useState, useMemo } from 'react';
import {
  Search, LayoutGrid, Table2, CheckCircle2, Trash2,
  AlertTriangle, ChevronDown, Filter,
} from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';
import { formatCountdown, fmtRp } from '../lib/helpers.js';
import { CATEGORIES, URGENCY_META } from '../lib/constants.js';
import { UrgencyBadge } from '../components/UrgencyBadge.jsx';
import { CategoryIcon } from '../components/CategoryIcon.jsx';
import { FreshnessBar } from '../components/FreshnessBar.jsx';

const URGENCY_FILTERS = [
  { value: 'Semua',       label: 'Semua' },
  { value: 'Kritis',      label: 'Kritis' },
  { value: 'Segera',      label: 'Segera' },
  { value: 'Aman',        label: 'Aman' },
  { value: 'Kedaluwarsa', label: 'Kedaluwarsa' },
];

const SORT_OPTIONS = [
  { value: 'urgency', label: 'Paling mendesak' },
  { value: 'price',   label: 'Harga tertinggi' },
  { value: 'name',    label: 'Nama A–Z' },
];

const URGENCY_ORDER = { Kritis: 0, Segera: 1, Aman: 2, Kedaluwarsa: 3, consumed: 4 };

// ── Food Card (grid view) ─────────────────────────────────────────────────────
function FoodCardGrid({ item, dispatch }) {
  const meta      = URGENCY_META[item.urgency] || URGENCY_META['Kedaluwarsa'];
  const countdown = item.status === 'active' ? formatCountdown(item.msLeft) : (item.status === 'consumed' ? 'Dikonsumsi' : 'Kedaluwarsa');

  return (
    <article
      className="card card-hover"
      aria-label={`${item.name}, ${item.urgency}`}
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ color: meta.color, flexShrink: 0 }} aria-hidden="true">
            <CategoryIcon category={item.category} size={16} />
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.name}
            </p>
            <p style={{ fontSize: 11, color: 'var(--c-muted)' }}>{item.category}</p>
          </div>
        </div>
        <UrgencyBadge urgency={item.urgency} />
      </div>

      {/* Countdown + price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span className="num" style={{ color: meta.color }}>{countdown}</span>
        <span className="num" style={{ color: 'var(--c-muted)' }}>{fmtRp(item.price)}</span>
      </div>

      {/* Freshness bar (active only) */}
      {item.status === 'active' && <FreshnessBar ratio={item.freshRatio} urgency={item.urgency} />}

      {/* Actions (active only) */}
      {item.status === 'active' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center', padding: '6px 8px', fontSize: 12, color: 'var(--c-accent)', borderColor: 'rgba(52,211,153,0.2)' }}
            onClick={() => dispatch({ type: 'CONSUME_ITEM', id: item.id })}
            aria-label={`Tandai ${item.name} dikonsumsi`}
          >
            <CheckCircle2 size={12} aria-hidden="true" />
            Dikonsumsi
          </button>
          <button
            className="btn-danger"
            style={{ padding: '6px 10px' }}
            onClick={() => dispatch({ type: 'DELETE_ITEM', id: item.id })}
            aria-label={`Hapus ${item.name}`}
          >
            <Trash2 size={12} aria-hidden="true" />
          </button>
        </div>
      )}
    </article>
  );
}

// ── Food Table row ────────────────────────────────────────────────────────────
function FoodTableRow({ item, dispatch }) {
  const meta      = URGENCY_META[item.urgency] || URGENCY_META['Kedaluwarsa'];
  const countdown = item.status === 'active' ? formatCountdown(item.msLeft) : '—';
  const freshPct  = item.status === 'active' ? Math.round(item.freshRatio * 100) : 0;
  const expiryStr = new Date(item.expiryDate).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'2-digit' });

  return (
    <tr style={{ borderBottom: '1px solid var(--c-border-soft)' }}>
      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: meta.color }} aria-hidden="true"><CategoryIcon category={item.category} size={14} /></span>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-text)' }}>{item.name}</span>
        </div>
      </td>
      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--c-muted)', whiteSpace: 'nowrap' }}>{item.category}</td>
      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, color: 'var(--c-text)' }} className="num">{fmtRp(item.price)}</td>
      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
        <span className="num" style={{ fontSize: 13, color: meta.color }}>{countdown}</span>
      </td>
      <td style={{ padding: '10px 12px', minWidth: 80 }}>
        {item.status === 'active' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FreshnessBar ratio={item.freshRatio} urgency={item.urgency} />
            <span className="num" style={{ fontSize: 11, color: 'var(--c-muted)', flexShrink: 0 }}>{freshPct}%</span>
          </div>
        ) : <span style={{ color: 'var(--c-faint)', fontSize: 12 }}>—</span>}
      </td>
      <td style={{ padding: '10px 12px' }}><UrgencyBadge urgency={item.urgency} /></td>
      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontSize: 12, color: 'var(--c-muted)' }} className="num">{expiryStr}</td>
      <td style={{ padding: '10px 8px' }}>
        {item.status === 'active' && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-ghost" style={{ padding: '5px 8px', fontSize: 11 }}
              onClick={() => dispatch({ type: 'CONSUME_ITEM', id: item.id })}
              aria-label={`Tandai ${item.name} dikonsumsi`}>
              <CheckCircle2 size={12} aria-hidden="true" />
            </button>
            <button className="btn-danger" style={{ padding: '5px 8px' }}
              onClick={() => dispatch({ type: 'DELETE_ITEM', id: item.id })}
              aria-label={`Hapus ${item.name}`}>
              <Trash2 size={12} aria-hidden="true" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ── StokPage ──────────────────────────────────────────────────────────────────
export function StokPage() {
  const { derived, dispatch } = useStore();
  const { enriched }          = derived;

  const [search,        setSearch]        = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [urgencyFilter,  setUrgencyFilter]  = useState('Semua');
  const [sortBy,        setSortBy]        = useState('urgency');
  const [viewMode,      setViewMode]      = useState('card'); // 'card' | 'table'

  // Counts per urgency filter
  const urgencyCounts = useMemo(() => {
    const all = enriched.filter((i) => i.status !== 'consumed');
    return {
      Semua:       all.length,
      Kritis:      all.filter((i) => i.urgency === 'Kritis').length,
      Segera:      all.filter((i) => i.urgency === 'Segera').length,
      Aman:        all.filter((i) => i.urgency === 'Aman').length,
      Kedaluwarsa: all.filter((i) => i.status === 'expired').length,
    };
  }, [enriched]);

  const filteredItems = useMemo(() => {
    let items = enriched.filter((i) => i.status !== 'consumed');

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }

    // Category
    if (categoryFilter !== 'Semua') {
      items = items.filter((i) => i.category === categoryFilter);
    }

    // Urgency
    if (urgencyFilter === 'Kedaluwarsa') {
      items = items.filter((i) => i.status === 'expired');
    } else if (urgencyFilter !== 'Semua') {
      items = items.filter((i) => i.status === 'active' && i.urgency === urgencyFilter);
    }

    // Sort
    return [...items].sort((a, b) => {
      if (sortBy === 'urgency') return (URGENCY_ORDER[a.urgency] ?? 9) - (URGENCY_ORDER[b.urgency] ?? 9);
      if (sortBy === 'price')   return b.price - a.price;
      if (sortBy === 'name')    return a.name.localeCompare(b.name, 'id');
      return 0;
    });
  }, [enriched, search, categoryFilter, urgencyFilter, sortBy]);

  const URGENCY_CHIP_COLOR = { Kritis: '#c62828', Segera: '#a85a00', Aman: '#0b7d57', Kedaluwarsa: '#5b4b9a' };

  return (
    <div className="page-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 140 }}>
          <Search size={14} aria-hidden="true"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)' }} />
          <input
            type="search"
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Cari nama makanan…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Cari nama makanan"
          />
        </div>

        {/* Category filter */}
        <div style={{ position: 'relative' }}>
          <select
            className="input"
            style={{ appearance: 'none', paddingRight: 28, minWidth: 130 }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter kategori"
          >
            <option value="Semua">Semua Kategori</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <ChevronDown size={12} aria-hidden="true"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)', pointerEvents: 'none' }} />
        </div>

        {/* Sort */}
        <div style={{ position: 'relative' }}>
          <select
            className="input"
            style={{ appearance: 'none', paddingRight: 28, minWidth: 150 }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Urutkan"
          >
            {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown size={12} aria-hidden="true"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-muted)', pointerEvents: 'none' }} />
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--glass-bg)', borderRadius: 8, padding: 3 }}>
          {[{ m: 'card', Icon: LayoutGrid }, { m: 'table', Icon: Table2 }].map(({ m, Icon }) => (
            <button key={m} onClick={() => setViewMode(m)}
              style={{
                padding: '5px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: viewMode === m ? 'rgba(255,255,255,0.80)' : 'transparent',
                color: viewMode === m ? 'var(--c-text)' : 'var(--c-muted)',
              }}
              aria-pressed={viewMode === m}
              aria-label={m === 'card' ? 'Tampilan kartu' : 'Tampilan tabel'}
            >
              <Icon size={15} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Urgency filter chips ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} role="group" aria-label="Filter urgensi">
        {URGENCY_FILTERS.map(({ value, label }) => {
          const isActive  = urgencyFilter === value;
          const count     = urgencyCounts[value] ?? 0;
          const chipColor = isActive ? (URGENCY_CHIP_COLOR[value] || 'var(--c-accent)') : 'var(--c-muted)';
          return (
            <button
              key={value}
              aria-pressed={isActive}
              onClick={() => setUrgencyFilter(value)}
              style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                border: `1px solid ${isActive ? chipColor : 'rgba(18,38,29,0.12)'}`,
                background: isActive
                  ? (value === 'Kritis'      ? '#fde4e4'
                  : value === 'Segera'       ? '#fff0d9'
                  : value === 'Aman'         ? '#dcf5e8'
                  : value === 'Kedaluwarsa'  ? '#ebe7f8'
                  : 'var(--c-accent-pale)')
                  : 'rgba(255,255,255,0.50)',
                color: chipColor, cursor: 'pointer',
              }}
            >
              {label}{count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* ── Content area ─────────────────────────────────────────────────── */}
      {filteredItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--c-muted)' }} role="status">
          <Filter size={32} style={{ margin: '0 auto 12px', opacity: 0.25 }} aria-hidden="true" />
          <p style={{ fontSize: 14 }}>
            {search || categoryFilter !== 'Semua' || urgencyFilter !== 'Semua'
              ? 'Tidak ada item yang cocok dengan filter.'
              : 'Belum ada bahan makanan. Tambahkan dari tombol di atas.'}
          </p>
        </div>
      ) : viewMode === 'card' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
          gap: 12,
        }}>
          {filteredItems.map((item) => (
            <FoodCardGrid key={item.id} item={item} dispatch={dispatch} />
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border-soft)', background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(10px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }} aria-label="Daftar bahan makanan">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.70)', borderBottom: '1px solid var(--c-border)' }}>
                {['Nama', 'Kategori', 'Harga', 'Sisa Waktu', 'Kesegaran', 'Status', 'Kedaluwarsa', ''].map((h) => (
                  <th key={h} style={{ padding: '9px 12px', textAlign: h === 'Harga' ? 'right' : 'left', fontSize: 12, fontWeight: 600, color: 'var(--c-secondary)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <FoodTableRow key={item.id} item={item} dispatch={dispatch} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
