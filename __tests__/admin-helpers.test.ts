import { houseHealth } from '@/lib/admin-health';
import { ago, daysUntil, greeting, inDays } from '@/lib/admin-format';

describe('listing completeness', () => {
  const full = {
    photos: 12,
    description_sr: 'x'.repeat(450),
    description_en: 'Text',
    lat: 43.7,
    nearby_sr: 'Jezero 2 km',
    rules_sr: 'Bez žurki',
    owner_phone: '064 123 4567',
  };

  it('a complete listing is 100% with nothing missing', () => {
    expect(houseHealth(full)).toEqual({ percent: 100, missing: [] });
  });

  it('lists what is missing, owner phone first', () => {
    const h = houseHealth({ ...full, owner_phone: null, photos: 4, nearby_sr: ' ' });
    expect(h.missing).toEqual(['telefon vlasnika', 'bar 10 fotografija', 'udaljenosti i okolina']);
    expect(h.percent).toBe(57);
  });
});

describe('admin time labels', () => {
  const now = new Date('2026-11-18T12:00:00Z'); // 13:00 in Belgrade

  it('says how long ago, in Serbian', () => {
    expect(ago('2026-11-18T11:59:30Z', now)).toBe('upravo');
    expect(ago('2026-11-18T11:35:00Z', now)).toBe('pre 25 min');
    expect(ago('2026-11-18T09:00:00Z', now)).toBe('pre 3 h');
    expect(ago('2026-11-17T12:00:00Z', now)).toBe('pre 1 dan');
    expect(ago('2026-11-15T12:00:00Z', now)).toBe('pre 3 dana');
    expect(ago('2026-11-13T12:00:00Z', now)).toBe('pre 5 dana');
  });

  it('counts days until an arrival in Belgrade time', () => {
    expect(daysUntil('2026-11-18', now)).toBe(0);
    expect(daysUntil('2026-11-20', now)).toBe(2);
    expect(inDays(0)).toBe('danas');
    expect(inDays(1)).toBe('sutra');
    expect(inDays(2)).toBe('za 2 dana');
    expect(inDays(5)).toBe('za 5 dana');
    // 23:30 UTC is already the next day in Belgrade
    expect(daysUntil('2026-11-19', new Date('2026-11-18T23:30:00Z'))).toBe(0);
  });

  it('greets by Belgrade time of day', () => {
    expect(greeting(new Date('2026-11-18T06:00:00Z'))).toBe('Dobro jutro');
    expect(greeting(now)).toBe('Dobar dan');
    expect(greeting(new Date('2026-11-18T19:00:00Z'))).toBe('Dobro veče');
  });
});
