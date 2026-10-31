/**
 * Gauge.jsx – semicircular SVG gauge, no chart library.
 *
 * @param {number} value    – 0 to 1
 * @param {string} color    – stroke color
 * @param {string} label    – large center text
 * @param {string} sublabel – small center text below label
 * @param {string} ariaLabel – accessible name
 */
import React from 'react';

export function Gauge({ value, color, label, sublabel, ariaLabel }) {
  const r  = 72;
  const cx = 100, cy = 96;
  const arcLen = Math.PI * r;                    // semicircle arc length
  const offset = arcLen * (1 - Math.max(0, Math.min(1, value)));

  // Describe a semicircle from 180° to 0° (left → right)
  const arcPath = () => {
    const toR = (deg) => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toR(180)); const y1 = cy + r * Math.sin(toR(180));
    const x2 = cx + r * Math.cos(toR(0));   const y2 = cy + r * Math.sin(toR(0));
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
  };

  const d = arcPath();

  return (
    <svg
      viewBox="0 0 200 110"
      role="img"
      aria-label={ariaLabel || `${label} ${sublabel}`}
      style={{ width: '100%' }}
    >
      {/* Track */}
      <path d={d} fill="none" stroke="rgba(15,159,110,0.12)" strokeWidth="14" strokeLinecap="round" />
      {/* Value arc – thick stroke with rounded caps */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={arcLen}
        strokeDashoffset={offset}
        className="gauge-arc"
      />
      {/* Center label */}
      <text x={cx} y={cy - 10} textAnchor="middle" fill="var(--c-text)" fontSize="30" fontWeight="700" className="num">
        {label}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--c-muted)" fontSize="11">
        {sublabel}
      </text>
    </svg>
  );
}
