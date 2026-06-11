'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchJson, parseApiError } from '@/lib/apiError';
import useConfirm from '@/hooks/useConfirm';

const VARIANTS = [
  { value: 'default', label: 'Blue', sample: { color: 'var(--blue)', bg: 'var(--blue-soft)' } },
  { value: 'green',   label: 'Green', sample: { color: 'var(--green-deep)', bg: 'var(--green-soft)' } },
  { value: 'spicy',   label: 'Spicy', sample: { color: 'var(--spicy)', bg: '#fbe9e2' } },
];

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function TagChip({ label, variant }) {
  const v = VARIANTS.find((x) => x.value === variant) || VARIANTS[0];
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'var(--font-inter), Inter, sans-serif',
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '.14em',
      padding: '4px 8px',
      borderRadius: 6,
      color: v.sample.color,
      background: v.sample.bg,
    }}>
      {label}
    </span>
  );
}

export default function TagsPage() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [form, setForm] = useState({ slug: '', label: '', variant: 'default' });
  const [editing, setEditing] = useState(null);

  const { data: tags = [], isLoading, error: loadError } = useQuery({
    queryKey: ['tags'],
    queryFn: () => fetchJson('/api/tags'),
  });

  const save = useMutation({
    mutationFn: async (payload) => {
      const url = editing ? `/api/tags/${editing}` : '/api/tags';
      return fetchJson(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success(editing ? 'Tag updated' : 'Tag added');
      qc.invalidateQueries({ queryKey: ['tags'] });
      reset();
    },
    onError: (e) => toast.error(parseApiError(e)),
  });

  const del = useMutation({
    mutationFn: (id) => fetchJson(`/api/tags/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Tag deleted');
      qc.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (e) => toast.error(parseApiError(e)),
  });

  const reset = () => { setForm({ slug: '', label: '', variant: 'default' }); setEditing(null); };

  const submit = (e) => {
    e.preventDefault();
    if (!form.label.trim()) return;
    save.mutate({
      slug: form.slug || slugify(form.label),
      label: form.label,
      variant: form.variant,
    });
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Delete tag?',
      body: 'This tag will be removed from every item that currently uses it.',
      confirmLabel: 'Delete tag',
    });
    if (ok) del.mutate(id);
  };

  return (
    <div style={{ maxWidth: 980 }}>
      {dialog}

      <header style={{ marginBottom: 18 }}>
        <div className="adm-eyebrow">Curation</div>
        <h1 className="adm-h1" style={{ marginTop: 4 }}>Tags</h1>
        <p className="adm-sub">Short labels that appear on menu cards (e.g. <em>Signature</em>, <em>Spicy</em>).</p>
      </header>

      {/* Inline editor */}
      <div className="adm-card adm-card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
          <h2 className="adm-h2" style={{ fontSize: 17 }}>{editing ? 'Edit tag' : 'Add tag'}</h2>
          {form.label && <TagChip label={form.label} variant={form.variant} />}
        </div>

        <form onSubmit={submit} style={{
          display: 'grid', gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          alignItems: 'end',
        }}>
          <div>
            <label className="adm-label">Label</label>
            <input
              className="adm-input"
              value={form.label}
              required
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Signature"
            />
          </div>
          <div>
            <label className="adm-label">Slug</label>
            <input
              className="adm-input"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder={form.label ? slugify(form.label) : 'auto'}
            />
          </div>
          <div>
            <label className="adm-label">Variant</label>
            <select
              className="adm-select"
              value={form.variant}
              onChange={(e) => setForm({ ...form, variant: e.target.value })}
            >
              {VARIANTS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={save.isPending} className="adm-btn adm-btn-primary" style={{ flex: 1 }}>
              {save.isPending ? 'Saving…' : (editing ? 'Save' : 'Add')}
            </button>
            {editing && (
              <button type="button" onClick={reset} className="adm-btn adm-btn-ghost">Cancel</button>
            )}
          </div>
        </form>
      </div>

      {loadError && <div className="adm-error-banner" style={{ marginBottom: 14 }}>{parseApiError(loadError)}</div>}

      {isLoading ? (
        <div className="adm-card adm-card-pad">
          {[1,2,3].map((n) => (
            <div key={n} className="adm-skeleton" style={{ height: 16, marginBottom: 10 }} />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="adm-card adm-card-pad-lg">
          <div className="adm-empty">
            <div className="adm-empty-ring">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <p className="adm-empty-title">No tags yet</p>
            <p className="adm-empty-sub">Add your first tag above.</p>
          </div>
        </div>
      ) : (
        <div className="adm-card" style={{ overflow: 'hidden' }}>
          <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Slug</th>
                <th>Variant</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((t) => (
                <tr key={t.id}>
                  <td><TagChip label={t.label} variant={t.variant} /></td>
                  <td style={{ color: 'var(--muted)' }}>{t.slug}</td>
                  <td style={{ color: 'var(--muted)', textTransform: 'capitalize' }}>{t.variant}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="adm-link"
                      style={{ marginRight: 16 }}
                      onClick={() => { setEditing(t.id); setForm({ slug: t.slug, label: t.label, variant: t.variant }); }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="adm-link danger"
                      onClick={() => handleDelete(t.id)}
                      disabled={del.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
