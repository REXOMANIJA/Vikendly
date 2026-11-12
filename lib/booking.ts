import type { House, PriceCalculation } from '@/types';
import { calculateBookablePrice, countNights, getBookables, getPartyPrice, isWeekendDay, partyLimit, type Bookable } from '@/lib/pricing';

/**
 * What a guest asks for: one line per unit (or one line for a whole house), each with the
 * number of people sleeping there and, optionally, how many people come to a party in total.
 * Used by the booking box (browser) and again by the server, so the saved price always
 * matches what the guest saw.
 */
export type Selection = {
  /** Unit id, or WHOLE_HOUSE for a listing without units */
  id: string;
  /** People sleeping there (0 for a party-only space) */
  guests: number;
  /** People at a party-only space (0 for places with beds) */
  partyGuests: number;
};

export type LineQuote = {
  bookable: Bookable;
  guests: number;
  partyGuests: number;
  stay: PriceCalculation;
  /** Party price; null = parties allowed but price agreed in person; 0 = no party */
  party: number | null;
  /** stay + party (party counted as 0 when agreed in person) */
  total: number;
};

export type SelectionProblem =
  | { code: 'none' }
  | { code: 'unknown' }
  | { code: 'guests'; unit: string; max: number }
  | { code: 'partyNotAllowed'; unit: string }
  | { code: 'partyTooMany'; unit: string; max: number }
  | { code: 'partyTooFew'; unit: string; min: number };

/** First thing wrong with a selection, or null when it can be priced and sent */
export function checkSelection(house: House, selections: Selection[]): SelectionProblem | null {
  if (selections.length === 0) return { code: 'none' };
  const bookables = getBookables(house);
  const seen = new Set<string>();
  for (const s of selections) {
    const b = bookables.find((x) => x.id === s.id);
    if (!b || seen.has(s.id)) return { code: 'unknown' };
    seen.add(s.id);
    if (!Number.isInteger(s.guests) || !Number.isInteger(s.partyGuests) || s.guests < 0 || s.partyGuests < 0) {
      return { code: 'unknown' };
    }
    if (b.partyOnly) {
      // A party-only space: how many people come, nobody sleeps there
      if (s.partyGuests < 1) return { code: 'partyTooFew', unit: b.name, min: 1 };
      if (s.partyGuests > partyLimit(b)) return { code: 'partyTooMany', unit: b.name, max: partyLimit(b) };
    } else {
      if (s.guests < 1 || s.guests > b.capacity) return { code: 'guests', unit: b.name, max: b.capacity };
      // Places with beds have no party option (only a daytime limit, shown as information)
      if (s.partyGuests > 0) return { code: 'partyNotAllowed', unit: b.name };
    }
  }
  return null;
}

/** Price of each line and of everything together. Call checkSelection first. */
export function quoteSelection(house: House, checkIn: Date, checkOut: Date, selections: Selection[]) {
  const bookables = getBookables(house);
  const lines: LineQuote[] = selections.map((s) => {
    const bookable = bookables.find((b) => b.id === s.id)!;
    if (bookable.partyOnly) {
      // Party day = the first day; Friday and Saturday parties pay the weekend price
      const nights = countNights(checkIn, checkOut);
      const stay = { total: 0, nights, weekdayNights: 0, weekendNights: 0, weekdayRate: 0, weekendRate: 0 };
      const party = getPartyPrice(bookable, s.partyGuests, isWeekendDay(checkIn));
      return { bookable, guests: 0, partyGuests: s.partyGuests, stay, party, total: party ?? 0 };
    }
    const stay = calculateBookablePrice(bookable, checkIn, checkOut, s.guests);
    return { bookable, guests: s.guests, partyGuests: 0, stay, party: 0, total: stay.total };
  });
  return {
    lines,
    /** Only party-only spaces: a one-day booking, no minimum stay */
    partyOnly: lines.length > 0 && lines.every((l) => l.bookable.partyOnly),
    nights: lines[0]?.stay.nights ?? 0,
    guests: lines.reduce((sum, l) => sum + l.guests, 0),
    partyGuests: lines.reduce((sum, l) => sum + l.partyGuests, 0),
    total: lines.reduce((sum, l) => sum + l.total, 0),
    /** Some party price still has to be agreed in person */
    partyOnRequest: lines.some((l) => l.party === null),
  };
}

/**
 * A starting selection for a group of `guests` (e.g. coming from search): the whole house,
 * or the units that fit the group, filled in order.
 */
export function suggestSelection(house: House, guests: number, unitNames?: string[]): Selection[] {
  const bookables = getBookables(house);
  const withBeds = bookables.filter((b) => !b.partyOnly);
  const picked = unitNames?.length ? withBeds.filter((b) => unitNames.includes(b.name)) : withBeds.slice(0, 1);
  let left = Math.max(guests, 1);
  return picked.map((b) => {
    const here = Math.min(b.capacity, Math.max(left, 1));
    left -= here;
    return { id: b.id, guests: here, partyGuests: 0 };
  });
}
