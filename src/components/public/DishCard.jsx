'use client';
import { useMenu } from './menuContext';
import { tagClass, fmt } from './menuData';
import MenuImg from './MenuImg';
import { Plus } from './icons';

const TAG_SHORT = { vegetarian: 'Veg', vegan: 'Vegan', pescatarian: 'Pesc', spicy: 'Spicy', signature: 'Signature' };

export default function DishCard({ item }) {
  const { quickAdd, openDetail, isInBasket } = useMenu();
  const firstTag = (item.tags || [])[0];
  const cls = tagClass(firstTag);

  return (
    <article className="dish" onClick={() => openDetail(item)}>
      <div className="ds-thumb">
        <div className="ds-tags-over">
          {firstTag && (
            <span className={`tag-mini ${cls}`}>{TAG_SHORT[firstTag.slug] || firstTag.label}</span>
          )}
        </div>
        <MenuImg src={item.imageUrl} />
      </div>
      <div className="ds-body">
        <h3 className="ds-name" dangerouslySetInnerHTML={{ __html: item.name }} />
        {item.description && <p className="ds-desc">{item.description}</p>}
        <div className="ds-foot">
          <span className="ds-price"><span className="c">$</span>{fmt(item.price)}</span>
          <button
            className={`ds-add${isInBasket(item.id) ? ' added' : ''}`}
            aria-label="Add to basket"
            onClick={(e) => { e.stopPropagation(); quickAdd(item, e.currentTarget); }}
          >
            <Plus />
          </button>
        </div>
      </div>
    </article>
  );
}
