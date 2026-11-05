import { formatDate, formatDateRange, formatStay } from '@/lib/dates';

const d = (day: number, month: number, year = 2026) => new Date(year, month - 1, day);

describe('day-month-year formatting', () => {
  it('writes single dates day first', () => {
    expect(formatDate(d(13, 11), 'sr')).toBe('13.11.2026.');
    expect(formatDate(d(5, 1), 'sr')).toBe('05.01.2026.');
    expect(formatDate(d(13, 11), 'en')).toBe('13/11/2026');
  });

  it('writes a stay compactly, with the year once', () => {
    expect(formatStay(d(13, 11), d(15, 11), 'sr')).toBe('13.11. – 15.11.2026.');
    expect(formatStay(d(13, 11), d(15, 11), 'en')).toBe('13/11 – 15/11/2026');
  });

  it('writes both years when a stay crosses New Year', () => {
    expect(formatStay(d(30, 12), d(2, 1, 2027), 'sr')).toBe('30.12.2026. – 02.01.2027.');
  });

  it('puts the day before the month in English text too', () => {
    const text = formatDateRange(d(6, 11), d(8, 11), 'en');
    expect(text.indexOf('6')).toBeLessThan(text.indexOf('Nov'));
  });
});

describe('visit month for the verified badge', () => {
  it('uses the Serbian form after "u"', () => {
    const { formatVisitMonth } = require('@/lib/dates');
    expect(formatVisitMonth(d(18, 10), 'sr')).toBe('oktobru 2026');
    expect(formatVisitMonth(d(3, 5), 'sr')).toBe('maju 2026');
    expect(formatVisitMonth(d(18, 10), 'en')).toBe('October 2026');
  });
});
