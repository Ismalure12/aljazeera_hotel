'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchJson, parseApiError } from '@/lib/apiError';

const SERVICES = [
  { value: 'morning',   label: 'Morning',   sub: 'Breakfast' },
  { value: 'midday',    label: 'Midday',    sub: 'Lunch' },
  { value: 'afternoon', label: 'Afternoon', sub: 'Tea / coffee' },
  { value: 'evening',   label: 'Evening',   sub: 'Dinner' },
];

const EMPTY = {
  tagLabel: '', headline: '', body: '',
  imageUrl: '', ctaText: '', ctaCategorySlug: '',
  meta1Label: '', meta1Value: '',
  meta2Label: '', meta2Value: '',
  meta3Label: '', meta3Value: '',
  isActive: true,
};

export default function BannersPage() {
  const qc = useQueryClient();
  const [service, setService] = useState('morning');
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);

  const { data: banners = [], error: bannerError } = useQuery({
    queryKey: ['banners'],
    queryFn: () => fetchJson('/api/banners'),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchJson('/api/categories'),
  });

  const applyBanner = useCallback((svc, list) => {
    const found = list.find((b) => b.service === svc);
    setForm(found ? {
      tagLabel: found.tagLabel ?? '',
      headline: found.headline ?? '',
      body: found.body ?? '',
      imageUrl: found.imageUrl ?? '',
      ctaText: found.ctaText ?? '',
      ctaCategorySlug: found.ctaCategorySlug ?? '',
      meta1Label: found.meta1Label ?? '', meta1Value: found.meta1Value ?? '',
      meta2Label: found.meta2Label ?? '', meta2Value: found.meta2Value ?? '',
      meta3Label: found.meta3Label ?? '', meta3Value: found.meta3Value ?? '',
      isActive: found.isActive ?? true,
    } : EMPTY);
  }, []);

  // Reset form when fresh banner data arrives from the server.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { applyBanner(service, banners); }, [banners]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMutation({
    mutationFn: () => fetchJson('/api/banners', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service,
        tagLabel: form.tagLabel,
        headline: form.headline,
        body: form.body,
        imageUrl: form.imageUrl || null,
        ctaText: form.ctaText,
        ctaCategorySlug: form.ctaCategorySlug || null,
        meta1Label: form.meta1Label || null, meta1Value: form.meta1Value || null,
        meta2Label: form.meta2Label || null, meta2Value: form.meta2Value || null,
        meta3Label: form.meta3Label || null, meta3Value: form.meta3Value || null,
        isActive: form.isActive,
      }),
    }),
    onSuccess: () => { toast.success('Banner saved'); qc.invalidateQueries({ queryKey: ['banners'] }); },
    onError: (e) => toast.error(parseApiError(e)),
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const data = await fetchJson('/api/upload', { method: 'POST', body: fd });
      if (data.url) { setForm((p) => ({ ...p, imageUrl: data.url })); toast.success('Image uploaded'); }
    } catch (err) { toast.error(parseApiError(err)); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <header style={{ marginBottom: 18 }}>
        <div className="adm-eyebrow">Storefront</div>
        <h1 className="adm-h1" style={{ marginTop: 4 }}>Home banners</h1>
        <p className="adm-sub">The hero block that appears at the top of the menu — one per service.</p>
      </header>

      {bannerError && <div className="adm-error-banner" style={{ marginBottom: 14 }}>{parseApiError(bannerError)}</div>}

      <div className="adm-toggle" style={{ marginBottom: 18 }}>
        {SERVICES.map((s) => (
          <button
            key={s.value}
            type="button"
            className={service === s.value ? 'active' : ''}
            onClick={() => { setService(s.value); applyBanner(s.value, banners); }}
          >
            {s.label}
            <span style={{ opacity: 0.55 }}>· {s.sub}</span>
          </button>
        ))}
      </div>

      <div className="adm-card adm-card-pad-lg" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="adm-form-grid">
          <Field label="Tag label" value={form.tagLabel} placeholder="This morning" onChange={(v) => setForm({ ...form, tagLabel: v })} />
          <Field label="CTA text" value={form.ctaText} placeholder="Explore breakfast" onChange={(v) => setForm({ ...form, ctaText: v })} />
        </div>

        <Field
          label="Headline"
          value={form.headline}
          placeholder="A quiet morning,<br/>well <em>fed.</em>"
          onChange={(v) => setForm({ ...form, headline: v })}
          help="Use <em> for italic accents and <br/> for a line break."
        />

        <div>
          <label className="adm-label">Body</label>
          <textarea
            className="adm-textarea"
            rows={2}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
        </div>

        <div>
          <label className="adm-label">CTA target category</label>
          <select
            className="adm-select"
            value={form.ctaCategorySlug}
            onChange={(e) => setForm({ ...form, ctaCategorySlug: e.target.value })}
          >
            <option value="">— none —</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="adm-label">Background image</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {form.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.imageUrl}
                alt=""
                style={{ width: 92, height: 56, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--line-soft)', flexShrink: 0 }}
              />
            )}
            <label style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px 16px', borderRadius: 12,
              border: '1.5px dashed var(--line)',
              background: 'var(--cream)', color: 'var(--ink-2)',
              fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 13,
              cursor: 'pointer',
            }}>
              {uploading ? 'Uploading…' : (form.imageUrl ? 'Change image' : 'Upload image')}
              <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        <div>
          <label className="adm-label">Meta stats (up to 3)</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {[1, 2, 3].map((n) => (
              <div key={n} style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: 10,
                background: 'var(--cream)',
                border: '1px solid var(--line-soft)',
                borderRadius: 12,
              }}>
                <input
                  className="adm-input"
                  type="text"
                  placeholder={`Value ${n}`}
                  value={form[`meta${n}Value`]}
                  onChange={(e) => setForm({ ...form, [`meta${n}Value`]: e.target.value })}
                  style={{ height: 36, padding: '0 12px', fontWeight: 600, fontFamily: 'var(--font-cormorant), serif', fontSize: 17 }}
                />
                <input
                  className="adm-input"
                  type="text"
                  placeholder={`Label ${n}`}
                  value={form[`meta${n}Label`]}
                  onChange={(e) => setForm({ ...form, [`meta${n}Label`]: e.target.value })}
                  style={{ height: 32, padding: '0 12px' }}
                />
              </div>
            ))}
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 13, color: 'var(--ink-2)' }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            style={{ width: 18, height: 18, accentColor: 'var(--blue)' }}
          />
          Show this banner
        </label>

        <div>
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="adm-btn adm-btn-primary"
          >
            {save.isPending ? 'Saving…' : 'Save banner'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, placeholder, onChange, help }) {
  return (
    <div>
      <label className="adm-label">{label}</label>
      <input
        className="adm-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {help && <p className="adm-help">{help}</p>}
    </div>
  );
}
