'use client';
import { useMemo } from 'react';
import { useMenu } from './menuContext';
import TopBar from './TopBar';
import FeaturedCard from './FeaturedCard';
import DishCard from './DishCard';
import { Search, ChevronRight, ArrowRight } from './icons';
import MenuImg from './MenuImg';

export default function HomeScreen() {
  const { categories, allItems, periodCategories, periodCatIds, openCategory, search, setSearch } = useMenu();

  const q = search.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return null;
    return allItems.filter((it) => {
      const name = (it.name || '').toLowerCase();
      const desc = (it.description || '').toLowerCase();
      const cat = (it.catName || '').toLowerCase();
      return name.includes(q) || desc.includes(q) || cat.includes(q);
    });
  }, [q, allItems]);

  return (
    <>
      <TopBar screen="home" />

      <div className={`searchbar${q ? ' has-text' : ''}`}>
        <Search />
        <input
          placeholder="Search the menu…"
          autoComplete="off"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="clear" aria-label="clear" onClick={() => setSearch('')}>×</button>
      </div>

      {results ? (
        <div>
          <div className="section-head">
            <h2>Results</h2>
            <span className="meta">{results.length} {results.length === 1 ? 'dish' : 'dishes'}</span>
          </div>
          <div className="tonight-wrap">
            {results.length ? (
              <div className="dish-grid">
                {results.map((it) => <DishCard key={it.id} item={it} />)}
              </div>
            ) : (
              <div className="empty">
                <div className="ring"><Search /></div>
                <h4>Nothing matched</h4>
                <p>Try a different word — a dish, an ingredient, or a course.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Menu chapters rail */}
          <div className="section">
            <div className="section-head">
              <h2>The <em>menu</em></h2>
              <span className="meta">{categories.length} chapters</span>
            </div>
            <div className="rail">
              {categories.map((c) => (
                <div className="cat-tile" key={c.id} onClick={() => openCategory(c)}>
                  {periodCatIds.has(c.id) && <span className="now-dot">Now</span>}
                  <MenuImg src={c.coverUrl} />
                  <div className="info">
                    <div>
                      <div className="nm">{c.name}</div>
                      <span className="ct">{c.items.length} dishes</span>
                    </div>
                    <div className="arr"><ChevronRight /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Now serving — two featured categories per service (e.g. breakfast + tea) */}
          {periodCategories.map((chap) => {
            const items = chap.items || [];
            const featured =
              items.find((i) => (i.tags || []).some((t) => t.slug === 'signature')) || items[0];
            const gridItems = items
              .filter((i) => i.id !== (featured && featured.id))
              .slice(0, 8);
            const showMore = items.length > 9;
            if (!featured) return null;
            return (
              <div className="section" key={chap.id}>
                <div className="section-head">
                  <h2>{chap.name}</h2>
                  <span className="meta">Now serving · {items.length} dishes</span>
                </div>
                <div className="tonight-wrap">
                  <FeaturedCard item={featured} category={chap} />
                  <div className="dish-grid">
                    {gridItems.map((it) => <DishCard key={it.id} item={it} />)}
                  </div>
                  {showMore && (
                    <button className="show-more" onClick={() => openCategory(chap)}>
                      <span className="sm-t">Show all {chap.name} · {items.length} dishes</span>
                      <span className="sm-arr"><ArrowRight /></span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Footer */}
          <footer className="foot">
            <div><b>Hotel Jazeera</b>Galkaio, Puntland<br />Somalia</div>
            <div><b>Contact</b>
              <a href="tel:+252907795874">+252 907795874</a><br />
              <a href="mailto:info@hoteljazeera.so">info@hoteljazeera.so</a>
            </div>
            <div><b>Kitchen</b>06:30 — 23:00<br />Daily</div>
            <div className="soc"><b>Follow</b>
              <a href="https://www.facebook.com/hoteljazeera" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://hoteljazeera.so" target="_blank" rel="noopener noreferrer">hoteljazeera.so</a>
            </div>
            <div className="row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <span className="crest"><span className="m"><img src="/jazeera-logo.png" alt="" /></span>Hotel Jazeera</span>
              <span>Vol. XII · MENU</span>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
