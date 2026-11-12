import type { House, HouseRules, PartyPrice, PriceCalculation, PriceTier, PricingRule } from '@/types';

// Weekend nights: Friday (5) and Saturday (6)
const WEEKEND_DAYS = [5, 6];
const DAY_MS = 1000 * 60 * 60 * 24;

/** Id used for a listing that is rented as one (it has no units) */
export const WHOLE_HOUSE = 'whole';

/**
 * Something a guest can book: one unit of a listing, or the whole listing when it has no units.
 * The booking box, the request form and the server all work with this, so listings with and
 * without units follow the same rules.
 */
export interface Bookable {
  id: string;
  /** Unit name; empty for a whole house */
  name: string;
  /** Rented only for parties: no beds, priced by the number of people */
  partyOnly: boolean;
  capacity: number;
  dayCapacity?: number;
  pricing: PricingRule;
  rules: HouseRules;
  partyPrices: PartyPrice[];
}

export const hasUnits = (house: House) => (house.units?.length ?? 0) > 0;

export function getBookables(house: House): Bookable[] {
  if (!hasUnits(house)) {
    return [
      {
        id: WHOLE_HOUSE,
        name: '',
        partyOnly: false,
        capacity: house.capacity,
        dayCapacity: house.dayCapacity,
        pricing: house.pricing,
        rules: house.rules,
        partyPrices: [],
      },
    ];
  }
  return house.units!.map((u) => ({
    id: u.id,
    name: u.name,
    partyOnly: u.partyOnly === true,
    capacity: u.capacity,
    dayCapacity: u.dayCapacity,
    // The minimum stay is set for the whole listing
    pricing: { weekdayPrice: u.weekdayPrice, weekendPrice: u.weekendPrice, minNights: house.pricing.minNights, tiers: u.tiers ?? [] },
    rules: u.rules,
    // Party prices only for party-only spaces
    partyPrices: u.partyOnly ? u.partyPrices : [],
  }));
}

/**
 * Nightly rates for a group of `guests`: the smallest group price that fits,
 * otherwise the whole-house price.
 */
function ratesFor(pricing: PricingRule, capacity: number, guests: number) {
  const tier = [...(pricing.tiers ?? [])]
    .sort((a, b) => a.maxGuests - b.maxGuests)
    .find((t) => guests <= t.maxGuests && t.maxGuests < capacity);
  if (tier) return { weekdayPrice: tier.weekdayPrice, weekendPrice: tier.weekendPrice, tier };
  return { weekdayPrice: pricing.weekdayPrice, weekendPrice: pricing.weekendPrice, tier: undefined as PriceTier | undefined };
}

export function getNightlyRates(
  house: House,
  guests: number
): { weekdayPrice: number; weekendPrice: number; tier?: PriceTier } {
  return ratesFor(house.pricing, house.capacity, guests);
}

/** Lowest weekday price of any group size or unit ("od €80 / noć") */
export function getLowestNightlyPrice(house: House): number {
  const withBeds = (house.units ?? []).filter((u) => !u.partyOnly);
  if (withBeds.length > 0) {
    return Math.min(...withBeds.flatMap((u) => [u.weekdayPrice, ...(u.tiers ?? []).map((t) => t.weekdayPrice)]));
  }
  return Math.min(house.pricing.weekdayPrice, ...(house.pricing.tiers ?? []).map((t) => t.weekdayPrice));
}

/** Number of nights between two dates (safe across clock changes) */
export function countNights(checkIn: Date, checkOut: Date): number {
  // Round, not ceil: across a clock change a 2-night stay is 47 or 49 hours long
  return Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
}

function priceNights(pricing: PricingRule, capacity: number, checkIn: Date, checkOut: Date, guests: number): PriceCalculation {
  const nights = countNights(checkIn, checkOut);
  const { weekdayPrice, weekendPrice, tier } = ratesFor(pricing, capacity, guests);

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

/** Price for a stay: each night at the weekday or weekend rate for this group size. No extra fees. */
export function calculateTotalPrice(house: House, checkIn: Date, checkOut: Date, guests: number): PriceCalculation {
  return priceNights(house.pricing, house.capacity, checkIn, checkOut, guests);
}

/** Overnight price for one unit (or the whole house) */
export function calculateBookablePrice(b: Bookable, checkIn: Date, checkOut: Date, guests: number): PriceCalculation {
  return priceNights(b.pricing, b.capacity, checkIn, checkOut, guests);
}

/**
 * Most people allowed at once: for a party-only space its party limit (or its biggest price
 * level), for a place with beds the daytime limit (at least as many as sleep there).
 */
export const partyLimit = (b: Bookable) =>
  b.partyOnly
    ? b.dayCapacity ?? Math.max(0, ...b.partyPrices.map((p) => p.maxGuests))
    : Math.max(b.dayCapacity ?? b.capacity, b.capacity);

/** Party price days: Friday and Saturday count as weekend */
export const isWeekendDay = (date: Date) => WEEKEND_DAYS.includes(date.getDay());

/**
 * Party price for `people` in total: the smallest price level that fits, at the weekend price
 * when the party is on a Friday or Saturday (`weekend`), otherwise the weekday price.
 * `null` = parties are allowed but the owner set no price for this size (agreed in person).
 */
export function getPartyPrice(b: Bookable, people: number, weekend: boolean): number | null {
  const level = b.partyPrices.find((p) => people <= p.maxGuests);
  if (!level) return null;
  return weekend ? level.weekendPrice : level.weekdayPrice;
}

/**
 * Price shown on cards and in search for a stay. A listing with units shows the cheapest
 * combination of units with room for everyone (all units if even that is too small).
 */
export function quoteStay(house: House, checkIn: Date, checkOut: Date, guests: number): PriceCalculation {
  if (!hasUnits(house)) return calculateTotalPrice(house, checkIn, checkOut, guests);

  // Only places with beds count for an overnight stay
  const units = getBookables(house).filter((u) => !u.partyOnly);
  // Price a set of units for the group: fill the biggest units first, each priced for the
  // people in it (so a unit's smaller-group price applies when it isn't full)
  const priceSet = (picked: number[]) => {
    let left = Math.max(guests, 1);
    return [...picked]
      .sort((a, b) => units[b].capacity - units[a].capacity)
      .map((i) => {
        const here = Math.max(1, Math.min(units[i].capacity, left));
        left -= here;
        return { i, price: calculateBookablePrice(units[i], checkIn, checkOut, here) };
      });
  };
  const all = units.map((_, i) => i);
  let best = priceSet(all);
  let bestTotal = best.reduce((sum, p) => sum + p.price.total, 0);
  // A listing has a handful of units, so trying every combination is instant
  if (units.length <= 12) {
    for (let mask = 1; mask < 1 << units.length; mask++) {
      const picked = all.filter((i) => mask & (1 << i));
      if (picked.reduce((sum, i) => sum + units[i].capacity, 0) < guests) continue;
      const priced = priceSet(picked);
      const total = priced.reduce((sum, p) => sum + p.price.total, 0);
      if (total < bestTotal) {
        best = priced;
        bestTotal = total;
      }
    }
  }
  const first = best[0].price;
  return {
    total: bestTotal,
    nights: first.nights,
    weekdayNights: first.weekdayNights,
    weekendNights: first.weekendNights,
    weekdayRate: best.reduce((sum, p) => sum + p.price.weekdayRate, 0),
    weekendRate: best.reduce((sum, p) => sum + p.price.weekendRate, 0),
    // In the order the units are listed
    units: best.map((p) => p.i).sort((a, b) => a - b).map((i) => units[i].name),
  };
}
