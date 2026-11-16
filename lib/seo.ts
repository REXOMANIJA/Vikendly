import type { Metadata } from 'next';
import { getPathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

type Href = Parameters<typeof getPathname>[0]['href'];

/**
 * Tells Google the page's own address (canonical) and its address in each language,
 * e.g. /destinacije ↔ /en/destinations. Every public page should set this;
 * without it Google may treat the page as a copy of another one.
 * `query` is added to every URL as-is (e.g. "?destination=zlatibor").
 */
export function localizedAlternates(locale: string, href: Href, query = ''): Metadata['alternates'] {
  const url = (l: Locale) => getPathname({ locale: l, href }) + query;
  return {
    canonical: url(locale as Locale),
    languages: { sr: url('sr'), en: url('en'), 'x-default': url(routing.defaultLocale) },
  };
}
