// Inline SVG icons used across the v6 public menu (stroke = currentColor)
const S = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' };

export const ChevronLeft = (p) => (
  <svg viewBox="0 0 24 24" strokeWidth="2" {...S} {...p}><polyline points="15 18 9 12 15 6" /></svg>
);
export const ChevronRight = (p) => (
  <svg viewBox="0 0 24 24" strokeWidth="2" {...S} {...p}><polyline points="9 18 15 12 9 6" /></svg>
);
export const ArrowRight = (p) => (
  <svg viewBox="0 0 24 24" strokeWidth="2" {...S} {...p}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
);
export const Plus = (p) => (
  <svg viewBox="0 0 24 24" strokeWidth="2.4" {...S} {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
);
export const Search = (p) => (
  <svg viewBox="0 0 24 24" strokeWidth="2" {...S} {...p}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
export const Cart = (p) => (
  <svg viewBox="0 0 24 24" strokeWidth="1.8" {...S} {...p}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
);
export const Close = (p) => (
  <svg viewBox="0 0 24 24" strokeWidth="2" {...S} {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
);
export const Bookmark = (p) => (
  <svg viewBox="0 0 24 24" strokeWidth="1.8" {...S} {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
);
export const Check = (p) => (
  <svg viewBox="0 0 24 24" strokeWidth="3" {...S} {...p}><polyline points="20 6 9 17 4 12" /></svg>
);
export const Bell = (p) => (
  <svg viewBox="0 0 24 24" strokeWidth="1.8" {...S} {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
);
export const Info = (p) => (
  <svg viewBox="0 0 24 24" strokeWidth="2" {...S} {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
);
