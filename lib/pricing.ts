import { House, PriceCalculation, PriceTier } from '@/types';

// Weekend nights: Friday (5) and Saturday (6)
const WEEKEND_DAYS = [5, 6];
const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Nightly rates for a group of `guests`: the smallest group price that fits,
 * otherwise the whole-house price.
 */
export function getNightlyRates(
  house: House,
  guests: number
): { weekdayPrice: number; weekendPrice: number; tier?: PriceTier } {
  const tier = [...(house.pricing.tiers ?? [])]
    .sort((a, b) => a.maxGuests - b.maxGuests)
    .find((t) => guests <= t.maxGuests && t.maxGuests < house.capacity);
  if (tier) return { weekdayPrice: tier.weekdayPrice, weekendPrice: tier.weekendPrice, tier };
  return { weekdayPrice: house.pricing.weekdayPrice, weekendPrice: house.pricing.weekendPrice };
}

/** Lowest weekday price of any group size ("od €80 / noć") */
export function getLowestNightlyPrice(house: House): number {
  return Math.min(house.pricing.weekdayPrice, ...(house.pricing.tiers ?? []).map((t) => t.weekdayPrice));
}

/** Number of nights between two dates (safe across clock changes) */
export function countNights(checkIn: Date, checkOut: Date): number {
  // Round, not ceil: across a clock change a 2-night stay is 47 or 49 hours long
  return Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
}

/** Price for a stay: each night at the weekday or weekend rate for this group size. No extra fees. */
export function calculateTotalPrice(house: House, checkIn: Date, checkOut: Date, guests: number): PriceCalculation {
  const nights = countNights(checkIn, checkOut);
  const { weekdayPrice, weekendPrice, tier } = getNightlyRates(house, guests);

  let weekdayNights = 0;
  let weekendNights = 0;
  const currentDate = new Date(checkIn);
  for (let i = 0; i < Math.max(nights, 0); i++) {
    if (WEEKEND_DAYS.includes(currentDate.getDay())) weekendNights++;
    else weekdayNights++;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    total: weekdayNights * weekdayPrice + weekendNights * weekendPrice,
    nights: Math.max(nights, 0),
    weekdayNights,
    weekendNights,
    weekdayRate: weekdayPrice,
    weekendRate: weekendPrice,
    tierMaxGuests: tier?.maxGuests,
  };
}
