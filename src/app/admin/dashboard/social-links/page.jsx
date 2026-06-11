'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchJson, parseApiError } from '@/lib/apiError';
import useConfirm from '@/hooks/useConfirm';

const PLATFORMS = [
  { value: 'phone', label: 'Phone', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )},
  { value: 'whatsapp', label: 'WhatsApp', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  )},
  { value: 'instagram', label: 'Instagram', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )},
  { value: 'facebook', label: 'Facebook', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )},
  { value: 'twitter', label: 'X / Twitter', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )},
  { value: 'tiktok', label: 'TikTok', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.88a8.28 8.28 0 0 0 4.76 1.5V6.93a4.84 4.84 0 0 1-1-.24z" />
    </svg>
  )},
  { value: 'website', label: 'Website', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )},
];

function getPlatformInfo(platform) {
  return PLATFORMS.find((p) => p.value === platform) || { value: platform, label: platform, icon: null };
}

function getPlaceholder(platform) {
  switch (platform) {
    case 'phone':
    case 'whatsapp': return '+252 907795874';
    case 'instagram': return 'https://instagram.com/hoteljazeera';
    case 'facebook': return 'https://www.facebook.com/hoteljazeera';
    case 'twitter': return 'https://x.com/hoteljazeera';
    case 'tiktok': return 'https://tiktok.com/@hoteljazeera';
    case 'website': return 'https://hoteljazeera.so';
    default: return 'Enter value';
  }
}

export default function SocialLinksPage() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ platform: '', value: '' });

  const { data: links = [], isLoading, error: loadError } = useQuery({
    queryKey: ['social-links'],
    queryFn: () => fetchJson('/api/social-links'),
  });

  const usedPlatforms = links.map((l) => l.platform);
  const availablePlatforms = PLATFORMS.filter((p) => !usedPlatforms.includes(p.value));

  const saveMutation = useMutation({
    mutationFn: (payload) => fetchJson(
      editingId ? `/api/social-links/${editingId}` : '/api/social-links',
      {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { value: payload.value } : payload),
      }
    ),
    onMutate: () => toast.loading(editingId ? 'Updating link…' : 'Adding link…', { id: 'sl-save' }),
    onSuccess: () => {
      toast.success(editingId ? 'Link updated' : 'Link added', { id: 'sl-save' });
      qc.invalidateQueries({ queryKey: ['social-links'] });
      resetForm();
    },
    onError: (err) => toast.error(parseApiError(err), { id: 'sl-save' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fetchJson(`/api/social-links/${id}`, { method: 'DELETE' }),
    onMutate: () => toast.loading('Deleting…', { id: 'sl-del' }),
    onSuccess: () => {
      toast.success('Link deleted', { id: 'sl-del' });
      qc.invalidateQueries({ queryKey: ['social-links'] });
    },
    onError: (err) => toast.error(parseApiError(err), { id: 'sl-del' }),
  });

  const resetForm = () => {
    setForm({ platform: '', value: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({ platform: form.platform, value: form.value });
  };

  const handleEdit = (link) => {
    setForm({ platform: link.platform, value: link.value });
    setEditingId(link.id);
    setShowForm(true);
  };

  const handleDelete = async (link) => {
    const info = getPlatformInfo(link.platform);
    const ok = await confirm({
      title: `Remove ${info.label}?`,
      body: 'This will hide the link from the footer of the public menu.',
      confirmLabel: 'Remove',
    });
    if (ok) deleteMutation.mutate(link.id);
  };

  const isSaving = saveMutation.isPending;

  return (
    <div style={{ maxWidth: 900 }}>
      {dialog}

      <header style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap', marginBottom: 18,
      }}>
        <div>
          <div className="adm-eyebrow">Storefront</div>
          <h1 className="adm-h1" style={{ marginTop: 4 }}>Social links</h1>
          <p className="adm-sub">Where guests can find you outside the menu.</p>
        </div>
        {availablePlatforms.length > 0 && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="adm-btn adm-btn-primary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add link
          </button>
        )}
      </header>

      {loadError && <div className="adm-error-banner" style={{ marginBottom: 14 }}>{parseApiError(loadError)}</div>}

      {showForm && (
        <div className="adm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
          <div className="adm-modal">
            <div className="adm-modal-head">
              <h2 className="adm-modal-title">{editingId ? 'Edit link' : 'Add link'}</h2>
              <button onClick={resetForm} className="adm-btn-icon" aria-label="Close" disabled={isSaving}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="adm-modal-form">
              <div className="adm-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {!editingId ? (
                  <div>
                    <label className="adm-label">Platform</label>
                    <select
                      className="adm-select"
                      value={form.platform}
                      onChange={(e) => setForm({ ...form, platform: e.target.value })}
                      required
                    >
                      <option value="">Select a platform…</option>
                      {availablePlatforms.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="adm-label">Platform</label>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 14px',
                      background: 'var(--cream)',
                      border: '1px solid var(--line-soft)',
                      borderRadius: 12,
                      fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 14,
                      color: 'var(--ink-2)',
                    }}>
                      <span style={{ color: 'var(--muted)' }}>{getPlatformInfo(form.platform).icon}</span>
                      {getPlatformInfo(form.platform).label}
                    </div>
                  </div>
                )}

                <div>
                  <label className="adm-label">
                    {form.platform === 'phone' || form.platform === 'whatsapp' ? 'Phone number' : 'URL'}
                  </label>
                  <input
                    className="adm-input"
                    type="text"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    required
                    placeholder={getPlaceholder(form.platform)}
                  />
                </div>
              </div>
              <div className="adm-modal-foot">
                <button type="button" onClick={resetForm} disabled={isSaving} className="adm-btn adm-btn-ghost">Cancel</button>
                <button type="submit" disabled={isSaving} className="adm-btn adm-btn-primary">
                  {isSaving ? (editingId ? 'Updating…' : 'Adding…') : (editingId ? 'Save changes' : 'Add link')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3].map((n) => (
            <div key={n} className="adm-card adm-card-pad">
              <div className="adm-skeleton" style={{ height: 16, width: '40%', marginBottom: 8 }} />
              <div className="adm-skeleton" style={{ height: 12, width: '70%' }} />
            </div>
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="adm-card adm-card-pad-lg">
          <div className="adm-empty">
            <div className="adm-empty-ring">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <p className="adm-empty-title">No social links yet</p>
            <p className="adm-empty-sub">Add one of {PLATFORMS.length} platforms.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="adm-card hidden md:block" style={{ overflow: 'hidden' }}>
            <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Value</th>
                  <th>Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => {
                  const info = getPlatformInfo(link.platform);
                  return (
                    <tr key={link.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ color: 'var(--blue)' }}>{info.icon}</span>
                          <span style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
                            {info.label}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--ink-2)', wordBreak: 'break-all', maxWidth: 320 }}>{link.value}</td>
                      <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap', fontSize: 11.5 }}>
                        {new Date(link.updatedAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="adm-link" style={{ marginRight: 16 }} onClick={() => handleEdit(link)}>Edit</button>
                        <button className="adm-link danger" onClick={() => handleDelete(link)} disabled={deleteMutation.isPending}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden adm-stack">
            {links.map((link) => {
              const info = getPlatformInfo(link.platform);
              return (
                <div key={link.id} className="adm-card adm-card-pad">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: 'var(--blue-soft)',
                      color: 'var(--blue)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {info.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>
                        {info.label}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                        Updated {new Date(link.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <p style={{
                    fontSize: 13, color: 'var(--ink-2)', wordBreak: 'break-all', margin: '0 0 10px',
                  }}>{link.value}</p>
                  <div className="adm-divider" />
                  <div style={{ display: 'flex', gap: 16 }}>
                    <button className="adm-link" onClick={() => handleEdit(link)}>Edit</button>
                    <button className="adm-link danger" onClick={() => handleDelete(link)} disabled={deleteMutation.isPending}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
