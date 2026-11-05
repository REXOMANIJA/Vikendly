import { MetadataRoute } from 'next';
import { locales } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { getHouses } from '@/lib/data';

const baseUrl = 'https://vikendly.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const housePages = getHouses().flatMap((house) =>
    locales.map((locale) => ({
      // /sr/kuce/vila-ribnica, /en/houses/vila-ribnica
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
      url: `${baseUrl}/${locale}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 1,
    })),
    ...locales.map((locale) => ({
      url: `${baseUrl}/${locale}/search`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...housePages,
  ];
}
