export interface Amenity {
  id: string;
  name: string;
  icon?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Destination {
  id: string;
  name: string;
  slug: string;
  country: 'SR' | 'HR' | 'BA' | 'ME';
  /** Picture for the homepage tile ('/images/…' or a Supabase Storage URL) */
  imageUrl?: string;
}

/** A cheaper price for a smaller group: "up to maxGuests people" */
export interface PriceTier {
  maxGuests: number;
  weekdayPrice: number; // EUR per night
  weekendPrice: number; // EUR per night
}

/**
 * Party price level: a party with up to `maxGuests` people (once per stay). The weekend price
 * applies when the stay includes a Friday or Saturday night.
 */
export interface PartyPrice {
  maxGuests: number;
  weekdayPrice: number; // EUR
  weekendPrice: number; // EUR
}

export interface HouseRules {
  partiesAllowed: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  checkInTime: string;
  checkOutTime: string;
}

/**
 * A separately rented part of a listing (e.g. "Kuća sa balkonom"). Units share the listing's
 * photos, description and location, but have their own beds, prices, rules and party prices.
 */
export interface HouseUnit {
  id: string;
  name: string;
  /** People who can sleep there */
  capacity: number;
  /** People allowed at a party or gathering, if more than sleep */
  dayCapacity?: number;
  weekdayPrice: number;
  weekendPrice: number;
  /** Cheaper prices for smaller groups in this unit */
  tiers?: PriceTier[];
  /** Special prices for chosen nights in this unit (holidays) */
  specials?: SpecialPrice[];
  /** Rented only for parties/gatherings: no beds, priced by the number of people (partyPrices) */
  partyOnly?: boolean;
  rules: HouseRules;
  partyPrices: PartyPrice[];
}

/**
 * A special price per night for chosen nights (holidays), entered in admin (migration 0016).
 * Replaces the weekday/weekend and smaller-group price for those nights.
 */
export interface SpecialPrice {
  /** e.g. "Nova godina" */
  label?: string;
  /** First and last night it applies to, "yyyy-MM-dd" (31.12–1.1 = the nights of 31 Dec and 1 Jan) */
  firstNight: string;
  lastNight: string;
  /** EUR per night */
  price: number;
  /** A stay that includes any of these nights must be at least this long */
  minNights?: number;
  /**
   * Party-only space: the party size this price is for ("do 30 osoba"); `price` is then the
   * price of a party on these days, not a nightly price (migration 0017)
   */
  maxGuests?: number;
}

/** A holiday offer: shown on the homepage and on its own page while switched on (migration 0016) */
export interface Holiday {
  id: string;
  slug: string;
  name: LocalizedText;
  text: LocalizedText;
  /** Suggested stay, "yyyy-MM-dd" */
  checkIn: string;
  checkOut: string;
  imageUrl?: string;
  /** Houses the team confirmed are free for these days */
  houseIds: string[];
}

export interface PricingRule {
  /** Price for the whole house (up to `capacity` guests) */
  weekdayPrice: number; // EUR per night
  weekendPrice: number; // EUR per night (Friday and Saturday)
  minNights: number;
  /** Optional prices for smaller groups, sorted by maxGuests ascending */
  tiers?: PriceTier[];
  /** Special prices for chosen nights (holidays) */
  specials?: SpecialPrice[];
}

/** Text stored in both site languages (maps to sr/en columns in the database later) */
export interface LocalizedText {
  sr: string;
  en: string;
}

export interface House {
  id: string;
  /** URL name, e.g. "vila-ribnica" → /sr/kuce/vila-ribnica */
  slug: string;
  name: string;
  destinationId: string;
  categoryIds: string[];
  /** Guests who can stay overnight ("spava X osoba") */
  capacity: number;
  /** Guests allowed for a party or daytime gathering, if the owner allows more than sleep */
  dayCapacity?: number;
  bedrooms?: number;
  bathrooms?: number;
  pricing: PricingRule;
  amenities: string[];
  photos: string[];
  description: LocalizedText;
  rules: HouseRules;
  /** All house rules as written by the admin (migration 0014); missing = none written */
  rulesText?: LocalizedText;
  /** Distances and places nearby, one per line, shown under the map (migration 0015) */
  nearby?: LocalizedText;
  location: {
    address: string;
    lat?: number;
    lng?: number;
  };
  /** Day the Vikendly team visited and checked the house ("yyyy-MM-dd"); missing = not verified */
  verifiedAt?: string;
  /** Party price levels for a listing without units */
  partyPrices?: PartyPrice[];
  /** Separately rented units; empty or missing = the listing is rented as one */
  units?: HouseUnit[];
  /** Average of approved guest reviews; missing = no reviews yet */
  rating?: RatingSummary;
  // Owner contact is private (admin only, table house_owner_contacts); guests send booking requests instead.
}

/** A guest review, shown once the team approved it (table reviews, migration 0013) */
export interface Review {
  id: string;
  houseId: string;
  /** First name the guest gave */
  guestName: string;
  /** 1–5 stars */
  rating: number;
  comment?: string;
  /** Language the guest wrote in */
  locale: 'sr' | 'en';
  /** "yyyy-MM-dd" */
  date: string;
}

export interface RatingSummary {
  /** Average stars, one decimal */
  average: number;
  count: number;
}

export interface PriceCalculation {
  /** Price for the whole stay: nights × nightly price (no extra fees) */
  total: number;
  nights: number;
  weekdayNights: number;
  weekendNights: number;
  /** Nightly rates used for this group size */
  weekdayRate: number;
  weekendRate: number;
  /** Set when a smaller-group price was used ("up to N people") */
  tierMaxGuests?: number;
  /** Nights at a special (holiday) price, and what they cost; not in weekday/weekendNights */
  specialNights?: number;
  specialTotal?: number;
  /** Listing with units: the units this price is for */
  units?: string[];
  /** Event venue: the price of one party day (no nights) */
  partyDay?: boolean;
}
