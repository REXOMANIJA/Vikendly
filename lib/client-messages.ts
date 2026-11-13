/**
 * Texts the browser needs. next-intl would otherwise send every text of the site with every
 * page (about 30 KB); only interactive ('use client') components read texts in the browser,
 * so only their parts are sent. Everything else is already rendered on the server.
 *
 * Adding useTranslations('x') to a 'use client' component? Add 'x' here, or the browser shows
 * a missing-text error. (__tests__/client-messages.test.ts checks every path exists.)
 */
export const CLIENT_MESSAGE_PATHS = [
  'header', // Header
  'languageSwitcher', // LanguageSwitcher
  'hero.search', // SearchBar
  'destinations', // AllDestinations, SearchBar/SearchFilters (countries)
  'categories', // SearchFilters
  'search.filters', // SearchFilters
  'datePicker', // DateRangePicker
  'house.photoAlt', // Gallery
  'house.gallery', // Gallery
  'house.booking', // PriceCalculator
  'house.calculator', // PriceCalculator
  'house.units', // PriceCalculator
  'privacyNote', // PrivacyNote inside the booking and owner forms
  'ownerCTA', // OwnerApplicationForm
  'favorites', // FavoriteButton, SavedHouses
  'share', // ShareButton
  'review', // ReviewForm
  'errorPage', // error.tsx
] as const;

type Messages = Record<string, unknown>;

/** Copies only the listed paths (e.g. "house.gallery") out of all messages */
export function pickMessages(all: Messages, paths: readonly string[] = CLIENT_MESSAGE_PATHS): Messages {
  const out: Messages = {};
  for (const path of paths) {
    const keys = path.split('.');
    let from: unknown = all;
    for (const k of keys) from = (from as Messages | undefined)?.[k];
    if (from === undefined) continue;
    let to = out;
    for (const k of keys.slice(0, -1)) to = (to[k] ??= {}) as Messages;
    to[keys.at(-1)!] = from;
  }
  return out;
}
