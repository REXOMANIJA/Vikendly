/** Small text helpers for the admin panel (Serbian, Belgrade time) */

const TZ = 'Europe/Belgrade';

/** "2026-11-18" for a moment, in Belgrade time */
export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Hour of the day in Belgrade (0–23) */
export function belgradeHour(date: Date): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' }).format(date));
}

export function greeting(date: Date): string {
  const h = belgradeHour(date);
  return h < 5 ? 'Dobro veče' : h < 12 ? 'Dobro jutro' : h < 18 ? 'Dobar dan' : 'Dobro veče';
}

const plural = (n: number, one: string, few: string, many: string) => {
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return one;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few;
  return many;
};

/** How long ago: "upravo", "pre 25 min", "pre 3 h", "pre 2 dana" */
export function ago(iso: string, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));
  if (minutes < 2) return 'upravo';
  if (minutes < 60) return `pre ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `pre ${hours} h`;
  const days = Math.round(hours / 24);
  return `pre ${days} ${plural(days, 'dan', 'dana', 'dana')}`;
}

/** Hours since a moment (for "waiting too long" colours) */
export const hoursSince = (iso: string, now: Date) => (now.getTime() - new Date(iso).getTime()) / 3600000;

/** Days from today until a "yyyy-MM-dd" day (0 = today, 1 = tomorrow) */
export function daysUntil(day: string, now: Date): number {
  const [y, m, d] = day.split('-').map(Number);
  const [ty, tm, td] = dayKey(now).split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86400000);
}

export function inDays(n: number): string {
  if (n === 0) return 'danas';
  if (n === 1) return 'sutra';
  return `za ${n} ${plural(n, 'dan', 'dana', 'dana')}`;
}

export const euro = (n: number) => `€${Math.round(n).toLocaleString('sr-Latn')}`;
