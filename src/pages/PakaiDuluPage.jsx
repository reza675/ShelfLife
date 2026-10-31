/**
 * PakaiDuluPage.jsx – 3 meal suggestion cards for the most urgent active items.
 * Rule-based (NOT AI). Labeled clearly as "saran sederhana, berbasis aturan".
 */
import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';
import { formatCountdown, fmtRp } from '../lib/helpers.js';
import { MEAL_RULES, URGENCY_META } from '../lib/constants.js';
import { UrgencyBadge } from '../components/UrgencyBadge.jsx';
import { CategoryIcon } from '../components/CategoryIcon.jsx';

export function PakaiDuluPage() {
  const { derived } = useStore();
  const { activeItems } = derived;

  // Take up to 3 most urgent active items
  const suggestions = activeItems.slice(0, 3).map((item) => ({
    item,
    rule: MEAL_RULES[item.category] || MEAL_RULES['Lainnya'],
  }));

  return (
    <div className="page-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>


      {suggestions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <Sparkles size={32} style={{ margin: '0 auto 12px', color: 'var(--c-border)' }} aria-hidden="true" />
          <p style={{ fontSize: 14, color: 'var(--c-muted)' }}>Tidak ada item aktif untuk disarankan.</p>
          <p style={{ fontSize: 12, color: 'var(--c-faint)', marginTop: 4 }}>Tambahkan bahan makanan terlebih dahulu.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {suggestions.map(({ item, rule }, idx) => {
            const meta = URGENCY_META[item.urgency] || URGENCY_META['Aman'];
            const countdown = formatCountdown(item.msLeft);
            return (
              <article
                key={item.id}
                className="card"
                aria-label={`Saran ${idx + 1}: ${item.name}`}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                {/* Item info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: meta.bg, color: meta.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    <CategoryIcon category={item.category} size={20} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--c-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--c-muted)' }}>{item.category}</p>
                  </div>
                </div>

                {/* Urgency + time remaining */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UrgencyBadge urgency={item.urgency} />
                  <span className="num" style={{ fontSize: 13, color: meta.color }}>{countdown}</span>
                  <span className="num" style={{ fontSize: 12, color: 'var(--c-muted)', marginLeft: 'auto' }}>{fmtRp(item.price)}</span>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--c-border-soft)' }} />

                {/* Suggestion */}
                <div>
                  <p style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saran masak</p>
                  <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--c-accent)' }}>{rule.dish}</p>
                  <p style={{ fontSize: 13, color: 'var(--c-muted)', marginTop: 4 }}>{rule.why}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
