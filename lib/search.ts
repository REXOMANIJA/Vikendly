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

/** One house on the results map (built on the server, drawn in the browser) */
export type MapPoint = {
  id: string;
  name: string;
  /** e.g. "Zlatibor" */
  place?: string;
  lat: number;
  lng: number;
  /** House page address, with the search's dates and guests */
  href: string;
  /** Short price on the pin, e.g. "€63" */
  pin: string;
  /** Price line in the popup, e.g. "od €63 / noć" or "€252 ukupno" */
  price: string;
  /** Small photo for the popup (already resized) */
  photo?: string;
};

/** Sort options besides the default "recommended" order */
export const SORTS = ['price-asc', 'price-desc', 'capacity'] as const;
