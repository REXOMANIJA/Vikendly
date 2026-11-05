import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['sr', 'en'],
  defaultLocale: 'sr',
});

export const locales = routing.locales;
export type Locale = (typeof routing.locales)[number];
