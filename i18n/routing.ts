import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['sr', 'en'],
  defaultLocale: 'sr',
  // Serbian has no prefix (vikendly.com, vikendly.com/kuce/…); English lives under /en.
  // Old /sr/… links redirect to the same page without /sr.
  localePrefix: 'as-needed',
  // Everyone starts on the Serbian site, whatever their browser language;
  // the SR / EN switch in the header moves to English
  localeDetection: false,
  // Internal route (folder name) → URL shown to visitors in each language.
  // Always link with the internal name, e.g. { pathname: '/houses/[slug]', params: { slug } }.
  pathnames: {
    '/': '/',
    // Old /sr/search links redirect to /pretraga (next.config.mjs)
    '/search': {
      sr: '/pretraga',
      en: '/search',
    },
    '/destinations': {
      sr: '/destinacije',
      en: '/destinations',
    },
    '/houses/[slug]': {
      sr: '/kuce/[slug]',
      en: '/houses/[slug]',
    },
    // Holiday offer (admin → Praznici)
    '/holidays/[slug]': {
      sr: '/praznici/[slug]',
      en: '/holidays/[slug]',
    },
    '/owners': {
      sr: '/za-vlasnike',
      en: '/for-owners',
    },
    '/contact': {
      sr: '/kontakt',
      en: '/contact',
    },
    '/faq': {
      sr: '/cesta-pitanja',
      en: '/faq',
    },
    '/saved': {
      sr: '/sacuvane',
      en: '/saved',
    },
    // Private review link a guest gets after a confirmed stay (not in the sitemap)
    '/review/[token]': {
      sr: '/ocena/[token]',
      en: '/review/[token]',
    },
    '/terms': {
      sr: '/uslovi-koriscenja',
      en: '/terms',
    },
    '/privacy': {
      sr: '/privatnost',
      en: '/privacy',
    },
  },
});

export const locales = routing.locales;
export type Locale = (typeof routing.locales)[number];
