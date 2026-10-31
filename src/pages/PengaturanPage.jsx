/**
 * PengaturanPage.jsx – data management: reset sample, clear all, storage status.
 * Confirm dialogs inline (no separate modal).
 */
import React, { useState } from 'react';
import { RefreshCw, Trash2, HardDrive, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useStore } from '../hooks/useStore.jsx';
import { isStorageAvailable } from '../lib/helpers.js';

function ConfirmRow({ label, description, btnLabel, btnClass, onConfirm }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '16px 0', borderBottom: '1px solid var(--c-border-soft)', flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-text)' }}>{label}</p>
        <p style={{ fontSize: 12, color: 'var(--c-muted)', marginTop: 2 }}>{description}</p>
      </div>
      {confirming ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={btnClass}
            onClick={() => { onConfirm(); setConfirming(false); }}
          >
            Ya, lanjutkan
          </button>
          <button className="btn-ghost" onClick={() => setConfirming(false)}>Batal</button>
        </div>
      ) : (
        <button className={btnClass} onClick={() => setConfirming(true)}>
          {btnLabel}
        </button>
      )}
    </div>
  );
}

export function PengaturanPage() {
  const { dispatch, state } = useStore();
  const storageOk = isStorageAvailable();

  return (
    <div className="page-content fade-in" style={{ maxWidth: 640 }}>
      {/* Storage status */}
      <div className="card" style={{ marginBottom: 24 }}>
        <p className="t-section" style={{ marginBottom: 16 }}>Status Penyimpanan</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <HardDrive size={18} aria-hidden="true" style={{ color: 'var(--c-muted)' }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-text)' }}>Browser LocalStorage</p>
            <p style={{ fontSize: 12, color: 'var(--c-muted)' }}>
              Data tersimpan di browser ini, tidak disinkronkan ke perangkat lain.
            </p>
          </div>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
            color: storageOk ? '#0b7d57' : '#c62828' }}>
            {storageOk
              ? <><CheckCircle2 size={14} aria-hidden="true" /> Tersedia</>
              : <><AlertTriangle size={14} aria-hidden="true" /> Tidak tersedia</>}
          </span>
        </div>
        <div style={{ marginTop: 16, padding: '12px', background: 'rgba(18,38,29,0.04)', borderRadius: 'var(--r-md)' }}>
          <p style={{ fontSize: 12, color: 'var(--c-muted)' }}>
            <strong style={{ color: 'var(--c-text)' }}>Item aktif:</strong> {state.items.filter(i => i.status === 'active').length}
            &nbsp;·&nbsp;
            <strong style={{ color: 'var(--c-text)' }}>Dikonsumsi:</strong> {state.items.filter(i => i.status === 'consumed').length}
            &nbsp;·&nbsp;
            <strong style={{ color: 'var(--c-text)' }}>Kedaluwarsa:</strong> {state.items.filter(i => i.status === 'expired').length}
            &nbsp;·&nbsp;
            <strong style={{ color: 'var(--c-text)' }}>Log entries:</strong> {state.log.length}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="card">
        <p className="t-section" style={{ marginBottom: 4 }}>Kelola Data</p>
        <p style={{ fontSize: 12, color: 'var(--c-muted)', marginBottom: 16 }}>
          Semua operasi permanen dan tidak dapat dibatalkan.
        </p>

        <ConfirmRow
          label="Reset data contoh"
          description="Hapus semua data saat ini dan muat ulang 12 item sampel dengan tanggal relatif ke hari ini."
          btnLabel={<><RefreshCw size={13} aria-hidden="true" /> Reset data contoh</>}
          btnClass="btn-ghost"
          onConfirm={() => dispatch({ type: 'RESET_SAMPLE' })}
        />

        <ConfirmRow
          label="Hapus semua data"
          description="Hapus seluruh item, log, dan data tersimpan. Tindakan ini tidak dapat dibatalkan."
          btnLabel={<><Trash2 size={13} aria-hidden="true" /> Hapus semua data</>}
          btnClass="btn-danger"
          onConfirm={() => dispatch({ type: 'CLEAR_ALL' })}
        />
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: 'var(--c-faint)', textAlign: 'center' }}>
        ShelfLife v2.0 · IBM AI Builders Capstone 2026 · Sustainability &amp; Zero-Waste Track
      </div>
    </div>
  );
}
