/** Search address parameters, shared by the results page (server) and the filter bar (browser) */
export type SearchValues = {
  q?: string;
  destination?: string;
  category?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  budget?: string;
  verified?: string;
  sort?: string;
};

/** Sort options besides the default "recommended" order */
export const SORTS = ['price-asc', 'price-desc', 'capacity'] as const;
