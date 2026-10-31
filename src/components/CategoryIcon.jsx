/**
 * CategoryIcon.jsx – maps category string to the correct Lucide icon.
 */
import React from 'react';
import { CATEGORIES } from '../lib/constants.js';
import { Package } from 'lucide-react';

export function CategoryIcon({ category, size = 16 }) {
  const cat  = CATEGORIES.find((c) => c.value === category);
  const Icon = cat ? cat.Icon : Package;
  return <Icon size={size} aria-hidden="true" />;
}
