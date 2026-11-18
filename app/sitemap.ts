import { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { locales } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { getActiveHolidays, getCategories, getDestinations, getHouses } from '@/lib/data';

const baseUrl = site.url;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [houses, categories, destinations] = await Promise.all([getHouses(), getCategories(), getDestinations()]);

  const housePages = houses.flatMap((house) =>
    locales.map((locale) => ({
      // /kuce/vila-ribnica, /en/houses/vila-ribnica
      url:
        baseUrl +
        getPathname({ locale, href: { pathname: '/houses/[slug]', params: { slug: house.slug } } }),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  );

  return [
    ...locales.map((locale) => ({
      // vikendly.com (Serbian), vikendly.com/en
      url: locale === 'sr' ? baseUrl : `${baseUrl}/${locale}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 1,
    })),
    ...locales.map((locale) => ({
      // /pretraga, /en/search
      url: baseUrl + getPathname({ locale, href: '/search' }),
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    // Holiday offers while they are on (/praznici/nova-godina-2027)
    ...(await getActiveHolidays()).flatMap((holiday) =>
      locales.map((locale) => ({
        url: baseUrl + getPathname({ locale, href: { pathname: '/holidays/[slug]', params: { slug: holiday.slug } } }),
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }))
    ),
    // Category and destination pages that have houses (/pretraga?category=pool,
    // /en/search?destination=tara); empty ones are left out
    ...[
      ...categories
        .filter((c) => houses.some((h) => h.categoryIds.includes(c.id)))
        .map((c) => `?category=${c.slug}`),
      ...destinations
        .filter((d) => houses.some((h) => h.destinationId === d.id))
        .map((d) => `?destination=${d.slug}`),
    ].flatMap((query) =>
      locales.map((locale) => ({
        url: baseUrl + getPathname({ locale, href: '/search' }) + query,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    ),
    ...locales.map((locale) => ({
      // /destinacije, /en/destinations
      url: baseUrl + getPathname({ locale, href: '/destinations' }),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    // Owners, FAQ, contact and legal pages
    ...(['/owners', '/faq', '/contact', '/terms', '/privacy'] as const).flatMap((href) =>
      locales.map((locale) => ({
        url: baseUrl + getPathname({ locale, href }),
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: href === '/owners' ? 0.8 : href === '/faq' ? 0.5 : 0.3,
      }))
    ),
    ...housePages,
  ];
}
