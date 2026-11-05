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
  },
});

export const locales = routing.locales;
export type Locale = (typeof routing.locales)[number];
