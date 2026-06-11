'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchJson } from '@/lib/apiError';

function greetingByHour() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'Good morning';
  if (h >= 11 && h < 16) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ label, value, accent = 'blue', sub, loading, href, icon }) {
  const accentColor = accent === 'green' ? 'var(--green)' : 'var(--blue)';
  const accentSoft  = accent === 'green' ? 'var(--green-soft)' : 'var(--blue-soft)';
  const inner = (
    <div className="adm-card adm-card-pad" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: accentSoft, color: accentColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="adm-eyebrow" style={{ fontSize: 9.5 }}>{label}</div>
        {loading ? (
          <div className="adm-skeleton" style={{ height: 30, width: 80, marginTop: 6 }} />
        ) : (
          <div style={{
            fontFamily: 'var(--font-cormorant), serif',
            fontSize: 30, lineHeight: 1.05, fontWeight: 600,
            color: 'var(--ink)', marginTop: 4,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {value}
          </div>
        )}
        {sub && (
          <div style={{
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            fontSize: 11.5, color: 'var(--muted)', marginTop: 4,
          }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} style={{ display: 'block' }}>
      {inner}
    </Link>
  ) : inner;
}

export default function DashboardPage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, mis] = await Promise.all([
          fetchJson('/api/categories'),
          fetchJson('/api/menu-items'),
        ]);
        if (cancelled) return;
        setCategories(Array.isArray(cats) ? cats : []);
        setItems(Array.isArray(mis) ? mis : []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const activeItems = items.filter((i) => i.isActive).length;
  const activeCategories = categories.filter((c) => c.isActive).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1100 }}>
      <header>
        <div className="adm-eyebrow">Dashboard</div>
        <h1 className="adm-h1" style={{ marginTop: 4 }}>
          {greetingByHour()}<em>.</em>
        </h1>
        <p className="adm-sub">Manage the menu guests browse from their table.</p>
      </header>

      {error && <div className="adm-error-banner">{error}</div>}

      <section style={{
        display: 'grid', gap: 14,
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      }}>
        <StatCard
          label="Menu items"
          value={loading ? '—' : items.length}
          sub={loading ? '' : `${activeItems} active`}
          accent="blue"
          loading={loading}
          href="/admin/dashboard/menu-items"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            </svg>
          }
        />
        <StatCard
          label="Categories"
          value={loading ? '—' : categories.length}
          sub={loading ? '' : `${activeCategories} active`}
          accent="green"
          loading={loading}
          href="/admin/dashboard/categories"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          }
        />
      </section>

      <section className="adm-card adm-card-pad-lg">
        <div style={{ marginBottom: 14 }}>
          <div className="adm-eyebrow">Quick links</div>
          <h2 className="adm-h2" style={{ marginTop: 4 }}>Manage the menu</h2>
        </div>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { label: 'Menu items', href: '/admin/dashboard/menu-items' },
            { label: 'Categories', href: '/admin/dashboard/categories' },
            { label: 'Tags', href: '/admin/dashboard/tags' },
            { label: 'Banners', href: '/admin/dashboard/banners' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', border: '1px solid var(--line-soft)',
                borderRadius: 14, background: '#fff',
                fontFamily: 'var(--font-cormorant), serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)',
              }}
            >
              {l.label}
              <span className="adm-link">Open →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
