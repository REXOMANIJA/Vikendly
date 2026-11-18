import { site } from '@/lib/site';
import { getLowestNightlyPrice, isVenue, maxGuestsOf } from '@/lib/pricing';
import type { House, Review } from '@/types';

const COUNTRY: Record<string, string> = { SR: 'RS', HR: 'HR', BA: 'BA', ME: 'ME' };

/** Photo address Google can open: Supabase URLs as they are, local files with the domain */
const absolute = (src: string) => (src.startsWith('http') ? src : site.url + src);

/**
 * Google "rich results" data for a house page (schema.org LodgingBusiness): name, photos, place,
 * map pin, "from" price and, once there are approved guest reviews, the stars.
 */
export function houseStructuredData({
  house,
  reviews,
  destinationName,
  country,
  url,
  description,
}: {
  house: House;
  reviews: Review[];
  destinationName?: string;
  country?: string;
  url: string;
  description: string;
}) {
  const from = getLowestNightlyPrice(house);
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: house.name,
    description,
    url,
    image: house.photos.slice(0, 8).map(absolute),
    address: {
      '@type': 'PostalAddress',
      ...(destinationName ? { addressLocality: destinationName } : {}),
      ...(country && COUNTRY[country] ? { addressCountry: COUNTRY[country] } : {}),
    },
    ...(house.location.lat != null && house.location.lng != null
      ? { geo: { '@type': 'GeoCoordinates', latitude: house.location.lat, longitude: house.location.lng } }
      : {}),
    ...(from > 0 ? { priceRange: `€${Math.round(from)}+` } : {}),
    ...(isVenue(house) ? {} : { numberOfRooms: house.bedrooms, petsAllowed: house.rules.petsAllowed }),
    maximumAttendeeCapacity: Math.max(maxGuestsOf(house), house.dayCapacity ?? 0) || undefined,
    amenityFeature: house.amenities.map((id) => ({ '@type': 'LocationFeatureSpecification', name: id, value: true })),
    ...(house.rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: house.rating.average,
            reviewCount: house.rating.count,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews.slice(0, 5).map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.guestName },
            datePublished: r.date,
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
            ...(r.comment ? { reviewBody: r.comment } : {}),
          })),
        }
      : {}),
  };
}

/**
 * Homepage data that tells Google the site's name ("Vikendly" above the search result instead of
 * "vikendly.com"), its logo and its Instagram. `home` is the page's own address
 * (vikendly.com or vikendly.com/en).
 */
export function siteStructuredData(home: string, language: string) {
  const root = `${site.url}/`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${root}#website`,
        name: 'Vikendly',
        alternateName: ['vikendly.com', 'Vikendly vikend kuće'],
        url: root,
        inLanguage: language,
        publisher: { '@id': `${root}#organization` },
      },
      {
        '@type': 'Organization',
        '@id': `${root}#organization`,
        name: 'Vikendly',
        url: root,
        // Square PNG made from app/apple-icon.tsx (Google needs at least 112×112)
        logo: `${site.url}/apple-icon`,
        ...(site.email ? { email: site.email } : {}),
        ...(site.phone ? { telephone: site.phone } : {}),
        ...(site.instagram ? { sameAs: [`https://www.instagram.com/${site.instagram}/`] } : {}),
      },
      { '@type': 'WebPage', '@id': `${home}#webpage`, url: home, isPartOf: { '@id': `${root}#website` } },
    ],
  };
}
