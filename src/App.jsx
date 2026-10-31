/**
 * App.jsx – root component: app shell, state-based routing, sidebar + topbar.
 *
 * Pages:
 *   dashboard      → DashboardPage
 *   stok           → StokPage
 *   pakaidulu      → PakaiDuluPage
 *   log            → LogPage
 *   pengaturan     → PengaturanPage
 *
 * Shell layout:
 *   Desktop (≥1024px): 240px sidebar + content area
 *   Tablet  (768-1023): icon-only sidebar (60px)
 *   Mobile  (<768px):  no sidebar, fixed bottom tab bar
 *
 * The "+ Tambah Bahan" button is always visible in the topbar.
 * The modal (TambahModal) is rendered at the shell level (not per-page).
 */
import React, { useState, useRef } from 'react';
import {
  LayoutDashboard, ShoppingBasket, Sparkles, ScrollText,
  Settings, Plus, Leaf, Menu, X, AlertTriangle,
} from 'lucide-react';
import { StoreProvider, useStore } from './hooks/useStore.jsx';
import { fmtRp } from './lib/helpers.js';
import { TambahModal } from './components/TambahModal.jsx';

// ── Lazy page imports (static imports for simplicity, all in src/pages/) ─────
import { DashboardPage }   from './pages/DashboardPage.jsx';
import { StokPage }        from './pages/StokPage.jsx';
import { PakaiDuluPage }   from './pages/PakaiDuluPage.jsx';
import { LogPage }         from './pages/LogPage.jsx';
import { PengaturanPage }  from './pages/PengaturanPage.jsx';

// ── Nav items definition ──────────────────────────────────────────────────────
const NAV = [
  { id: 'dashboard',   label: 'Dashboard',      Icon: LayoutDashboard },
  { id: 'stok',        label: 'Stok Dapur',      Icon: ShoppingBasket,  badge: 'kritis' },
  { id: 'pakaidulu',   label: 'Pakai Dulu',       Icon: Sparkles },
  { id: 'log',         label: 'Log Aktivitas',    Icon: ScrollText },
  { id: 'pengaturan',  label: 'Pengaturan Data',  Icon: Settings },
];

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  stok:       'Stok Dapur',
  pakaidulu:  'Pakai Dulu',
  log:        'Log Aktivitas',
  pengaturan: 'Pengaturan Data',
};

// ── Shell inner (needs useStore) ──────────────────────────────────────────────
function Shell() {
  const { derived, state } = useStore();
  const [page,          setPage]          = useState('dashboard');
  const [sidebarOpen,   setSidebarOpen]   = useState(false); // mobile drawer
  const [showModal,     setShowModal]     = useState(false);
  const addBtnRef = useRef(null);

  const { kritisCount, savings } = derived;

  function nav(id) {
    setPage(id);
    setSidebarOpen(false);
  }

  // ── Sidebar nav list ────────────────────────────────────────────────────────
  function SidebarNav({ collapsed }) {
    return (
      <nav aria-label="Navigasi utama" style={{ padding:'8px 8px', flex:1, display:'flex', flexDirection:'column', gap:2 }}>
        {NAV.map(({ id, label, Icon, badge }) => {
          const isActive = page === id;
          const badgeCount = badge === 'kritis' ? kritisCount : 0;
          return (
            <button
              key={id}
              className={`nav-item${isActive ? ' active' : ''}`}
              onClick={() => nav(id)}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
              {!collapsed && (
                <>
                  <span className="nav-label">{label}</span>
                  {badgeCount > 0 && (
                    <span
                      style={{ background: '#fde4e4', color: '#c62828', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999 }}
                      aria-label={`${badgeCount} item kritis`}
                    >
                      {badgeCount}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>
    );
  }

  // ── Responsive sidebar (desktop and tablet) ───────────────────────────────
  function DesktopSidebar() {
    // Collapsed (icon-only) at ≤1024px handled via CSS .sidebar-desktop visibility
    return (
      <aside
        className="sidebar sidebar-desktop"
        aria-label="Sidebar navigasi"
        style={{ height: '100dvh', position: 'sticky', top: 0, zIndex: 30 }}
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--glass-border)' }}>
          <Leaf size={20} aria-hidden="true" style={{ color: 'var(--c-accent)', flexShrink: 0 }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text)', whiteSpace: 'nowrap' }}>ShelfLife</span>
        </div>

        <SidebarNav collapsed={false} />

        {/* Bottom savings summary */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--glass-border)' }}>
          <p style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 2 }}>Hemat bulan ini</p>
          <p className="num" style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-accent)' }}>{fmtRp(savings)}</p>
        </div>
      </aside>
    );
  }

  // ── Mobile drawer (slide-over) ────────────────────────────────────────────
  function MobileDrawer() {
    if (!sidebarOpen) return null;
    return (
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
      >
        {/* Backdrop */}
        <div
          style={{ position: 'absolute', inset: 0, background: 'rgba(18,38,29,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Drawer */}
        <div style={{ position: 'relative', width: 260, background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(18px)', borderRight: '1px solid rgba(255,255,255,0.72)', boxShadow: '4px 0 32px rgba(20,60,45,0.12)', display: 'flex', flexDirection: 'column', zIndex: 1 }}>
          <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(18,38,29,0.08)' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text)', display:'flex', alignItems:'center', gap:8 }}>
              <Leaf size={18} style={{ color: 'var(--c-accent)' }} aria-hidden="true" /> ShelfLife
            </span>
            <button className="btn-ghost" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu" style={{ padding: '5px 7px' }}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <SidebarNav collapsed={false} />
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(18,38,29,0.08)' }}>
            <p style={{ fontSize: 11, color: 'var(--c-muted)', marginBottom: 2 }}>Hemat bulan ini</p>
            <p className="num" style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-accent)' }}>{fmtRp(savings)}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Bottom tab bar (mobile) ────────────────────────────────────────────────
  function BottomTabs() {
    const tabs = NAV.slice(0, 5);
    return (
      <nav className="bottom-tabs" aria-label="Tab navigasi bawah">
        {tabs.map(({ id, label, Icon, badge }) => {
          const isActive = page === id;
          const badgeCount = badge === 'kritis' ? kritisCount : 0;
          return (
            <button
              key={id}
              onClick={() => nav(id)}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 3, padding: '8px 4px 10px', border: 'none', background: 'none', cursor: 'pointer',
                color: isActive ? 'var(--c-accent)' : 'var(--c-secondary)',
                fontSize: 10, fontWeight: isActive ? 600 : 400,
                position: 'relative',
              }}
            >
              <Icon size={18} aria-hidden="true" />
              {badgeCount > 0 && (
                <span style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(4px)', width: 8, height: 8, borderRadius: '50%', background: '#c62828' }} aria-hidden="true" />
              )}
              <span>{label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  // ── Topbar ─────────────────────────────────────────────────────────────────
  function Topbar() {
    return (
      <header
        role="banner"
        className="topbar-glass"
        style={{
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', gap: 16, flexShrink: 0,
          position: 'sticky', top: 0, zIndex: 40,
        }}
      >
        {/* Left: mobile menu button + page title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn-ghost"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu navigasi"
            style={{ display: 'none', padding: '6px 8px' }}
            id="menu-btn"
          >
            <Menu size={16} aria-hidden="true" />
          </button>
          <h1 className="t-page" style={{ fontSize: 18, color: 'var(--c-text)' }}>{PAGE_TITLES[page]}</h1>
        </div>

        {/* Right: storage warning + add button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!state.storageAvailable && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#a85a00' }}>
              <AlertTriangle size={14} aria-hidden="true" />
              <span className="sr-only-mobile">Data tidak tersimpan</span>
            </span>
          )}
          <button
            ref={addBtnRef}
            className="btn-primary"
            onClick={() => setShowModal(true)}
            aria-label="Tambah bahan makanan baru"
          >
            <Plus size={14} aria-hidden="true" />
            <span>Tambah Bahan</span>
          </button>
        </div>
      </header>
    );
  }

  // ── Page render ────────────────────────────────────────────────────────────
  function PageContent() {
    switch (page) {
      case 'dashboard':  return <DashboardPage  onNavigate={nav} />;
      case 'stok':       return <StokPage />;
      case 'pakaidulu':  return <PakaiDuluPage />;
      case 'log':        return <LogPage />;
      case 'pengaturan': return <PengaturanPage />;
      default:           return <DashboardPage  onNavigate={nav} />;
    }
  }

  return (
    <>
      {/* Polite aria-live region for add/consume/expire events (not ticks) */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="live-region" />

      <div style={{ display: 'flex', minHeight: '100dvh' }}>
        <DesktopSidebar />
        <MobileDrawer />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingBottom: '64px' }} id="main-scroll">
          <Topbar />
          <main role="main" style={{ flex: 1 }}>
            <PageContent />
          </main>
        </div>
      </div>

      <BottomTabs />

      {showModal && (
        <TambahModal onClose={() => setShowModal(false)} triggerRef={addBtnRef} />
      )}

      <style>{`
        @media (max-width: 767px) {
          #menu-btn { display: flex !important; }
          .btn-primary span { display: none; }
        }
      `}</style>
    </>
  );
}

// ── Root export (wraps Shell with StoreProvider) ──────────────────────────────
export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
