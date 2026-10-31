/**
 * UrgencyBadge.jsx – status indicator used throughout the app.
 * Always rendered with icon + text label (never color alone — WCAG 1.4.1).
 */
import React from 'react';
import { URGENCY_META } from '../lib/constants.js';

export function UrgencyBadge({ urgency, size = 'sm' }) {
  const meta = URGENCY_META[urgency];
  if (!meta) return null;
  const { Icon, color, bg } = meta;
  const iconSize = size === 'sm' ? 11 : 13;
  return (
    <span
      className="badge"
      style={{ background: bg, color }}
      aria-label={`Status: ${urgency}`}
    >
      <Icon size={iconSize} aria-hidden="true" />
      {urgency}
    </span>
  );
}
