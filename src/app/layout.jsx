import { Cormorant_Garamond, Inter, Fraunces, DM_Sans } from 'next/font/google';
import './globals.css';

// Public menu (v6) fonts — Fraunces (distinctive variable display serif used for
// item names, prices, and section headings) + DM Sans (all UI/chrome).
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
  variable: '--font-dmsans',
  display: 'swap',
});

// Admin design-system fonts (kept for /admin/*)
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'Hotel Jazeera — Menu',
  description: 'Hotel Jazeera — Galkaio, Puntland · Somalia. Browse our dining menu and show your basket to your waiter.',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} ${cormorant.variable} ${inter.variable}`}
    >
      <body style={{ fontFamily: 'var(--font-dmsans), system-ui, -apple-system, sans-serif', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
