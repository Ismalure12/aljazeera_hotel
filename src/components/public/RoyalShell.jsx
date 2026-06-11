'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MenuContext } from './menuContext';
import { pickPeriodCategories } from './menuData';
import HomeScreen from './HomeScreen';
import CategoryScreen from './CategoryScreen';
import BasketScreen from './BasketScreen';
import DetailOverlay from './DetailOverlay';
import { Bell, ChevronLeft, ChevronRight } from './icons';

const BASKET_KEY = 'rh6_basket';
const BOOKMARK_KEY = 'rh6_bookmarks';

export default function RoyalShell({ categories = [] }) {
  // Augment items with their category name so cards/search/basket are self-contained
  const chapters = useMemo(
    () =>
      categories.map((c) => ({
        ...c,
        items: (c.items || []).map((it) => ({ ...it, catName: c.name, catId: c.id })),
      })),
    [categories]
  );
  const allItems = useMemo(() => chapters.flatMap((c) => c.items), [chapters]);

  // SSR-stable default (evening categories, or first non-empty); switched to the
  // real time-of-day categories after mount to avoid a hydration mismatch. Two
  // categories are featured per period (e.g. breakfast + tea in the morning).
  const defaultCategories = useMemo(() => {
    const withItems = chapters.filter((c) => c.items.length);
    const evening = withItems.filter((c) => c.period === 'evening');
    if (evening.length) return evening;
    return withItems.slice(0, 2);
  }, [chapters]);
  const [periodCategories, setPeriodCategories] = useState(defaultCategories);
  useEffect(() => {
    // Switch to the real local-time categories after mount (SSR used the default).
    const real = pickPeriodCategories(chapters);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPeriodCategories(real.length ? real : defaultCategories);
  }, [chapters, defaultCategories]);
  const periodCatIds = useMemo(
    () => new Set(periodCategories.map((c) => c.id)),
    [periodCategories]
  );
  const periodCategory = periodCategories[0] || null;

  // ---- navigation state ----
  const [screen, setScreen] = useState('home');
  const [back, setBack] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // ---- basket / bookmarks / detail ----
  const [basket, setBasket] = useState([]);
  const [bookmarks, setBookmarks] = useState(() => new Set());
  const [detailItem, setDetailItem] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [bumpTick, setBumpTick] = useState(0);
  const detailTimer = useRef(null);

  // hydrate from localStorage after mount (intentional client-only sync)
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(BASKET_KEY) || '[]');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (Array.isArray(raw)) setBasket(raw);
    } catch {}
    try {
      const bm = JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]');
      if (Array.isArray(bm)) setBookmarks(new Set(bm));
    } catch {}
  }, []);

  // ---- fly-to-cart animation ----
  const flyTo = useCallback((fromEl) => {
    if (!fromEl) return;
    const carts = Array.from(document.querySelectorAll('.tb-cart'));
    const target = carts.find((c) => c.getBoundingClientRect().width > 0);
    if (!target) return;
    const r = fromEl.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    const dot = document.createElement('div');
    dot.className = 'fly';
    dot.style.left = `${r.left + r.width / 2 - 12}px`;
    dot.style.top = `${r.top + r.height / 2 - 12}px`;
    document.body.appendChild(dot);
    requestAnimationFrame(() => {
      dot.style.transform = `translate(${tr.left + tr.width / 2 - r.left - r.width / 2}px, ${tr.top + tr.height / 2 - r.top - r.height / 2}px) scale(.5)`;
      dot.style.opacity = '0';
    });
    setTimeout(() => dot.remove(), 900);
  }, []);

  const bump = useCallback((fromEl) => {
    setBumpTick((t) => t + 1);
    if (fromEl) flyTo(fromEl);
  }, [flyTo]);

  // ---- basket actions ----
  const quickAdd = useCallback((item, fromEl) => {
    setBasket((prev) => {
      const idx = prev.findIndex(
        (l) => l.id === item.id && !l.optionLabel && (!l.extras || !l.extras.length) && !l.notes
      );
      let next;
      if (idx >= 0) {
        next = prev.map((l, i) => (i === idx ? { ...l, qty: l.qty + 1 } : l));
      } else {
        next = [
          ...prev,
          {
            uid: Math.random().toString(36).slice(2),
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            catName: item.catName,
            optionLabel: '',
            extras: [],
            notes: '',
            unitPrice: item.price,
            qty: 1,
          },
        ];
      }
      try { localStorage.setItem(BASKET_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    bump(fromEl);
  }, [bump]);

  const addLine = useCallback((line, fromEl) => {
    setBasket((prev) => {
      const next = [...prev, line];
      try { localStorage.setItem(BASKET_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    bump(fromEl);
  }, [bump]);

  const setLineQty = useCallback((uid, qty) => {
    setBasket((prev) => {
      const next = qty <= 0
        ? prev.filter((l) => l.uid !== uid)
        : prev.map((l) => (l.uid === uid ? { ...l, qty } : l));
      try { localStorage.setItem(BASKET_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeLine = useCallback((uid) => {
    setBasket((prev) => {
      const next = prev.filter((l) => l.uid !== uid);
      try { localStorage.setItem(BASKET_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const isInBasket = useCallback((id) => basket.some((l) => l.id === id), [basket]);
  const basketCount = useCallback(() => basket.reduce((a, l) => a + l.qty, 0), [basket]);
  const basketTotal = useCallback(() => basket.reduce((a, l) => a + l.unitPrice * l.qty, 0), [basket]);

  // ---- bookmarks ----
  const toggleBookmark = useCallback((id) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  // ---- navigation (History API: the device/browser back button steps through
  // in-app views instead of leaving the page) ----
  // The current view is mirrored into history.state.rh. Forward actions push an
  // entry; every back/close affordance calls history.back(); a single popstate
  // listener (applyView) is the ONLY thing that reverses a view — so the phone's
  // back button and the on-screen back arrow are identical and can never desync.
  const screenRef = useRef('home');
  const detailOpenRef = useRef(false);
  const detailItemRef = useRef(null);
  const activeCategoryRef = useRef(null);
  const depthRef = useRef(0);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { detailOpenRef.current = detailOpen; }, [detailOpen]);
  useEffect(() => { detailItemRef.current = detailItem; }, [detailItem]);
  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);

  // visual-only screen swap (no history side-effects)
  const showScreen = useCallback((name, opts = {}) => {
    setBack(!!opts.back);
    setScreen(name);
    if (!opts.noScroll) window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const pushView = useCallback((snap, replace = false) => {
    window.history[replace ? 'replaceState' : 'pushState']({ rh: snap }, '');
    depthRef.current = snap.depth || 0;
  }, []);

  // visual-only detail open/close (no history side-effects)
  const _openDetail = useCallback((item) => {
    if (detailTimer.current) clearTimeout(detailTimer.current);
    setDetailItem(item);
    setDetailOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);
  const _closeDetail = useCallback(() => {
    setDetailOpen(false);
    document.body.style.overflow = '';
    detailTimer.current = setTimeout(() => setDetailItem(null), 560);
  }, []);

  // Apply whatever view the browser landed on. Declarative + idempotent so rapid
  // taps / bfcache can't corrupt it. Never touches history itself.
  const applyView = useCallback((snap) => {
    const s = snap || { screen: 'home', depth: 0 };
    depthRef.current = s.depth || 0;

    // detail layer
    if (s.detailId) {
      const it = allItems.find((x) => x.id === s.detailId);
      if (it && (!detailOpenRef.current || detailItemRef.current?.id !== it.id)) _openDetail(it);
    } else if (detailOpenRef.current) {
      _closeDetail();
    }

    // screen layer
    const name = s.screen || 'home';
    if (name === 'category' && s.catId) {
      const cat = chapters.find((c) => c.id === s.catId);
      if (cat) setActiveCategory(cat);
    }
    if (screenRef.current !== name) showScreen(name, { back: true });
    if (name === 'home') setSearch('');
  }, [allItems, chapters, _openDetail, _closeDetail, showScreen]);

  // Seed a clean root entry on mount (a reload restarts at home) + listen for back/forward.
  useEffect(() => {
    window.history.replaceState({ rh: { screen: 'home', depth: 0 } }, '');
    const onPop = (e) => applyView(e.state?.rh);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [applyView]);

  // ---- public navigation actions ----
  const openCategory = useCallback((cat) => {
    const lateral = screenRef.current === 'category'; // chapter switch = replace, never piles up
    setActiveCategory(cat);
    setFilter('all');
    showScreen('category');
    pushView(
      { screen: 'category', catId: cat.id, depth: lateral ? depthRef.current : depthRef.current + 1 },
      lateral
    );
  }, [showScreen, pushView]);

  // Step to the adjacent category (wraps). Records the intended direction so the
  // category screen's slide animation runs the right way even on first↔last wrap.
  const navDirRef = useRef('');
  const stepCategory = useCallback((dir) => {
    const n = chapters.length;
    const cur = activeCategoryRef.current;
    if (n < 2 || !cur) return;
    const i = chapters.findIndex((c) => c.id === cur.id);
    if (i < 0) return;
    const target = dir === 'next' ? chapters[(i + 1) % n] : chapters[(i - 1 + n) % n];
    navDirRef.current = dir;
    openCategory(target);
  }, [chapters, openCategory]);
  // Read + clear the pending pager direction (CategoryScreen's slide effect uses this).
  const consumeNavDir = useCallback(() => {
    const d = navDirRef.current;
    navDirRef.current = '';
    return d;
  }, []);

  const openBasket = useCallback(() => {
    showScreen('basket');
    pushView({ screen: 'basket', depth: depthRef.current + 1 });
  }, [showScreen, pushView]);

  // one step back (matches the device back button)
  const goBack = useCallback(() => { window.history.back(); }, []);
  // jump straight to the root (logo): unwind the whole in-app stack
  const goHome = useCallback(() => {
    if (depthRef.current > 0) window.history.go(-depthRef.current);
    else { showScreen('home'); setSearch(''); }
  }, [showScreen]);

  const openDetail = useCallback((item) => {
    _openDetail(item);
    pushView({
      screen: screenRef.current,
      catId: activeCategoryRef.current?.id,
      detailId: item.id,
      depth: depthRef.current + 1,
    });
  }, [_openDetail, pushView]);
  const openDetailById = useCallback((id) => {
    const it = allItems.find((x) => x.id === id);
    if (it) openDetail(it);
  }, [allItems, openDetail]);
  // close = pop the detail's history entry (keeps the ✕ button and back button identical)
  const closeDetail = useCallback(() => { window.history.back(); }, []);

  const categoryName = useCallback((item) => item.catName || '', []);

  // ---- sticky solidify on scroll ----
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      document.querySelectorAll('.topbar').forEach((m) => m.classList.toggle('solid', y > 8));
      document.querySelectorAll('.subtabs').forEach((s) => s.classList.toggle('solid', y > 240));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [screen]);

  // ---- ESC to close (steps back one view, same as the back button) ----
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (detailOpen || screen === 'category' || screen === 'basket') goBack();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [detailOpen, screen, goBack]);

  const count = basketCount();
  const screenClass = (name) => `screen${screen === name ? ` active${back ? ' back' : ''}` : ''}`;

  const ctx = {
    categories: chapters,
    allItems,
    periodCategory,
    periodCategories,
    periodCatIds,
    activeCategory,
    search, setSearch,
    filter, setFilter,
    openCategory, stepCategory, consumeNavDir, openBasket, goHome, goBack,
    openDetail, openDetailById, closeDetail,
    detailItem, detailOpen,
    quickAdd, addLine, setLineQty, removeLine,
    isInBasket, basket, basketCount, basketTotal,
    bookmarks, toggleBookmark,
    categoryName, bumpTick,
  };

  return (
    <MenuContext.Provider value={ctx}>
      <div className="rh-app">
        <div className="shell">
          <div className="screens">
            <section className={screenClass('home')} data-screen="home"><HomeScreen /></section>
            <section className={screenClass('category')} data-screen="category"><CategoryScreen /></section>
            <section className={screenClass('basket')} data-screen="basket"><BasketScreen /></section>
          </div>

          {detailItem && <DetailOverlay key={detailItem.id} />}

          {screen === 'category' && chapters.length > 1 && !detailOpen && (
            <div className="cat-pager">
              <button
                className="cat-pg-btn prev"
                aria-label="Previous category"
                onClick={() => stepCategory('prev')}
              >
                <ChevronLeft />
              </button>
              <button
                className="cat-pg-btn next"
                aria-label="Next category"
                onClick={() => stepCategory('next')}
              >
                <ChevronRight />
              </button>
            </div>
          )}

          {count > 0 && screen !== 'basket' && !detailOpen && (
            <div className="basket-cta" onClick={openBasket}>
              <div className="ic"><Bell /></div>
              <span>{count} · Show waiter</span>
            </div>
          )}
        </div>
      </div>
    </MenuContext.Provider>
  );
}
