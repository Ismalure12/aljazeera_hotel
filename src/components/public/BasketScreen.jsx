'use client';
import { useState } from 'react';
import { useMenu } from './menuContext';
import { fmt } from './menuData';
import TopBar from './TopBar';
import { Cart, Info } from './icons';

export default function BasketScreen() {
  const { basket, setLineQty, removeLine, openDetailById, goBack, basketCount, basketTotal } = useMenu();
  const [removing, setRemoving] = useState(() => new Set());

  const count = basketCount();
  const total = basketTotal();

  const removeWithAnim = (uid) => {
    setRemoving((s) => new Set(s).add(uid));
    setTimeout(() => {
      removeLine(uid);
      setRemoving((s) => { const n = new Set(s); n.delete(uid); return n; });
    }, 320);
  };

  return (
    <>
      <TopBar screen="basket" centerTitle="Your basket" centerMeta={`${count} ${count === 1 ? 'item' : 'items'}`} />

      <div className="basket-head">
        <h2>Your <em>basket</em></h2>
        <span className="meta">View-only · No order is placed</span>
      </div>

      <div className="basket-body">
        {!basket.length ? (
          <div className="basket-empty">
            <div className="ring"><Cart /></div>
            <h4>Your basket is empty</h4>
            <p>Browse the menu and tap the + on a dish to start a basket you can show to your waiter.</p>
            <button className="browse" onClick={goBack}>Browse the menu →</button>
          </div>
        ) : (
          <>
            {basket.map((line) => {
              const bits = [];
              if (line.optionLabel) bits.push(line.optionLabel);
              if (line.extras && line.extras.length) bits.push(line.extras.map((e) => '+ ' + e.name).join(', '));
              return (
                <div
                  key={line.uid}
                  className={`basket-item${removing.has(line.uid) ? ' removing' : ''}`}
                  onClick={(e) => { if (e.target.closest('.qty-mini')) return; openDetailById(line.id); }}
                >
                  <img src={line.imageUrl} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                  <div className="bi-body">
                    <h3 className="bi-name" dangerouslySetInnerHTML={{ __html: line.name }} />
                    <span className="bi-cat">{line.catName}{bits.length ? ' · ' + bits.join(' · ') : ''}</span>
                    {line.notes && (
                      <span className="bi-cat" style={{ fontStyle: 'italic', color: 'var(--ink-2)' }}>“{line.notes}”</span>
                    )}
                    <div className="bi-foot">
                      <span className="bi-price"><span className="c">$</span>{fmt(line.unitPrice * line.qty)}</span>
                      <div className="qty-mini">
                        <button onClick={(e) => { e.stopPropagation(); line.qty <= 1 ? removeWithAnim(line.uid) : setLineQty(line.uid, line.qty - 1); }}>−</button>
                        <span className="val">{line.qty}</span>
                        <button onClick={(e) => { e.stopPropagation(); setLineQty(line.uid, line.qty + 1); }}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="basket-summary">
              <div className="row">
                <span>Subtotal</span>
                <span style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink)' }}>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-3)' }}>USD</span> ${fmt(total)}
                </span>
              </div>
              <div className="row tot">
                <span>Total · {count} {count === 1 ? 'item' : 'items'}</span>
                <b><span style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, letterSpacing: '.04em' }}>$</span>{fmt(total)}</b>
              </div>
              <div className="hint">
                <Info />
                <span>This basket is view-only — nothing is sent automatically. When you&apos;re ready, show this screen to your waiter to place the order.</span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
