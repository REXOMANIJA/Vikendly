import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import '../globals.css';

// The admin panel is its own root layout (separate from the public /[locale] site)
// and is in Serbian only.

const playfair = Playfair_Display({ subsets: ['latin', 'latin-ext'], variable: '--font-playfair', display: 'swap' });
const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'Vikendly admin',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans antialiased bg-background text-text min-h-screen">{children}</body>
    </html>
  );
}
