import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { pickMessages } from '@/lib/client-messages';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { site } from '@/lib/site';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import NavigationProgress from '@/components/layout/NavigationProgress';
import { Suspense } from 'react';
import { Analytics } from '@vercel/analytics/next';
import '../globals.css';

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL(site.url),
    title: t('title'),
    description: t('description'),
    applicationName: 'Vikendly',
    openGraph: {
      title: 'Vikendly',
      siteName: 'Vikendly',
      description: t('ogDescription'),
      type: 'website',
      locale,
      alternateLocale: routing.locales.filter((l) => l !== locale),
      // Preview picture for shared links (hero photo + logo + slogan, 1200×630, ~100 KB).
      // House and owner pages replace it with their own photo.
      images: [{ url: `/images/og-${locale === 'en' ? 'en' : 'sr'}.jpg`, width: 1200, height: 630, alt: 'Vikendly' }],
    },
    twitter: { card: 'summary_large_image' },
    // Each page sets its own canonical / language links (lib/seo.ts)
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans antialiased bg-background text-text">
        {/* Suspense: the bar reads the address (search params), which must not block the page */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {/* Only the texts interactive parts need are sent to the browser (lib/client-messages.ts) */}
        <NextIntlClientProvider messages={pickMessages(await getMessages())}>
          <Header />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
        {/* Anonymous visit counts (Vercel Web Analytics: no cookies, nothing personal). Only
            collects on the live site once Analytics is switched on in the Vercel project. */}
        <Analytics />
      </body>
    </html>
  );
}
