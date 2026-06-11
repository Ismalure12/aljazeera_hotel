'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchJson, parseApiError } from '@/lib/apiError';
import useConfirm from '@/hooks/useConfirm';

export default function UsersPage() {
  const qc = useQueryClient();
  const { confirm, dialog } = useConfirm();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', role: 'user' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d.userId) setCurrentUserId(d.userId); })
      .catch(() => {});
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (res.status === 403) return { denied: true, users: [] };
      if (!res.ok) throw new Error('Failed to load users');
      const users = await res.json();
      return { denied: false, users: Array.isArray(users) ? users : [] };
    },
  });

  const accessDenied = data?.denied ?? false;
  const users = data?.users ?? [];

  const saveMutation = useMutation({
    mutationFn: (payload) => fetchJson(
      editingId ? `/api/users/${editingId}` : '/api/users',
      {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    ),
    onMutate: () => toast.loading(editingId ? 'Updating user…' : 'Creating user…', { id: 'user-save' }),
    onSuccess: () => {
      toast.success(editingId ? 'User updated' : 'User created', { id: 'user-save' });
      qc.invalidateQueries({ queryKey: ['users'] });
      resetForm();
    },
    onError: (err) => {
      toast.dismiss('user-save');
      setFormError(parseApiError(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fetchJson(`/api/users/${id}`, { method: 'DELETE' }),
    onMutate: () => toast.loading('Deleting…', { id: 'user-del' }),
    onSuccess: () => {
      toast.success('User deleted', { id: 'user-del' });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(parseApiError(err), { id: 'user-del' }),
  });

  const resetForm = () => {
    setForm({ email: '', password: '', role: 'user' });
    setEditingId(null);
    setShowForm(false);
    setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (editingId) {
      saveMutation.mutate({ email: form.email, role: form.role });
    } else {
      if (!form.password || form.password.length < 6) {
        setFormError('Password must be at least 6 characters');
        return;
      }
      saveMutation.mutate(form);
    }
  };

  const handleEdit = (user) => {
    setForm({ email: user.email, password: '', role: user.role });
    setEditingId(user.id);
    setShowForm(true);
    setFormError('');
  };

  const handleDelete = async (user) => {
    const ok = await confirm({
      title: `Remove ${user.email}?`,
      body: 'This account will no longer be able to sign in to the dashboard.',
      confirmLabel: 'Remove user',
    });
    if (ok) deleteMutation.mutate(user.id);
  };

  const isSaving = saveMutation.isPending;

  if (!isLoading && accessDenied) {
    return (
      <div style={{ maxWidth: 720 }}>
        <div className="adm-card adm-card-pad-lg">
          <div className="adm-empty">
            <div className="adm-empty-ring">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p className="adm-empty-title">Admins only</p>
            <p className="adm-empty-sub">You don’t have permission to manage users.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900 }}>
      {dialog}

      <header style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12, flexWrap: 'wrap', marginBottom: 18,
      }}>
        <div>
          <div className="adm-eyebrow">Access</div>
          <h1 className="adm-h1" style={{ marginTop: 4 }}>Users</h1>
          <p className="adm-sub">Who can sign in to the dashboard.</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="adm-btn adm-btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New user
        </button>
      </header>

      {showForm && (
        <div className="adm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) resetForm(); }}>
          <div className="adm-modal">
            <div className="adm-modal-head">
              <h2 className="adm-modal-title">{editingId ? 'Edit user' : 'New user'}</h2>
              <button onClick={resetForm} className="adm-btn-icon" aria-label="Close" disabled={isSaving}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="adm-modal-form">
              <div className="adm-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="adm-label">Email</label>
                  <input
                    className="adm-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                {!editingId && (
                  <div>
                    <label className="adm-label">Password</label>
                    <input
                      className="adm-input"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                    />
                  </div>
                )}
                <div>
                  <label className="adm-label">Role</label>
                  <select
                    className="adm-select"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="user">User — can edit menu content</option>
                    <option value="admin">Admin — can also manage users</option>
                  </select>
                </div>
                {formError && <div className="adm-error-banner">{formError}</div>}
              </div>
              <div className="adm-modal-foot">
                <button type="button" onClick={resetForm} disabled={isSaving} className="adm-btn adm-btn-ghost">Cancel</button>
                <button type="submit" disabled={isSaving} className="adm-btn adm-btn-primary">
                  {isSaving ? (editingId ? 'Updating…' : 'Creating…') : (editingId ? 'Save changes' : 'Create user')}
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
              <div className="adm-skeleton" style={{ height: 12, width: '25%' }} />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="adm-card adm-card-pad-lg">
          <div className="adm-empty">
            <div className="adm-empty-ring">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <p className="adm-empty-title">No users yet</p>
            <p className="adm-empty-sub">Add a teammate to get started.</p>
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
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--blue-soft)', color: 'var(--blue)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, fontSize: 14,
                          flexShrink: 0,
                        }}>
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ color: 'var(--ink)' }}>{user.email}</span>
                        {user.id === currentUserId && (
                          <span className="adm-pill adm-pill-muted" style={{ fontSize: 9.5 }}>You</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`adm-pill ${user.role === 'admin' ? 'adm-pill-blue' : 'adm-pill-success'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="adm-link" style={{ marginRight: 16 }} onClick={() => handleEdit(user)}>Edit</button>
                      {user.id !== currentUserId && (
                        <button className="adm-link danger" onClick={() => handleDelete(user)} disabled={deleteMutation.isPending}>Remove</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden adm-stack">
            {users.map((user) => (
              <div key={user.id} className="adm-card adm-card-pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'var(--blue-soft)', color: 'var(--blue)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-cormorant), serif', fontWeight: 700, fontSize: 16,
                    flexShrink: 0,
                  }}>
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                      {user.id === currentUserId && <span className="adm-pill adm-pill-muted" style={{ marginLeft: 6, fontSize: 9.5 }}>You</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                      Created {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`adm-pill ${user.role === 'admin' ? 'adm-pill-blue' : 'adm-pill-success'}`}>
                    {user.role}
                  </span>
                </div>
                <div className="adm-divider" />
                <div style={{ display: 'flex', gap: 16 }}>
                  <button className="adm-link" onClick={() => handleEdit(user)}>Edit</button>
                  {user.id !== currentUserId && (
                    <button className="adm-link danger" onClick={() => handleDelete(user)} disabled={deleteMutation.isPending}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
