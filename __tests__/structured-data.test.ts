import { houseStructuredData } from '@/lib/structured-data';
import { summarize } from '@/lib/data';
import type { House, Review } from '@/types';

const rules = { partiesAllowed: false, petsAllowed: true, smokingAllowed: false, checkInTime: '15:00', checkOutTime: '11:00' };
const house: House = {
  id: 'h1',
  slug: 'kuca',
  name: 'Kuća na Tari',
  destinationId: 'tara',
  categoryIds: [],
  capacity: 6,
  bedrooms: 3,
  pricing: { weekdayPrice: 80, weekendPrice: 100, minNights: 2 },
  amenities: ['wifi'],
  photos: ['/images/house-01.svg', 'https://x.supabase.co/storage/v1/object/public/house-photos/a.jpg'],
  description: { sr: 'Opis', en: 'Text' },
  rules,
  location: { address: 'Kaluđerske bare', lat: 43.9, lng: 19.5 },
};

describe('house structured data (Google)', () => {
  const base = { reviews: [], destinationName: 'Tara', country: 'SR', url: 'https://vikendly.com/sr/kuce/kuca', description: 'Opis' };

  it('has name, absolute photos, place, map pin and from-price, but no written address', () => {
    const data = houseStructuredData({ house, ...base });
    expect(data).toMatchObject({
      '@type': 'LodgingBusiness',
      name: 'Kuća na Tari',
      address: { addressLocality: 'Tara', addressCountry: 'RS' },
      geo: { latitude: 43.9, longitude: 19.5 },
      priceRange: '€80+',
    });
    expect(JSON.stringify(data)).not.toContain('Kaluđerske bare');
    expect(data.image[0]).toMatch(/^https:\/\/.+\/images\/house-01\.svg$/);
    expect(data.image[1]).toBe(house.photos[1]);
    expect(data).not.toHaveProperty('aggregateRating');
  });

  it('adds stars once there are approved reviews', () => {
    const reviews: Review[] = [
      { id: 'r1', houseId: 'h1', guestName: 'Ana', rating: 5, comment: 'Super', locale: 'sr', date: '2026-11-01' },
      { id: 'r2', houseId: 'h1', guestName: 'Marko', rating: 4, locale: 'sr', date: '2026-10-20' },
    ];
    const rating = summarize(reviews);
    expect(rating).toEqual({ average: 4.5, count: 2 });
    const data = houseStructuredData({ house: { ...house, rating }, ...base, reviews });
    expect(data).toMatchObject({ aggregateRating: { ratingValue: 4.5, reviewCount: 2 } });
    expect(data.review).toHaveLength(2);
  });

  it('no reviews → no rating summary', () => {
    expect(summarize([])).toBeUndefined();
  });
});
