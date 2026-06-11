'use client';
import { useEffect, useRef } from 'react';
import { useMenu } from './menuContext';
import { ChevronLeft, Cart } from './icons';

export default function TopBar({ screen, centerTitle, centerMeta }) {
  const { goHome, goBack, openBasket, basketCount, bumpTick } = useMenu();
  const count = basketCount();
  const cartRef = useRef(null);

  // Replay the cart-dot "bump" animation whenever an item is added.
  useEffect(() => {
    if (!bumpTick || !cartRef.current) return;
    const el = cartRef.current;
    el.classList.add('bump');
    const t = setTimeout(() => el.classList.remove('bump'), 600);
    return () => clearTimeout(t);
  }, [bumpTick]);

  return (
    <header className="topbar">
      <button className="tb-btn back" aria-label="back" onClick={goBack}>
        <ChevronLeft />
      </button>

      <a className="tb-logo" href="#" aria-label="Hotel Jazeera — home" onClick={(e) => { e.preventDefault(); goHome(); }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="tb-logo-img" src="/jazeera-icon.png" alt="Hotel Jazeera" />
        <span className="tb-logo-txt">Hotel Jazeera</span>
      </a>

      <div className="tb-center">
        <span className="a">{centerTitle}</span>
        <span className="b">{centerMeta}</span>
      </div>

      <div className="tb-actions">
        {screen === 'basket' ? (
          <div style={{ width: 42, height: 42, visibility: 'hidden' }} />
        ) : (
          <button
            ref={cartRef}
            className={`tb-btn tb-cart${count > 0 ? ' has-items' : ''}`}
            aria-label="basket"
            onClick={openBasket}
          >
            <Cart />
            <span className="cart-dot">{count}</span>
          </button>
        )}
      </div>
    </header>
  );
}
