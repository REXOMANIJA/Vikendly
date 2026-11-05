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
  touristTaxPerPersonPerNight: number; // EUR
}

export interface PricingRule {
  weekdayPrice: number; // EUR per night
  weekendPrice: number; // EUR per night
  cleaningFee: number; // EUR
  minNights: number;
}

export interface House {
  id: string;
  name: string;
  destinationId: string;
  categoryIds: string[];
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  pricing: PricingRule;
  amenities: string[];
  photos: string[];
  description: string;
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
  contact: {
    viber?: string;
    whatsapp?: string;
    phone?: string;
  };
}

export interface PriceCalculation {
  nightlyTotal: number;
  cleaningFee: number;
  touristTax: number;
  total: number;
  nights: number;
  weekdayNights: number;
  weekendNights: number;
}
