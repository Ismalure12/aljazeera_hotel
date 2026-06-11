// ============================================================
// Hotel Jazeera v6 — pure helpers shared across the public menu
// ============================================================

// Subtle striped placeholder shown when an item/category image is missing
export const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='320'>
      <defs><pattern id='p' width='14' height='14' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
        <rect width='14' height='14' fill='%23f3f1e8'/><rect width='7' height='14' fill='%23ebe9df'/>
      </pattern></defs>
      <rect width='400' height='320' fill='url(%23p)'/>
    </svg>`
  );

// Map a Tag ({ slug }) to one of the v6 visual classes.
// Exactly matches the handoff TAG_CLASS — only the 5 semantic slugs get color.
export function tagClass(tag) {
  if (!tag) return '';
  const slug = (tag.slug || '').toLowerCase();
  if (slug === 'vegetarian' || slug === 'vegan' || slug === 'pescatarian') return 'veg';
  if (slug === 'spicy') return 'spicy';
  if (slug === 'signature') return 'sig';
  return '';
}

// Filter chips offered on the category screen (filter by tag slug)
export const FILTERS = [
  { slug: 'all', label: 'All', cls: '' },
  { slug: 'vegetarian', label: 'Vegetarian', cls: 'veg' },
  { slug: 'vegan', label: 'Vegan', cls: 'veg' },
  { slug: 'pescatarian', label: 'Pescatarian', cls: '' },
  { slug: 'spicy', label: 'Spicy', cls: 'spicy' },
  { slug: 'signature', label: "Chef's signature", cls: 'sig' },
];

export function itemHasTag(item, slug) {
  return (item.tags || []).some((t) => t.slug === slug);
}

// Time-of-day → period bucket used for the "Now serving" section
// morning 5–11 · midday/noon 11–15 · afternoon 15–18 · evening 18–5
export function currentPeriod(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 15) return 'midday';
  if (h >= 15 && h < 18) return 'afternoon';
  return 'evening';
}

// Pick the category that matches the current period; fall back gracefully.
export function pickPeriodCategory(categories) {
  const withItems = categories.filter((c) => c.items && c.items.length);
  if (!withItems.length) return categories[0] || null;
  const p = currentPeriod();
  return (
    withItems.find((c) => c.period === p) ||
    withItems.find((c) => c.period === 'evening') ||
    withItems[0]
  );
}

// Pick ALL categories to feature for the current period (typically two — e.g.
// breakfast + tea in the morning). Falls back to evening, then the first one or
// two non-empty categories so the home page always has something to feature.
export function pickPeriodCategories(categories) {
  const withItems = categories.filter((c) => c.items && c.items.length);
  if (!withItems.length) return [];
  const p = currentPeriod();
  const matches = withItems.filter((c) => c.period === p);
  if (matches.length) return matches;
  const evening = withItems.filter((c) => c.period === 'evening');
  if (evening.length) return evening;
  return withItems.slice(0, 2);
}

export function minPrice(items) {
  if (!items || !items.length) return 0;
  return Math.min(...items.map((i) => i.price || 0));
}

// Strip out the price for a single configured detail line
export function lineUnit(item, selectedOptions, checkedExtras) {
  let unit = item.price || 0;
  (item.optionGroups || []).forEach((g) => {
    const optId = selectedOptions[g.id];
    const opt = g.options.find((o) => o.id === optId);
    if (opt) unit += opt.priceAdd || 0;
  });
  (item.extras || []).forEach((e) => {
    if (checkedExtras.has(e.id)) unit += e.priceAdd || 0;
  });
  return unit;
}

// Human-readable price: no decimals when whole, otherwise up to 2 decimals with
// trailing zeros stripped (1.50 → 1.5, 5.90 → 5.9, 5.98 → 5.98, 6.00 → 6).
export function fmt(n) {
  const v = Number(n || 0);
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
