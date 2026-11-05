'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';

function Switcher({ variant }: { variant: 'light' | 'dark' }) {
  const t = useTranslations('languageSwitcher');
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const switchLocale = (newLocale: Locale) => {
    const query = Object.fromEntries(searchParams.entries());
    // Keeps the current page (incl. its [slug]) and search filters; only the language changes,
    // e.g. /sr/kuce/vila-ribnica → /en/houses/vila-ribnica
    router.replace(
      // @ts-expect-error -- pathname and params always belong together here
      { pathname, params, query },
      { locale: newLocale }
    );
  };

  const inactive =
    variant === 'dark'
      ? 'text-white/80 hover:bg-white/10'
      : 'text-text hover:bg-primary/10';
  const active = variant === 'dark' ? 'bg-white text-primary' : 'bg-primary text-white';

  return (
    <div className="flex gap-1" role="group" aria-label={t('label')}>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => switchLocale(loc)}
          aria-pressed={locale === loc}
          aria-label={t(loc)}
          className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${
            locale === loc ? active : inactive
          }`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function LanguageSwitcher({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  // useSearchParams needs a Suspense boundary so static pages can still prerender
  return (
    <Suspense fallback={null}>
      <Switcher variant={variant} />
    </Suspense>
  );
}
