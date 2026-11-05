// Parse "yyyy-MM-dd" as a local calendar date. new Date("2026-11-13") would be UTC midnight,
// which shifts the day in some timezones and breaks weekend pricing.
export function parseDateParam(value?: string): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return undefined;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * The upcoming weekend stay: Friday check-in, Sunday check-out (2 nights).
 * If today is Friday it's this Friday; from Saturday on it's next week's Friday.
 */
export function getUpcomingWeekend(from: Date = new Date()): { checkIn: Date; checkOut: Date } {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const daysUntilFriday = (5 - start.getDay() + 7) % 7;
  const checkIn = new Date(start);
  checkIn.setDate(start.getDate() + daysUntilFriday);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkIn.getDate() + 2);
  return { checkIn, checkOut };
}

/**
 * Locale for Intl date/number formatting. Plain "sr" formats in Cyrillic,
 * but the site is in Serbian Latin.
 */
export function intlLocale(locale: string): string {
  return locale === 'sr' ? 'sr-Latn' : locale;
}

/** e.g. "6–8. nov" (sr) or "Nov 6 – 8" (en) */
export function formatDateRange(start: Date, end: Date, locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short' }).formatRange(
    start,
    end
  );
}

/** "yyyy-MM-dd" in local time, for URLs and date inputs. */
export function toDateParam(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
