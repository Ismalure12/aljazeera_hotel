'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMenu } from './menuContext';
import { FILTERS, itemHasTag, minPrice, fmt } from './menuData';
import TopBar from './TopBar';
import DishCard from './DishCard';
import RowDish from './RowDish';
import MenuImg from './MenuImg';
import { Search } from './icons';

export default function CategoryScreen() {
  const { categories, activeCategory, openCategory, consumeNavDir, filter, setFilter } = useMenu();
  const rowRef = useRef(null);

  const cat = activeCategory;
  const allItems = useMemo(() => (cat ? cat.items : []), [cat]);
  const minP = minPrice(allItems);

  const idx = categories.findIndex((c) => c.id === cat?.id);

  // ---- slide-in animation on category change ----
  // The pager (shell-level) records the intended direction in navDir; lateral chip
  // jumps fall back to the index delta.
  const prevIdx = useRef(idx);
  const [slide, setSlide] = useState({ dir: '', k: 0 });
  useEffect(() => {
    if (idx === prevIdx.current || idx < 0) return;
    const dir = (consumeNavDir?.()) || (idx > prevIdx.current ? 'next' : 'prev');
    setSlide((s) => ({ dir, k: s.k + 1 }));
    prevIdx.current = idx;
  }, [idx, consumeNavDir]);

  const items = useMemo(() => {
    if (!cat) return [];
    return filter === 'all' ? allItems : allItems.filter((i) => itemHasTag(i, filter));
  }, [cat, filter, allItems]);

  const gridItems = items.slice(0, 4);
  const listItems = items.slice(gridItems.length);

  // center the active chapter chip
  useEffect(() => {
    const el = rowRef.current?.querySelector('.sub-chip.on');
    if (el) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
  }, [cat]);

  if (!cat) return <TopBar screen="category" />;

  return (
    <>
      <TopBar
        screen="category"
        centerTitle={cat.name}
        centerMeta={`${allItems.length} dishes · from $${fmt(minP)}`}
      />

      <div className="cat-hero">
        <MenuImg src={cat.coverUrl} loading="eager" />
        <div className="info">
          {cat.kicker && <span className="kicker">{cat.kicker}</span>}
          {cat.headline ? (
            <h2 dangerouslySetInnerHTML={{ __html: cat.headline }} />
          ) : (
            <h2>{cat.name}</h2>
          )}
          <div className="meta">
            {cat.kicker && <><span><b>{cat.kicker}</b></span><span className="sep" /></>}
            <span><b>{allItems.length}</b> dishes</span>
            <span className="sep" />
            <span>from <b>${fmt(minP)}</b></span>
          </div>
        </div>
      </div>

      <nav className="subtabs">
        <div className="row" ref={rowRef}>
          {categories.map((ch) => (
            <button
              key={ch.id}
              className={`sub-chip${ch.id === cat.id ? ' on' : ''}`}
              onClick={() => openCategory(ch)}
            >
              {ch.name} <span className="ct">{ch.items.length}</span>
            </button>
          ))}
        </div>
        <div className="filters">
          {FILTERS.map((f) => (
            <button
              key={f.slug}
              className={`fchip ${f.cls}${filter === f.slug ? ' on' : ''}`}
              onClick={() => setFilter(f.slug)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </nav>

      <div className={`cat-body${slide.dir ? ` slide-${slide.dir}` : ''}`} key={slide.k}>
        {gridItems.length > 0 && (
          <>
            <div className="subsection-head">
              <h3>Most <em>loved</em></h3>
              <span className="ct">{gridItems.length} highlighted</span>
            </div>
            <div className="dish-grid">
              {gridItems.map((it) => <DishCard key={it.id} item={it} />)}
            </div>
          </>
        )}

        {listItems.length > 0 && (
          <>
            <div className="subsection-head" style={{ marginTop: 28 }}>
              <h3>More <em>to explore</em></h3>
              <span className="ct">{listItems.length} more</span>
            </div>
            <div className="dish-list">
              {listItems.map((it) => <RowDish key={it.id} item={it} />)}
            </div>
          </>
        )}

        {!gridItems.length && !listItems.length && (
          <div className="empty">
            <div className="ring"><Search /></div>
            <h4>Nothing matches</h4>
            <p>Try a different filter — or tap All to see every dish in this chapter.</p>
          </div>
        )}
      </div>
    </>
  );
}
