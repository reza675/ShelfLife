/**
 * DashboardPage.jsx – overview page with KPI tiles, gauges, urgent list,
 * and a 7-day expiry bar chart.
 *
 * No form or full log here — those are in their own pages.
 */
import React from 'react';
import { ArrowRight, CheckCircle2, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';
import { fmtRp, formatCountdown } from '../lib/helpers.js';
import { URGENCY_META } from '../lib/constants.js';
import { Gauge } from '../components/Gauge.jsx';
import { UrgencyBadge } from '../components/UrgencyBadge.jsx';
import { CategoryIcon } from '../components/CategoryIcon.jsx';

// ── KPI Tile ──────────────────────────────────────────────────────────────────
function KpiTile({ label, value, sub, color, isCurrency }) {
  return (
    <div className="card card-hover" style={{ minWidth: 0 }}>
      <p style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 4 }}>{label}</p>
      <p
        className="num"
        style={{ fontSize: isCurrency ? 18 : 28, fontWeight: 700, color: color || 'var(--c-text)', lineHeight: 1.2, wordBreak: 'break-word' }}
      >
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: 'var(--c-muted)', marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

// ── 7-day Expiry Bar Chart (pure SVG) ─────────────────────────────────────────
/**
 * ExpiryBarChart renders a bar chart showing how many items expire each of the
 * next 7 days. Pure SVG, no chart library.
 *
 * X-axis labels: short day name + date, e.g. "Sab 31".
 * Bar colors: today = Kritis red, days 1-2 = Segera amber, days 3+ = Aman green.
 * Count label shown above each non-zero bar.
 * Color legend below the chart.
 *
 * Fills the full card width via viewBox scaling + width="100%".
 */
function ExpiryBarChart({ data }) {
  const maxCount  = Math.max(...data.map((d) => d.count), 1);
  const PAD_L = 4, PAD_R = 4, PAD_T = 24, PAD_B = 36;
  const chartH    = 80;
  const svgW      = 320;
  const innerW    = svgW - PAD_L - PAD_R;
  const n         = data.length;
  const gap       = 8;
  const barW      = Math.floor((innerW - gap * (n - 1)) / n);

  // Indonesian short day names
  const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const barColor = (i) => {
    if (data[i].count === 0) return 'rgba(18,38,29,0.08)';
    if (i === 0) return '#c62828';
    if (i <= 2)  return '#a85a00';
    return '#0b7d57';
  };

  // Build short label "Sab 31"
  const buildLabel = (d, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dayName = DAYS_ID[date.getDay()];
    const dayNum  = date.getDate();
    return `${dayName} ${dayNum}`;
  };

  return (
    <div style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${svgW} ${PAD_T + chartH + PAD_B}`}
        role="img"
        aria-label="Grafik item kedaluwarsa 7 hari ke depan"
        style={{ width: '100%', display: 'block' }}
      >
        {/* Muted gridlines */}
        {[0, 0.5, 1].map((frac) => {
          const y = PAD_T + (1 - frac) * chartH;
          return (
            <line key={frac}
              x1={PAD_L} x2={svgW - PAD_R} y1={y} y2={y}
              stroke="rgba(18,38,29,0.08)" strokeWidth="1" strokeDasharray="4 3" />
          );
        })}

        {data.map((d, i) => {
          const barH = Math.max((d.count / maxCount) * chartH, d.count > 0 ? 8 : 0);
          const x    = PAD_L + i * (barW + gap);
          const y    = PAD_T + chartH - barH;
          const clr  = barColor(i);
          const label = buildLabel(d, i);
          return (
            <g key={i} aria-label={`${label}: ${d.count} item`}>
              <rect x={x} y={y} width={barW} height={barH} rx="5" fill={clr} />
              {/* Count label above bar */}
              {d.count > 0 && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle"
                  fill="var(--c-text)" fontSize="10" fontWeight="600" className="num">
                  {d.count}
                </text>
              )}
              {/* Day label below bar (two lines: day name, date) */}
              <text x={x + barW / 2} y={PAD_T + chartH + 14} textAnchor="middle"
                fill="var(--c-muted)" fontSize="9">
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 4, justifyContent: 'center' }}>
        {[
          { color: '#c62828', label: 'Hari ini' },
          { color: '#a85a00', label: '1–2 hari' },
          { color: '#0b7d57', label: '3–6 hari' },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--c-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Urgent item row ───────────────────────────────────────────────────────────
function UrgentRow({ item, dispatch }) {
  const meta      = URGENCY_META[item.urgency] || URGENCY_META['Aman'];
  const countdown = formatCountdown(item.msLeft);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
        borderBottom: '1px solid var(--c-border-soft)',
      }}
    >
      <span style={{ color: meta.color, flexShrink: 0 }} aria-hidden="true">
        <CategoryIcon category={item.category} size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </p>
        <p style={{ fontSize: 12, color: 'var(--c-muted)' }}>{item.category}</p>
      </div>
      <UrgencyBadge urgency={item.urgency} />
      <span className="num" style={{ fontSize: 13, color: meta.color, flexShrink: 0 }}>{countdown}</span>
      <button
        className="btn-ghost"
        style={{ padding: '5px 10px', fontSize: 12, flexShrink: 0 }}
        onClick={() => dispatch({ type: 'CONSUME_ITEM', id: item.id })}
        aria-label={`Tandai ${item.name} dikonsumsi`}
      >
        <CheckCircle2 size={13} aria-hidden="true" />
      </button>
    </div>
  );
}

// ── Savings vs Waste donut (SVG) ──────────────────────────────────────────────
/**
 * SavingsDonut – 2-segment donut.
 * Savings = emerald #0b7d57; Waste = soft coral #e5675f.
 * Uses stroke-dasharray / stroke-dashoffset technique.
 */
function SavingsDonut({ savingsRatio }) {
  const r    = 50;
  const cx   = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  const sDash = circ * savingsRatio;
  const wDash = circ * (1 - savingsRatio);

  return (
    <svg viewBox="0 0 140 140" role="img"
      aria-label={`Hemat ${Math.round(savingsRatio * 100)}%, Boros ${Math.round((1 - savingsRatio) * 100)}%`}
      style={{ width: 140, height: 140, flexShrink: 0 }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(18,38,29,0.07)" strokeWidth="18" />
      {/* Waste arc */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="#e5675f" strokeWidth="18" strokeOpacity="0.75"
        strokeDasharray={`${wDash} ${circ}`}
        strokeDashoffset={-sDash}
        transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round" />
      {/* Savings arc */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="#0b7d57" strokeWidth="18"
        strokeDasharray={`${sDash} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="round" className="gauge-arc" />
      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--c-text)"
        fontSize="18" fontWeight="700" className="num">
        {Math.round(savingsRatio * 100)}%
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--c-muted)" fontSize="9">hemat</text>
    </svg>
  );
}

// ── DashboardPage ─────────────────────────────────────────────────────────────
export function DashboardPage({ onNavigate }) {
  const { derived, dispatch } = useStore();
  const {
    activeItems, freshnessScore, savings, waste, savingsRatio,
    expiringSoon7,
  } = derived;

  const urgentTop5  = activeItems.slice(0, 5);
  const perluCount  = activeItems.filter((i) => i.urgency === 'Kritis' || i.urgency === 'Segera').length;
  const activeCount = activeItems.length;

  const freshnessColor = freshnessScore === null ? 'var(--c-muted)'
    : freshnessScore > 60 ? '#0b7d57'
    : freshnessScore > 30 ? '#a85a00'
    : '#c62828';

  return (
    <div className="page-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── KPI row ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <KpiTile label="Item aktif"              value={activeCount}  sub="bahan di kulkas" />
        <KpiTile label="Perlu segera dihabiskan" value={perluCount}   sub="Kritis + Segera"
          color={perluCount > 0 ? '#a85a00' : '#0b7d57'} />
        <KpiTile label="Total hemat"  value={fmtRp(savings)} isCurrency color="#0b7d57"  sub="dari item dikonsumsi" />
        <KpiTile label="Terbuang"     value={fmtRp(waste)}   isCurrency
          color={waste > 0 ? '#c62828' : 'var(--c-muted)'} sub="dari item kedaluwarsa" />
      </div>

      {/* ── Gauges row ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {/* Freshness gauge — large focal point */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: 8 }}>
          <p className="t-section" style={{ textAlign: 'center' }}>Skor Kesegaran</p>
          {freshnessScore !== null ? (
            <>
              <div style={{ width: '100%', maxWidth: 280 }}>
                <Gauge
                  value={freshnessScore / 100}
                  color={freshnessColor}
                  label={String(freshnessScore)}
                  sublabel="/ 100"
                  ariaLabel={`Skor kesegaran: ${freshnessScore} dari 100`}
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--c-muted)', textAlign: 'center' }}>
                Rata-rata kesegaran seluruh item aktif
              </p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--c-muted)', padding: '32px 0' }}>Belum ada data</p>
          )}
        </div>

        {/* Savings vs Waste */}
        <div className="card" style={{ padding: '24px 16px' }}>
          <p className="t-section" style={{ marginBottom: 16 }}>Hemat vs Boros</p>
          {savingsRatio !== null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <SavingsDonut savingsRatio={savingsRatio} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <TrendingUp size={14} aria-hidden="true" style={{ color: '#0b7d57' }} />
                    <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>Hemat</span>
                  </div>
                  <p className="num" style={{ fontSize: 18, fontWeight: 700, color: '#0b7d57' }}>{fmtRp(savings)}</p>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <TrendingDown size={14} aria-hidden="true" style={{ color: '#e5675f' }} />
                    <span style={{ fontSize: 12, color: 'var(--c-muted)' }}>Boros</span>
                  </div>
                  <p className="num" style={{ fontSize: 18, fontWeight: 700, color: '#e5675f' }}>{fmtRp(waste)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--c-muted)', padding: '32px 0' }}>Belum ada data</p>
          )}
        </div>
      </div>

      {/* ── Urgent items + bar chart ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {/* Segera habiskan list */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p className="t-section">Segera Habiskan</p>
            <button
              className="btn-ghost"
              style={{ fontSize: 12, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => onNavigate('stok')}
            >
              Lihat semua <ArrowRight size={12} aria-hidden="true" />
            </button>
          </div>

          {urgentTop5.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--c-muted)' }}>
              <Package size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} aria-hidden="true" />
              <p style={{ fontSize: 13 }}>Tidak ada item aktif.</p>
            </div>
          ) : (
            <div>
              {urgentTop5.map((item) => (
                <UrgentRow key={item.id} item={item} dispatch={dispatch} />
              ))}
            </div>
          )}
        </div>

        {/* 7-day expiry bar chart */}
        <div className="card">
          <p className="t-section" style={{ marginBottom: 16 }}>Kedaluwarsa 7 Hari ke Depan</p>
          {expiringSoon7.every((d) => d.count === 0) ? (
            <p style={{ fontSize: 13, color: 'var(--c-muted)', padding: '24px 0', textAlign: 'center' }}>
              Tidak ada item yang akan kedaluwarsa minggu ini.
            </p>
          ) : (
            <ExpiryBarChart data={expiringSoon7} />
          )}
        </div>
      </div>
    </div>
  );
}
