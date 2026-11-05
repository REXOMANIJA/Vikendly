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
 * Locale for Intl date/number formatting. Plain "sr" formats in Cyrillic, but the site is in
 * Serbian Latin. English uses British style so dates are always day-month-year ("6 Nov").
 */
export function intlLocale(locale: string): string {
  return locale === 'sr' ? 'sr-Latn' : locale === 'en' ? 'en-GB' : locale;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Day-month-year: "13.11.2026." (sr) or "13/11/2026" (en) */
export function formatDate(date: Date, locale: string): string {
  const [d, m, y] = [pad(date.getDate()), pad(date.getMonth() + 1), date.getFullYear()];
  return locale === 'sr' ? `${d}.${m}.${y}.` : `${d}/${m}/${y}`;
}

/**
 * Compact stay for the date field, day first:
 * same year → "13.11. – 15.11.2026." / "13/11 – 15/11/2026"; different years → both in full.
 */
export function formatStay(from: Date, to: Date, locale: string): string {
  if (from.getFullYear() !== to.getFullYear()) return `${formatDate(from, locale)} – ${formatDate(to, locale)}`;
  const short = (d: Date) =>
    locale === 'sr' ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.` : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  return `${short(from)} – ${formatDate(to, locale)}`;
}

/** e.g. "6–8. nov" (sr) or "6–8 Nov" (en) */
export function formatDateRange(start: Date, end: Date, locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short' }).formatRange(
    start,
    end
  );
}

/** "yyyy-MM-dd" in local time, for URLs and date inputs. */
export function toDateParam(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Serbian month names after "u" ("u oktobru"); Intl only gives the plain form ("oktobar")
const SR_MONTHS_LOCATIVE = [
  'januaru', 'februaru', 'martu', 'aprilu', 'maju', 'junu',
  'julu', 'avgustu', 'septembru', 'oktobru', 'novembru', 'decembru',
];

/** For "Svratili smo u {month}." → "oktobru 2026" (sr) or "October 2026" (en) */
export function formatVisitMonth(date: Date, locale: string): string {
  if (locale === 'sr') return `${SR_MONTHS_LOCATIVE[date.getMonth()]} ${date.getFullYear()}`;
  return new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', year: 'numeric' }).format(date);
}
