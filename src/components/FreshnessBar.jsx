/**
 * FreshnessBar.jsx – thin progress bar showing item freshness ratio.
 * Includes a role="progressbar" for accessibility.
 */
import React from 'react';
import { URGENCY_META } from '../lib/constants.js';

export function FreshnessBar({ ratio, urgency }) {
  const pct  = Math.round(ratio * 100);
  const meta = URGENCY_META[urgency] || URGENCY_META['Aman'];
  return (
    <div
      className="fresh-bar"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Kesegaran ${pct}%`}
    >
      <div
        className="fresh-bar-fill"
        style={{ width: `${pct}%`, background: meta.color }}
      />
    </div>
  );
}
