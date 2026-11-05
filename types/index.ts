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
}

/** A cheaper price for a smaller group: "up to maxGuests people" */
export interface PriceTier {
  maxGuests: number;
  weekdayPrice: number; // EUR per night
  weekendPrice: number; // EUR per night
}

export interface PricingRule {
  /** Price for the whole house (up to `capacity` guests) */
  weekdayPrice: number; // EUR per night
  weekendPrice: number; // EUR per night (Friday and Saturday)
  minNights: number;
  /** Optional prices for smaller groups, sorted by maxGuests ascending */
  tiers?: PriceTier[];
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
  rules: {
    partiesAllowed: boolean;
    petsAllowed: boolean;
    smokingAllowed: boolean;
    checkInTime: string;
    checkOutTime: string;
  };
  location: {
    address: string;
    lat?: number;
    lng?: number;
  };
  // Owner contact is private (admin only, table house_owner_contacts); guests send booking requests instead.
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
}
