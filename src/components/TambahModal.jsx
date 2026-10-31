/**
 * TambahModal.jsx – modal (desktop) / full-screen sheet (mobile) for adding a food item.
 * Accessible: focus trap, Esc to close, returns focus to trigger on close.
 * Validation: name required, price >= 0, valid expiry date.
 */
import React, { useState, useEffect, useRef, useId } from 'react';
import { X, Plus } from 'lucide-react';
import { CATEGORIES } from '../lib/constants.js';
import { dateStrToEndOfDay } from '../lib/helpers.js';
import { useStore } from '../hooks/useStore.jsx';

const EMPTY_FORM = { name: '', category: 'Sayur', price: '', expiryDate: '' };

export function TambahModal({ onClose, triggerRef }) {
  const { dispatch } = useStore();
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const firstInputRef = useRef(null);
  const modalRef      = useRef(null);

  const nameId   = useId();
  const catId    = useId();
  const priceId  = useId();
  const expId    = useId();

  // Focus first input on open
  useEffect(() => { firstInputRef.current?.focus(); }, []);

  // Esc to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus trap: keep Tab/Shift+Tab inside the modal
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const focusable = () =>
      [...el.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')];
    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      const nodes = focusable();
      const first = nodes[0];
      const last  = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    };
    el.addEventListener('keydown', handleTab);
    return () => el.removeEventListener('keydown', handleTab);
  }, []);

  function handleClose() {
    onClose();
    // Return focus to the trigger button
    setTimeout(() => triggerRef?.current?.focus(), 50);
  }

  function validate() {
    const errs = {};
    if (!form.name.trim())               errs.name      = 'Nama makanan wajib diisi.';
    if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0)
                                         errs.price     = 'Harga harus angka ≥ 0.';
    if (!form.expiryDate)                errs.expiryDate = 'Tanggal kedaluwarsa wajib diisi.';
    else if (isNaN(dateStrToEndOfDay(form.expiryDate))) errs.expiryDate = 'Tanggal tidak valid.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    dispatch({
      type: 'ADD_ITEM',
      item: {
        id:         crypto.randomUUID(),
        name:       form.name.trim(),
        category:   form.category,
        price:      Number(form.price),
        addedAt:    Date.now(),
        expiryDate: dateStrToEndOfDay(form.expiryDate),
        status:     'active',
      },
    });
    handleClose();
  }

  const field = (id, label, required, error, children) => (
    <div>
      <label htmlFor={id} style={{ display:'block', fontSize:13, fontWeight:500, marginBottom:4, color:'var(--c-text)' }}>
        {label}{required && <span aria-hidden="true" style={{ color:'#c62828', marginLeft:2 }}>*</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} role="alert" style={{ fontSize:12, color:'#c62828', marginTop:4 }}>{error}</p>
      )}
    </div>
  );

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div ref={modalRef} className="modal-box fade-in">
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h2 id="modal-title" className="t-section" style={{ margin:0 }}>Tambah Bahan Makanan</h2>
          <button className="btn-ghost" onClick={handleClose} aria-label="Tutup form" style={{ padding:'6px 8px' }}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {field(nameId, 'Nama Makanan', true, errors.name,
            <input
              ref={firstInputRef}
              id={nameId}
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="cth. Susu UHT Full Cream"
              className={`input${errors.name ? ' error' : ''}`}
              aria-required="true"
              aria-describedby={errors.name ? `${nameId}-err` : undefined}
              aria-invalid={!!errors.name}
            />
          )}

          {field(catId, 'Kategori', false, null,
            <select
              id={catId}
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="input"
              style={{ appearance:'none' }}
            >
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          )}

          {field(priceId, 'Harga (Rp)', false, errors.price,
            <input
              id={priceId}
              type="number"
              min="0"
              step="500"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              placeholder="cth. 15000"
              className={`input num${errors.price ? ' error' : ''}`}
              aria-describedby={errors.price ? `${priceId}-err` : undefined}
              aria-invalid={!!errors.price}
            />
          )}

          {field(expId, 'Tanggal Kedaluwarsa', true, errors.expiryDate,
            <input
              id={expId}
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
              className={`input${errors.expiryDate ? ' error' : ''}`}
              style={{ colorScheme: 'dark' }}
              aria-required="true"
              aria-describedby={errors.expiryDate ? `${expId}-err` : undefined}
              aria-invalid={!!errors.expiryDate}
            />
          )}

          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button type="button" className="btn-ghost" onClick={handleClose} style={{ flex:1 }}>Batal</button>
            <button type="submit" className="btn-primary" style={{ flex:1, justifyContent:'center' }}>
              <Plus size={14} aria-hidden="true" /> Tambah
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
