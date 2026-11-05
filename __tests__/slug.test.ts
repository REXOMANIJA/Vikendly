import { slugify, SLUG_PATTERN } from '@/lib/slug';

describe('slugify', () => {
  it('turns Serbian names into clean URL parts', () => {
    expect(slugify('Kuća na Drini')).toBe('kuca-na-drini');
    expect(slugify('Šale Jahorina')).toBe('sale-jahorina');
    expect(slugify('Đurđevo brdo')).toBe('djurdjevo-brdo');
    expect(slugify('Žabljak – Džep raja!')).toBe('zabljak-dzep-raja');
  });

  it('always produces a valid slug', () => {
    for (const name of ['  Vila  Ribnica  ', 'Apartman za dvoje (Brzeće)', '123 Kuća', 'Čćšžđ']) {
      expect(slugify(name)).toMatch(SLUG_PATTERN);
    }
  });
});
