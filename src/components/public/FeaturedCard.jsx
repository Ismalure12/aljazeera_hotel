'use client';
import { useMenu } from './menuContext';
import { tagClass, fmt } from './menuData';
import MenuImg from './MenuImg';
import { Plus, ChevronRight } from './icons';

const TAG_LONG = { vegetarian: 'Vegetarian', vegan: 'Vegan', pescatarian: 'Pescatarian', spicy: 'Spicy', signature: "Chef's Signature" };

export default function FeaturedCard({ item, category }) {
  const { quickAdd, openDetail, isInBasket } = useMenu();
  if (!item) return null;

  return (
    <article className="featured" onClick={() => openDetail(item)}>
      <div className="ft-img">
        <span className="ft-chip"><span className="star" /> Featured</span>
        <button
          className={`ft-add${isInBasket(item.id) ? ' added' : ''}`}
          aria-label="add"
          onClick={(e) => { e.stopPropagation(); quickAdd(item, e.currentTarget); }}
        >
          <Plus />
        </button>
        <MenuImg src={item.imageUrl} />
        <span className="ft-price-strip"><span className="c">$</span>{fmt(item.price)}</span>
      </div>
      <div className="ft-body">
        <div className="ft-cat">{category?.name} · Chef&apos;s selection</div>
        <h3 className="ft-name" dangerouslySetInnerHTML={{ __html: item.name }} />
        {item.description && <p className="ft-desc">{item.description}</p>}
        <div className="ft-meta">
          {item.prepTime && <span className="pill">{item.prepTime}</span>}
          {item.kcal && <span className="pill">{item.kcal}</span>}
          {item.pairing && <span className="pill">Pairs with {item.pairing}</span>}
          {(item.tags || []).map((t) => {
            const c = tagClass(t);
            return c ? <span key={t.id} className={`pill ${c}`}>{TAG_LONG[t.slug] || t.label}</span> : null;
          })}
        </div>
        <div className="ft-foot">
          <span className="ft-price"><span className="c">$</span>{fmt(item.price)}</span>
          <span className="ft-go">View dish
            <span className="ic"><ChevronRight /></span>
          </span>
        </div>
      </div>
    </article>
  );
}
