/**
 * LogPage.jsx – full-height mission log, grouped by day, with:
 *   - Filter by event type (Semua, Ditambahkan, Dikonsumsi, Kedaluwarsa)
 *   - Pause/Resume auto-scroll
 *   - Friendly empty state
 *   - Day grouping (Hari ini, Kemarin, older dates)
 */
import React, { useState, useEffect, useRef } from 'react';
import { PauseCircle, PlayCircle, Plus, CheckCircle2, AlertTriangle, ScrollText } from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';
import { fmtTimestamp } from '../lib/helpers.js';

const TYPE_FILTERS = [
  { value: 'Semua',       label: 'Semua' },
  { value: 'added',       label: 'Ditambahkan' },
  { value: 'consumed',    label: 'Dikonsumsi' },
  { value: 'expired',     label: 'Kedaluwarsa' },
];

const LOG_META = {
  added:    { Icon: Plus,          color: 'var(--c-accent)',   label: 'Ditambahkan' },
  consumed: { Icon: CheckCircle2,  color: '#0b7d57',     label: 'Dikonsumsi' },
  expired:  { Icon: AlertTriangle, color: '#a85a00',   label: 'Kedaluwarsa' },
};

/** Returns a day key for grouping: "Hari ini", "Kemarin", or "DD MMM YYYY" */
function dayKey(ts) {
  const date = new Date(ts);
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  date.setHours(0,0,0,0);
  if (date.getTime() === today.getTime()) return 'Hari ini';
  if (date.getTime() === yesterday.getTime()) return 'Kemarin';
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Group sorted log entries by day (newest day first) */
function groupByDay(entries) {
  const groups = {};
  [...entries].reverse().forEach((entry) => {
    const key = dayKey(entry.ts);
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  });
  return Object.entries(groups); // [[dayLabel, entries[]], ...]
}

export function LogPage() {
  const { state }         = useStore();
  const [typeFilter, setTypeFilter] = useState('Semua');
  const [paused,     setPaused]     = useState(false);
  const logRef      = useRef(null);
  const pausedRef   = useRef(false);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Auto-scroll when log changes (newest at bottom)
  useEffect(() => {
    if (!pausedRef.current && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state.log]);

  const filtered = typeFilter === 'Semua'
    ? state.log
    : state.log.filter((e) => e.type === typeFilter);

  const grouped = groupByDay(filtered);

  return (
    <div className="page-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12, height: 'calc(100dvh - 56px - 48px)', minHeight: 400 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }} role="group" aria-label="Filter jenis kejadian">
          {TYPE_FILTERS.map(({ value, label }) => {
            const isActive = typeFilter === value;
            return (
              <button
                key={value}
                aria-pressed={isActive}
                onClick={() => setTypeFilter(value)}
                style={{
                  padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                  border: `1px solid ${isActive ? 'var(--c-accent)' : 'var(--c-border)'}`,
                  background: isActive ? 'var(--c-accent-pale)' : 'transparent',
                  color: isActive ? 'var(--c-accent)' : 'var(--c-muted)',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          className="btn-ghost"
          style={{ flexShrink: 0 }}
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Lanjutkan auto-scroll' : 'Jeda auto-scroll'}
        >
          {paused
            ? <><PlayCircle  size={14} aria-hidden="true" /> Lanjutkan</>
            : <><PauseCircle size={14} aria-hidden="true" /> Jeda</>}
        </button>
      </div>

      {/* Log container */}
      <div
        ref={logRef}
        role="log"
        aria-label="Log aktivitas makanan"
        aria-live="off"
        style={{
          flex: 1, overflowY: 'auto', background: 'var(--glass-bg)',
          borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border-soft)',
          padding: 16,
        }}
      >
        {grouped.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--c-muted)', gap: 8, padding: '40px 0' }}>
            <ScrollText size={32} style={{ opacity: 0.2 }} aria-hidden="true" />
            <p style={{ fontSize: 14 }}>Belum ada aktivitas tercatat.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {grouped.map(([day, entries]) => (
              <section key={day} aria-labelledby={`day-${day}`}>
                {/* Day heading */}
                <h3
                  id={`day-${day}`}
                  style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--c-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    marginBottom: 10, paddingBottom: 6,
                    borderBottom: '1px solid var(--c-border-soft)',
                  }}
                >
                  {day}
                </h3>

                {/* Entries for this day */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {entries.map((entry) => {
                    const meta = LOG_META[entry.type] || LOG_META.added;
                    return (
                      <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        {/* Icon */}
                        <span style={{ marginTop: 2, flexShrink: 0, color: meta.color }} aria-hidden="true">
                          <meta.Icon size={14} />
                        </span>
                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 13, color: 'var(--c-text)' }}>{entry.text}</span>
                          <span style={{ display: 'block', fontSize: 11, color: 'var(--c-muted)', marginTop: 1 }}>
                            {meta.label}
                          </span>
                        </div>
                        {/* Timestamp */}
                        <span className="num" style={{ fontSize: 11, color: 'var(--c-muted)', flexShrink: 0, marginTop: 2 }}>
                          {fmtTimestamp(entry.ts)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
