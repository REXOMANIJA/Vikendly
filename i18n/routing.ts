import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['sr', 'en'],
  defaultLocale: 'sr',
  // Internal route (folder name) → URL shown to visitors in each language.
  // Always link with the internal name, e.g. { pathname: '/houses/[slug]', params: { slug } }.
  pathnames: {
    '/': '/',
    '/search': '/search',
    '/destinations': {
      sr: '/destinacije',
      en: '/destinations',
    },
    '/houses/[slug]': {
      sr: '/kuce/[slug]',
      en: '/houses/[slug]',
    },
    '/owners': {
      sr: '/za-vlasnike',
      en: '/for-owners',
    },
    '/contact': {
      sr: '/kontakt',
      en: '/contact',
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
