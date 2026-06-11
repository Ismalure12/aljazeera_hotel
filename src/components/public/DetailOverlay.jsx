'use client';
import { useRef, useState } from 'react';
import { useMenu } from './menuContext';
import { tagClass, lineUnit, fmt } from './menuData';
import MenuImg from './MenuImg';
import { Close, Bookmark, Check, Plus } from './icons';

const TAG_LONG = { vegetarian: 'Vegetarian', vegan: 'Vegan', pescatarian: 'Pescatarian', spicy: 'Spicy', signature: "Chef's Signature" };

export default function DetailOverlay() {
  const { detailItem, detailOpen, closeDetail, addLine, bookmarks, toggleBookmark, categoryName } = useMenu();
  const item = detailItem;

  // Defaults are computed once on mount; the parent passes a `key` tied to the
  // item id, so a new item remounts this component with a fresh configuration.
  const [selOpts, setSelOpts] = useState(() => {
    const d = {};
    (item?.optionGroups || []).forEach((g) => { if (g.options[0]) d[g.id] = g.options[0].id; });
    return d;
  });
  const [extras, setExtras] = useState(() => new Set());
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const addRef = useRef(null);

  if (!item) return <article className="detail" aria-hidden="true" />;

  const unit = lineUnit(item, selOpts, extras);
  const total = unit * qty;
  const catName = categoryName(item);

  const handleAdd = () => {
    const optionLabel = (item.optionGroups || [])
      .map((g) => g.options.find((o) => o.id === selOpts[g.id]))
      .filter(Boolean)
      .map((o) => o.name)
      .join(' · ');
    const chosenExtras = (item.extras || [])
      .filter((e) => extras.has(e.id))
      .map((e) => ({ name: e.name, priceAdd: e.priceAdd }));
    addLine({
      uid: Math.random().toString(36).slice(2),
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      catName,
      optionLabel,
      extras: chosenExtras,
      notes: notes.trim(),
      unitPrice: unit,
      qty,
    }, addRef.current);
    closeDetail();
  };

  return (
    <article className={`detail${detailOpen ? ' open' : ''}`}>
      <header className="dt-top">
        <button className="icon-btn" aria-label="close" onClick={closeDetail}><Close /></button>
        <button
          className={`icon-btn fav${bookmarks.has(item.id) ? ' on' : ''}`}
          aria-label="bookmark"
          onClick={() => toggleBookmark(item.id)}
        >
          <Bookmark />
        </button>
      </header>

      <div className="dt-content">
        <div className="dt-hero">
          <MenuImg src={item.imageUrl} />
          <div className="price-badge">
            <span className="k">From</span>
            <span className="v"><span>$</span>{fmt(item.price)}</span>
          </div>
        </div>

        <div className="dt-body">
          <span className="dt-cat">{catName}</span>
          <h1 className="dt-title" dangerouslySetInnerHTML={{ __html: item.name }} />
          {item.description && <p className="dt-desc">{item.description}</p>}

          <div className="dt-meta">
            <div className="cell"><span className="k">Prep</span><span className="v">{item.prepTime || '—'}</span></div>
            <div className="cell"><span className="k">Energy</span><span className="v">{item.kcal || '—'}</span></div>
            <div className="cell"><span className="k">Pairs with</span><span className="v">{item.pairing || '—'}</span></div>
          </div>

          {(item.tags || []).length > 0 && (
            <div className="dt-tags">
              {item.tags.map((t) => (
                <span key={t.id} className={`dt-tag ${tagClass(t)}`}>{TAG_LONG[t.slug] || t.label}</span>
              ))}
            </div>
          )}

          {/* Option groups (radio, pick one) */}
          {(item.optionGroups || []).map((g) => (
            <div className="dt-section" key={g.id}>
              <div className="sect-head">
                <h4>Choose your <span>{g.title}</span></h4>
                <small>pick one</small>
              </div>
              <div className="opt-list">
                {g.options.map((o) => (
                  <div
                    key={o.id}
                    className={`opt${selOpts[g.id] === o.id ? ' selected' : ''}`}
                    onClick={() => setSelOpts((s) => ({ ...s, [g.id]: o.id }))}
                  >
                    <div className="left"><div className="radio" /><span className="name">{o.name}</span></div>
                    <span className="price-add">{o.priceAdd ? `+ $${fmt(o.priceAdd)}` : 'Included'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Extras (checkbox) */}
          {(item.extras || []).length > 0 && (
            <div className="dt-section">
              <div className="sect-head"><h4>Add extras</h4><small>optional</small></div>
              <div className="extras-list">
                {item.extras.map((e) => (
                  <div
                    key={e.id}
                    className={`extra${extras.has(e.id) ? ' checked' : ''}`}
                    onClick={() => setExtras((s) => { const n = new Set(s); n.has(e.id) ? n.delete(e.id) : n.add(e.id); return n; })}
                  >
                    <div className="left">
                      <div className="checkbox"><Check /></div>
                      <span className="name">{e.name}</span>
                    </div>
                    <span className="price-add">{e.priceAdd ? `+ $${fmt(e.priceAdd)}` : 'Free'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="dt-section">
            <div className="sect-head"><h4>Notes for the kitchen</h4><small>optional</small></div>
            <textarea
              className="notes"
              rows="2"
              placeholder="Allergies, no onion, well done…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Quantity */}
          <div className="dt-qty-row">
            <span className="lbl">Quantity</span>
            <div className="dt-qty">
              <button aria-label="less" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span className="val">{qty}</span>
              <button aria-label="more" onClick={() => setQty((q) => Math.min(20, q + 1))}>+</button>
            </div>
          </div>

          {/* Add to basket — last in flow, the page ends here */}
          <div className="dt-cta">
            <div className="dt-cta-inner">
              <div className="total">
                <span className="k">Total</span>
                <span className="v"><span style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'var(--ink-3)' }}>$</span>{fmt(total)}</span>
              </div>
              <button className="add" ref={addRef} onClick={handleAdd}>
                <Plus /> Add to basket
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
