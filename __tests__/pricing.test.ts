import { calculateTotalPrice } from '@/lib/pricing';
import { House, Destination } from '@/types';

describe('calculateTotalPrice', () => {
  const mockHouse: House = {
    id: 'test-house',
    name: 'Test House',
    destinationId: 'test-dest',
    categoryIds: [],
    capacity: 4,
    bedrooms: 2,
    bathrooms: 1,
    pricing: {
      weekdayPrice: 80,
      weekendPrice: 120,
      cleaningFee: 50,
      minNights: 2,
    },
    amenities: [],
    photos: [],
    slug: 'test-house',
    description: { sr: '', en: '' },
    rules: {
      partiesAllowed: false,
      petsAllowed: false,
      smokingAllowed: false,
      checkInTime: '15:00',
      checkOutTime: '11:00',
    },
    location: { address: '' },
    contact: {},
  };

  const mockDestination: Destination = {
    id: 'test-dest',
    name: 'Test Destination',
    slug: 'test-dest',
    country: 'SR',
    touristTaxPerPersonPerNight: 1.5,
  };

  it('calculates price for weekday nights only', () => {
    const checkIn = new Date('2026-11-10'); // Monday
    const checkOut = new Date('2026-11-13'); // Thursday (3 nights)
    const guests = 4;

    const result = calculateTotalPrice(mockHouse, checkIn, checkOut, guests, mockDestination);

    expect(result.nights).toBe(3);
    expect(result.weekdayNights).toBe(3);
    expect(result.weekendNights).toBe(0);
    expect(result.nightlyTotal).toBe(240); // 3 * 80
    expect(result.cleaningFee).toBe(50);
    expect(result.touristTax).toBe(18); // 1.5 * 4 * 3
    expect(result.total).toBe(308); // 240 + 50 + 18
  });

  it('calculates price for weekend nights only', () => {
    const checkIn = new Date('2026-11-13'); // Friday
    const checkOut = new Date('2026-11-15'); // Sunday (2 nights)
    const guests = 4;

    const result = calculateTotalPrice(mockHouse, checkIn, checkOut, guests, mockDestination);

    expect(result.nights).toBe(2);
    expect(result.weekdayNights).toBe(0);
    expect(result.weekendNights).toBe(2);
    expect(result.nightlyTotal).toBe(240); // 2 * 120
    expect(result.cleaningFee).toBe(50);
    expect(result.touristTax).toBe(12); // 1.5 * 4 * 2
    expect(result.total).toBe(302); // 240 + 50 + 12
  });

  it('calculates price for mixed weekday and weekend nights correctly', () => {
    const checkIn = new Date('2026-11-12'); // Wednesday
    const checkOut = new Date('2026-11-16'); // Sunday (4 nights)
    const guests = 4;

    const result = calculateTotalPrice(mockHouse, checkIn, checkOut, guests, mockDestination);

    expect(result.nights).toBe(4);
    expect(result.weekdayNights).toBe(2); // Wed, Thu
    expect(result.weekendNights).toBe(2); // Fri, Sat
    expect(result.nightlyTotal).toBe(400); // 2 * 80 + 2 * 120
    expect(result.cleaningFee).toBe(50);
    expect(result.touristTax).toBe(24); // 1.5 * 4 * 4
    expect(result.total).toBe(474); // 400 + 50 + 24
  });

  it('returns zero for invalid date range', () => {
    const checkIn = new Date('2026-11-15');
    const checkOut = new Date('2026-11-10'); // Before check-in
    const guests = 4;

    const result = calculateTotalPrice(mockHouse, checkIn, checkOut, guests, mockDestination);

    expect(result.total).toBe(0);
    expect(result.nights).toBe(0);
  });

  it('uses default tourist tax when destination not provided', () => {
    const checkIn = new Date('2026-11-10');
    const checkOut = new Date('2026-11-13');
    const guests = 4;

    const result = calculateTotalPrice(mockHouse, checkIn, checkOut, guests);

    expect(result.touristTax).toBe(18); // 1.5 * 4 * 3 (default tax)
  });
});
