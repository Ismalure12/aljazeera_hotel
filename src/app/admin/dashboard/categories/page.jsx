'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchJson, parseApiError } from '@/lib/apiError';
import useConfirm from '@/hooks/useConfirm';

const EMPTY_FORM = {
  name: '', sortOrder: 0, isActive: true,
  kicker: '', headline: '', sub: '', coverUrl: '', period: 'any',
};

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: categories = [], isLoading, error: loadError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchJson('/api/categories'),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => fetchJson(
      editingId ? `/api/categories/${editingId}` : '/api/categories',
      {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    ),
    onMutate: () => { toast.loading(editingId ? 'Updating category…' : 'Creating category…', { id: 'cat-save' }); },
    onSuccess: () => {
      toast.success(editingId ? 'Category updated' : 'Category created', { id: 'cat-save' });
      qc.invalidateQueries({ queryKey: ['categories'] });
      resetForm();
    },
    onError: (err) => toast.error(parseApiError(err), { id: 'cat-save' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fetchJson(`/api/categories/${id}`, { method: 'DELETE' }),
    onMutate: () => { toast.loading('Deleting…', { id: 'cat-del' }); },
    onSuccess: () => {
      toast.success('Category deleted', { id: 'cat-del' });
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err) => toast.error(parseApiError(err), { id: 'cat-del' }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => fetchJson(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
    onError: (err) => toast.error(parseApiError(err)),
  });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setImagePreview(null);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setImagePreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('file', file);
    try {
      const data = await fetchJson('/api/upload', { method: 'POST', body: formData });
      if (data.url) {
        setForm((prev) => ({ ...prev, coverUrl: data.url }));
        toast.success('Image uploaded');
      } else {
        throw new Error('No URL returned');
      }
    } catch (err) {
      toast.error(parseApiError(err) || 'Image upload failed');
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({
      name: form.name,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
      kicker: form.kicker || null,
      headline: form.headline || null,
      sub: form.sub || null,
      coverUrl: form.coverUrl || null,
      period: form.period || 'any',
    });
  };

  const handleEdit = (cat) => {
    setForm({
      name: cat.name,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
      kicker: cat.kicker || '',
      headline: cat.headline || '',
      sub: cat.sub || '',
      coverUrl: cat.coverUrl || '',
      period: cat.period || 'any',
    });
    setImagePreview(cat.coverUrl || null);
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleDelete = async (cat) => {
    const ok = await confirm({
      title: `Delete “${cat.name}”?`,
      body: 'All menu items inside this category will also be removed. This cannot be undone.',
      confirmLabel: 'Delete category',
    });
    if (ok) deleteMutation.mutate(cat.id);
  };

  const handleToggleActive = (cat) => {
    toggleMutation.mutate({ id: cat.id, isActive: !cat.isActive });
  };

  const isSaving = saveMutation.isPending;

  return (
    <div style={{ maxWidth: 1100 }}>
      {dialog}

      <header style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap', marginBottom: 18,
      }}>
        <div>
          <div className="adm-eyebrow">Menu structure</div>
          <h1 className="adm-h1" style={{ marginTop: 4 }}>Categories</h1>
          <p className="adm-sub">Top-level sections like Breakfast, Lunch, and Dinner.</p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="adm-btn adm-btn-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New category
        </button>
      </header>

      {loadError && <div className="adm-error-banner" style={{ marginBottom: 14 }}>{parseApiError(loadError)}</div>}

      {/* Modal */}
      {showForm && (
        <div className="adm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
          <div className="adm-modal">
            <div className="adm-modal-head">
              <h2 className="adm-modal-title">{editingId ? 'Edit category' : 'New category'}</h2>
              <button
                type="button"
                onClick={resetForm}
                className="adm-btn-icon"
                aria-label="Close"
                disabled={isSaving}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="adm-modal-form">
              <div className="adm-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="adm-label">Name</label>
                  <input
                    className="adm-input"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="adm-form-grid">
                  <div>
                    <label className="adm-label">Kicker</label>
                    <input
                      className="adm-input"
                      type="text"
                      value={form.kicker}
                      onChange={(e) => setForm({ ...form, kicker: e.target.value })}
                      placeholder="e.g. Until 11 AM"
                    />
                  </div>
                  <div>
                    <label className="adm-label">Period</label>
                    <select
                      className="adm-select"
                      value={form.period}
                      onChange={(e) => setForm({ ...form, period: e.target.value })}
                    >
                      <option value="any">Any time</option>
                      <option value="morning">Morning (5–11)</option>
                      <option value="midday">Midday (11–15)</option>
                      <option value="afternoon">Afternoon (15–18)</option>
                      <option value="evening">Evening (18+)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="adm-label">Headline</label>
                  <input
                    className="adm-input"
                    type="text"
                    value={form.headline}
                    onChange={(e) => setForm({ ...form, headline: e.target.value })}
                    placeholder="Morning, <em>slowly.</em>"
                  />
                  <p className="adm-help">Use <code>&lt;em&gt;</code> for italic accents.</p>
                </div>
                <div>
                  <label className="adm-label">Subline</label>
                  <input
                    className="adm-input"
                    type="text"
                    value={form.sub}
                    onChange={(e) => setForm({ ...form, sub: e.target.value })}
                    placeholder="Eggs, grains & garden fruit"
                  />
                </div>
                <div>
                  <label className="adm-label">Cover image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {imagePreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imagePreview}
                        alt=""
                        style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--line-soft)', flexShrink: 0 }}
                      />
                    )}
                    <label
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '12px 14px', borderRadius: 12,
                        border: '1.5px dashed var(--line)',
                        background: 'var(--cream)', color: 'var(--ink-2)',
                        fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      {uploading ? 'Uploading…' : imagePreview ? 'Change cover' : 'Upload cover'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
                <div className="adm-form-grid" style={{ alignItems: 'end' }}>
                  <div>
                    <label className="adm-label">Sort order</label>
                    <input
                      className="adm-input"
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 11, fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 13, color: 'var(--ink-2)' }}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: 'var(--blue)' }}
                    />
                    Visible in menu
                  </label>
                </div>
              </div>
              <div className="adm-modal-foot">
                <button type="button" onClick={resetForm} disabled={isSaving} className="adm-btn adm-btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || uploading} className="adm-btn adm-btn-primary">
                  {isSaving ? (editingId ? 'Updating…' : 'Creating…') : (editingId ? 'Save changes' : 'Create category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map((n) => (
            <div key={n} className="adm-card adm-card-pad">
              <div className="adm-skeleton" style={{ height: 16, width: '40%', marginBottom: 8 }} />
              <div className="adm-skeleton" style={{ height: 12, width: '25%' }} />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="adm-card adm-card-pad-lg">
          <div className="adm-empty">
            <div className="adm-empty-ring">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </div>
            <p className="adm-empty-title">No categories yet</p>
            <p className="adm-empty-sub">Create your first category to start organizing the menu.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="adm-card hidden md:block" style={{ overflow: 'hidden' }}>
            <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Period</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {cat.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cat.coverUrl} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{
                            width: 36, height: 36, borderRadius: 8, background: 'var(--cream-2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-cormorant), serif', color: 'var(--muted)',
                            flexShrink: 0,
                          }}>·</div>
                        )}
                        <div style={{
                          fontFamily: 'var(--font-cormorant), serif', fontSize: 16, fontWeight: 600,
                          color: 'var(--ink)',
                        }}>{cat.name}</div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{cat.slug}</td>
                    <td style={{ textTransform: 'capitalize', color: 'var(--ink-2)' }}>{cat.period}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{cat.sortOrder}</td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(cat)}
                        disabled={toggleMutation.isPending}
                        className={`adm-pill ${cat.isActive ? 'adm-pill-success' : 'adm-pill-muted'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        <span className="adm-pill-dot" />
                        {cat.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="adm-link" style={{ marginRight: 16 }} onClick={() => handleEdit(cat)}>Edit</button>
                      <button className="adm-link danger" onClick={() => handleDelete(cat)} disabled={deleteMutation.isPending}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden adm-stack">
            {categories.map((cat) => (
              <div key={cat.id} className="adm-card adm-card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  {cat.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cat.coverUrl} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, background: 'var(--cream-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-cormorant), serif', color: 'var(--muted)',
                      flexShrink: 0,
                    }}>·</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>
                      {cat.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                      {cat.slug} · {cat.period}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(cat)}
                    disabled={toggleMutation.isPending}
                    className={`adm-pill ${cat.isActive ? 'adm-pill-success' : 'adm-pill-muted'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {cat.isActive ? 'Active' : 'Hidden'}
                  </button>
                </div>
                <div className="adm-divider" />
                <div style={{ display: 'flex', gap: 16 }}>
                  <button className="adm-link" onClick={() => handleEdit(cat)}>Edit</button>
                  <button className="adm-link danger" onClick={() => handleDelete(cat)} disabled={deleteMutation.isPending}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
