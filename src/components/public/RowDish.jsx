'use client';
import { useMenu } from './menuContext';
import { tagClass, fmt } from './menuData';
import MenuImg from './MenuImg';
import { Plus } from './icons';

export default function RowDish({ item }) {
  const { quickAdd, openDetail, isInBasket } = useMenu();
  const tags = (item.tags || []).slice(0, 2);

  return (
    <article className="row-dish" onClick={() => openDetail(item)}>
      <div className="rd-thumb"><MenuImg src={item.imageUrl} /></div>
      <div className="rd-body">
        <h3 className="rd-name" dangerouslySetInnerHTML={{ __html: item.name }} />
        {item.description && <p className="rd-desc">{item.description}</p>}
        <div className="rd-tags">
          {tags.map((t) => (
            <span key={t.id} className={`tag-text ${tagClass(t)}`}>{t.label}</span>
          ))}
        </div>
      </div>
      <div className="rd-right">
        <span className="rd-price"><span className="c">$</span>{fmt(item.price)}</span>
        <button
          className={`rd-add${isInBasket(item.id) ? ' added' : ''}`}
          aria-label="add"
          onClick={(e) => { e.stopPropagation(); quickAdd(item, e.currentTarget); }}
        >
          <Plus />
        </button>
      </div>
    </article>
  );
}
