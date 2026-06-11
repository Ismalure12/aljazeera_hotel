'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchJson, parseApiError } from '@/lib/apiError';
import useConfirm from '@/hooks/useConfirm';

const EMPTY_FORM = {
  name: '', description: '', price: '', categoryId: '',
  imageUrl: '', sortOrder: 0, isActive: true,
  kcal: '', prepTime: '', pairing: '',
  tagIds: [],
};

export default function MenuItemsPage() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [groups, setGroups] = useState([]);
  const [extras, setExtras] = useState([]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchJson('/api/categories'),
  });
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => fetchJson('/api/tags'),
  });
  const { data: items = [], isLoading, error: loadError } = useQuery({
    queryKey: ['menu-items', filterCategoryId],
    queryFn: () => {
      const url = filterCategoryId
        ? `/api/menu-items?categoryId=${filterCategoryId}&onlyActive=false`
        : '/api/menu-items?onlyActive=false';
      return fetchJson(url);
    },
  });

  const saveItem = useMutation({
    mutationFn: (payload) => fetchJson(
      editingId ? `/api/menu-items/${editingId}` : '/api/menu-items',
      {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    ),
    onMutate: () => toast.loading(editingId ? 'Updating…' : 'Creating…', { id: 'mi-save' }),
    onSuccess: (saved) => {
      toast.success(editingId ? 'Item updated' : 'Item created', { id: 'mi-save' });
      qc.invalidateQueries({ queryKey: ['menu-items'] });
      if (!editingId) {
        setEditingId(saved.id);
        setGroups([]);
        setExtras([]);
      }
    },
    onError: (e) => toast.error(parseApiError(e), { id: 'mi-save' }),
  });

  const deleteItem = useMutation({
    mutationFn: (id) => fetchJson(`/api/menu-items/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Item deleted'); qc.invalidateQueries({ queryKey: ['menu-items'] }); },
    onError: (e) => toast.error(parseApiError(e)),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }) => fetchJson(`/api/menu-items/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
    onError: (e) => toast.error(parseApiError(e)),
  });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setImagePreview(null);
    setGroups([]);
    setExtras([]);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: item.price.toString(),
      categoryId: item.categoryId.toString(),
      imageUrl: item.imageUrl ?? '',
      sortOrder: item.sortOrder ?? 0,
      isActive: item.isActive,
      kcal: item.kcal ?? '',
      prepTime: item.prepTime ?? '',
      pairing: item.pairing ?? '',
      tagIds: (item.tags || []).map((t) => t.tag?.id ?? t.id),
    });
    setImagePreview(item.imageUrl ?? null);
    setGroups(
      (item.optionGroups || []).map((g) => ({
        id: g.id, title: g.title,
        options: (g.options || []).map((o) => ({ id: o.id, name: o.name, priceAdd: Number(o.priceAdd) })),
      }))
    );
    setExtras((item.extras || []).map((e) => ({ id: e.id, name: e.name, priceAdd: Number(e.priceAdd) })));
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setImagePreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append('file', file);
    try {
      const data = await fetchJson('/api/upload', { method: 'POST', body: fd });
      if (data.url) { setForm((p) => ({ ...p, imageUrl: data.url })); toast.success('Image uploaded'); }
      else throw new Error('No URL returned');
    } catch (err) { toast.error(parseApiError(err)); setImagePreview(null); }
    finally { setUploading(false); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveItem.mutate({
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      categoryId: Number(form.categoryId),
      imageUrl: form.imageUrl || null,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
      kcal: form.kcal || null,
      prepTime: form.prepTime || null,
      pairing: form.pairing || null,
      tagIds: form.tagIds,
    });
  };

  const handleDelete = async (it) => {
    const ok = await confirm({
      title: `Delete “${it.name}”?`,
      body: 'Removing this item also clears its option groups and extras.',
      confirmLabel: 'Delete item',
    });
    if (ok) deleteItem.mutate(it.id);
  };

  // Option groups
  const addGroup = async () => {
    if (!editingId) { toast.error('Save the item first'); return; }
    try {
      const g = await fetchJson('/api/option-groups', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId: editingId, title: 'New option', sortOrder: groups.length }),
      });
      setGroups((gs) => [...gs, { id: g.id, title: g.title, options: [] }]);
    } catch (err) { toast.error(parseApiError(err)); }
  };
  const renameGroup = async (id, title) => {
    setGroups((gs) => gs.map((g) => g.id === id ? { ...g, title } : g));
    try {
      await fetchJson(`/api/option-groups/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
    } catch (err) { toast.error(parseApiError(err)); }
  };
  const deleteGroup = async (id) => {
    const ok = await confirm({
      title: 'Delete option group?',
      body: 'All options inside this group will be removed.',
      confirmLabel: 'Delete group',
    });
    if (!ok) return;
    try {
      await fetchJson(`/api/option-groups/${id}`, { method: 'DELETE' });
      setGroups((gs) => gs.filter((g) => g.id !== id));
    } catch (err) { toast.error(parseApiError(err)); }
  };
  const addOption = async (groupId) => {
    try {
      const o = await fetchJson('/api/item-options', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionGroupId: groupId, name: 'New', priceAdd: 0 }),
      });
      setGroups((gs) => gs.map((g) => g.id === groupId
        ? { ...g, options: [...g.options, { id: o.id, name: o.name, priceAdd: Number(o.priceAdd) }] }
        : g));
    } catch (err) { toast.error(parseApiError(err)); }
  };
  const updateOption = async (groupId, optId, patch) => {
    setGroups((gs) => gs.map((g) => g.id === groupId
      ? { ...g, options: g.options.map((o) => o.id === optId ? { ...o, ...patch } : o) }
      : g));
    try {
      await fetchJson(`/api/item-options/${optId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } catch (err) { toast.error(parseApiError(err)); }
  };
  const deleteOption = async (groupId, optId) => {
    try {
      await fetchJson(`/api/item-options/${optId}`, { method: 'DELETE' });
      setGroups((gs) => gs.map((g) => g.id === groupId
        ? { ...g, options: g.options.filter((o) => o.id !== optId) }
        : g));
    } catch (err) { toast.error(parseApiError(err)); }
  };

  // Extras
  const addExtra = async () => {
    if (!editingId) { toast.error('Save the item first'); return; }
    try {
      const ex = await fetchJson('/api/item-extras', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId: editingId, name: 'New extra', priceAdd: 0, sortOrder: extras.length }),
      });
      setExtras((xs) => [...xs, { id: ex.id, name: ex.name, priceAdd: Number(ex.priceAdd) }]);
    } catch (err) { toast.error(parseApiError(err)); }
  };
  const updateExtra = async (id, patch) => {
    setExtras((xs) => xs.map((e) => e.id === id ? { ...e, ...patch } : e));
    try {
      await fetchJson(`/api/item-extras/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
    } catch (err) { toast.error(parseApiError(err)); }
  };
  const deleteExtra = async (id) => {
    try {
      await fetchJson(`/api/item-extras/${id}`, { method: 'DELETE' });
      setExtras((xs) => xs.filter((e) => e.id !== id));
    } catch (err) { toast.error(parseApiError(err)); }
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      {dialog}

      <header style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap', marginBottom: 18,
      }}>
        <div>
          <div className="adm-eyebrow">Menu structure</div>
          <h1 className="adm-h1" style={{ marginTop: 4 }}>Menu items</h1>
          <p className="adm-sub">Dishes, drinks, and pastries — including options and extras.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            className="adm-select"
            style={{ minWidth: 180, height: 40 }}
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="adm-btn adm-btn-primary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New item
          </button>
        </div>
      </header>

      {loadError && <div className="adm-error-banner" style={{ marginBottom: 14 }}>{parseApiError(loadError)}</div>}

      {/* MODAL */}
      {showForm && (
        <div className="adm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
          <div className="adm-modal adm-modal-lg">
            <div className="adm-modal-head">
              <h2 className="adm-modal-title">{editingId ? 'Edit menu item' : 'New menu item'}</h2>
              <button onClick={resetForm} className="adm-btn-icon" aria-label="Close" disabled={saveItem.isPending}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="adm-modal-form">
              <div className="adm-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="adm-label">Name</label>
                  <input className="adm-input" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="adm-label">Description</label>
                  <textarea className="adm-textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="adm-form-grid">
                  <div>
                    <label className="adm-label">Category</label>
                    <select className="adm-select" required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                      <option value="">Select…</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="adm-label">Base price ($)</label>
                    <input className="adm-input" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </div>
                </div>
                <div className="adm-form-grid">
                  <div>
                    <label className="adm-label">Prep time</label>
                    <input className="adm-input" type="text" placeholder="12 min" value={form.prepTime} onChange={(e) => setForm({ ...form, prepTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="adm-label">Kcal</label>
                    <input className="adm-input" type="text" placeholder="520" value={form.kcal} onChange={(e) => setForm({ ...form, kcal: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="adm-label">Pairing</label>
                  <input className="adm-input" type="text" placeholder="Champagne" value={form.pairing} onChange={(e) => setForm({ ...form, pairing: e.target.value })} />
                </div>
                <div>
                  <label className="adm-label">Image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {imagePreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imagePreview} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--line-soft)', flexShrink: 0 }} />
                    )}
                    <label style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '14px 16px', borderRadius: 12,
                      border: '1.5px dashed var(--line)',
                      background: 'var(--cream)', color: 'var(--ink-2)',
                      fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 13,
                      cursor: 'pointer',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      {uploading ? 'Uploading…' : imagePreview ? 'Change image' : 'Upload image'}
                      <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="adm-label">Tags</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {tags.length === 0 && <span style={{ fontSize: 12, color: 'var(--muted)' }}>No tags defined yet. Create some in the Tags page.</span>}
                    {tags.map((t) => {
                      const active = form.tagIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setForm((f) => ({
                            ...f,
                            tagIds: active ? f.tagIds.filter((x) => x !== t.id) : [...f.tagIds, t.id],
                          }))}
                          className={`adm-pill ${active ? 'adm-pill-blue' : 'adm-pill-muted'}`}
                          style={{ cursor: 'pointer', border: '1px solid transparent', padding: '5px 12px' }}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="adm-form-grid" style={{ alignItems: 'end' }}>
                  <div>
                    <label className="adm-label">Sort order</label>
                    <input className="adm-input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 11, fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 13, color: 'var(--ink-2)' }}>
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--blue)' }} />
                    Visible in menu
                  </label>
                </div>

                {/* Option groups + extras */}
                {editingId && (
                  <>
                    <div className="adm-divider" />
                    <section>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <h3 className="adm-h2" style={{ fontSize: 17 }}>Option groups</h3>
                        <button type="button" onClick={addGroup} className="adm-btn adm-btn-primary" style={{ height: 32, padding: '0 14px', fontSize: 12.5 }}>
                          + Group
                        </button>
                      </div>
                      {groups.length === 0 && <p className="adm-help">No options. Add a group for variants like Bread, Milk, Size.</p>}
                      {groups.map((g) => (
                        <div key={g.id} style={{
                          background: 'var(--cream)', border: '1px solid var(--line-soft)',
                          borderRadius: 12, padding: 12, marginBottom: 10,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <input
                              className="adm-input"
                              type="text"
                              value={g.title}
                              onChange={(e) => renameGroup(g.id, e.target.value)}
                              style={{ flex: 1, height: 36, padding: '0 12px', fontFamily: 'var(--font-inter), Inter, sans-serif', fontWeight: 600 }}
                            />
                            <button type="button" className="adm-link danger" onClick={() => deleteGroup(g.id)}>Delete</button>
                          </div>
                          {g.options.map((o) => (
                            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                              <input
                                className="adm-input"
                                type="text"
                                value={o.name}
                                onChange={(e) => updateOption(g.id, o.id, { name: e.target.value })}
                                style={{ flex: 1, height: 34, padding: '0 10px' }}
                              />
                              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>+ $</span>
                              <input
                                className="adm-input"
                                type="number"
                                step="0.5"
                                min="0"
                                value={o.priceAdd}
                                onChange={(e) => updateOption(g.id, o.id, { priceAdd: Number(e.target.value) })}
                                style={{ width: 80, height: 34, padding: '0 10px', fontVariantNumeric: 'tabular-nums' }}
                              />
                              <button type="button" onClick={() => deleteOption(g.id, o.id)} className="adm-btn-icon" aria-label="Remove">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          <button type="button" className="adm-link" onClick={() => addOption(g.id)}>+ Add option</button>
                        </div>
                      ))}
                    </section>

                    <section>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <h3 className="adm-h2" style={{ fontSize: 17 }}>Extras</h3>
                        <button type="button" onClick={addExtra} className="adm-btn" style={{ height: 32, padding: '0 14px', fontSize: 12.5, background: 'var(--green)', color: '#fff' }}>
                          + Extra
                        </button>
                      </div>
                      {extras.length === 0 && <p className="adm-help">No extras. Add optional checkbox add-ons like “Truffle butter”.</p>}
                      {extras.map((x) => (
                        <div key={x.id} style={{
                          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
                          background: 'var(--cream)', border: '1px solid var(--line-soft)',
                          borderRadius: 12, padding: 8,
                        }}>
                          <input
                            className="adm-input"
                            type="text"
                            value={x.name}
                            onChange={(e) => updateExtra(x.id, { name: e.target.value })}
                            style={{ flex: 1, height: 34, padding: '0 10px' }}
                          />
                          <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>+ $</span>
                          <input
                            className="adm-input"
                            type="number"
                            step="0.5"
                            min="0"
                            value={x.priceAdd}
                            onChange={(e) => updateExtra(x.id, { priceAdd: Number(e.target.value) })}
                            style={{ width: 80, height: 34, padding: '0 10px', fontVariantNumeric: 'tabular-nums' }}
                          />
                          <button type="button" onClick={() => deleteExtra(x.id)} className="adm-btn-icon" aria-label="Remove">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </section>
                  </>
                )}
              </div>

              <div className="adm-modal-foot">
                <button type="button" onClick={resetForm} disabled={saveItem.isPending} className="adm-btn adm-btn-ghost">
                  {editingId ? 'Close' : 'Cancel'}
                </button>
                <button type="submit" disabled={saveItem.isPending || uploading} className="adm-btn adm-btn-primary">
                  {saveItem.isPending ? (editingId ? 'Updating…' : 'Creating…') : (editingId ? 'Save changes' : 'Create item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIST */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4].map((n) => (
            <div key={n} className="adm-card adm-card-pad">
              <div className="adm-skeleton" style={{ height: 16, width: '50%', marginBottom: 8 }} />
              <div className="adm-skeleton" style={{ height: 12, width: '30%' }} />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="adm-card adm-card-pad-lg">
          <div className="adm-empty">
            <div className="adm-empty-ring">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
              </svg>
            </div>
            <p className="adm-empty-title">No items yet</p>
            <p className="adm-empty-sub">Add your first dish to start building the menu.</p>
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
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {it.imageUrl ? (
                          <Image src={it.imageUrl} alt="" width={40} height={40} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--cream-2)', flexShrink: 0 }} />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{it.name}</div>
                          {it.description && (
                            <div style={{ fontSize: 11.5, color: 'var(--muted)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {it.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{it.category?.name}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink)' }}>${Number(it.price).toFixed(2)}</td>
                    <td>
                      <button
                        onClick={() => toggleActive.mutate({ id: it.id, isActive: !it.isActive })}
                        className={`adm-pill ${it.isActive ? 'adm-pill-success' : 'adm-pill-muted'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        <span className="adm-pill-dot" />
                        {it.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="adm-link" style={{ marginRight: 16 }} onClick={() => handleEdit(it)}>Edit</button>
                      <button className="adm-link danger" onClick={() => handleDelete(it)} disabled={deleteItem.isPending}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden adm-stack">
            {items.map((it) => (
              <div key={it.id} className="adm-card adm-card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  {it.imageUrl ? (
                    <Image src={it.imageUrl} alt="" width={44} height={44} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--cream-2)', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 17, fontWeight: 600, color: 'var(--ink)' }}>{it.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                      {it.category?.name} · ${Number(it.price).toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive.mutate({ id: it.id, isActive: !it.isActive })}
                    className={`adm-pill ${it.isActive ? 'adm-pill-success' : 'adm-pill-muted'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {it.isActive ? 'Active' : 'Hidden'}
                  </button>
                </div>
                <div className="adm-divider" />
                <div style={{ display: 'flex', gap: 16 }}>
                  <button className="adm-link" onClick={() => handleEdit(it)}>Edit</button>
                  <button className="adm-link danger" onClick={() => handleDelete(it)} disabled={deleteItem.isPending}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
