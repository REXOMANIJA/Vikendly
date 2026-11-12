import { useTranslations } from 'next-intl';
import { ArrowRight, Compass, House, MapPin } from 'lucide-react';
import { Link } from '@/i18n/navigation';

/**
 * 404 inside the site: keeps the header, footer and language. Shown for a house that no
 * longer exists (notFound() in the house page) and for any unknown address ([...rest]).
 */
export default function NotFound() {
  const t = useTranslations('notFound');

  const links = [
    { href: '/' as const, label: t('home'), icon: House },
    { href: '/search' as const, label: t('houses'), icon: Compass },
    { href: '/destinations' as const, label: t('destinations'), icon: MapPin },
  ];

  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="mx-auto max-w-xl text-center">
        {/* The logo's little house, with a "lost" sun */}
        <svg viewBox="0 0 40 40" className="mx-auto size-24" aria-hidden>
          <rect width="40" height="40" rx="12" className="fill-primary" />
          <circle cx="12" cy="12" r="4.5" className="fill-accent" />
          <path d="M13 30V20.5L22 13l9 7.5V30z" className="fill-background" />
          <rect x="19.5" y="23" width="5" height="7" rx="1" className="fill-primary" />
        </svg>
        <p className="mt-6 font-serif text-6xl font-bold text-primary/20">404</p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-primary text-balance md:text-4xl">{t('title')}</h1>
        <p className="mt-4 text-lg leading-relaxed text-text/75">{t('text')}</p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="group flex h-full items-center justify-between gap-2 rounded-2xl bg-white p-4 text-left font-semibold text-primary ring-1 ring-primary/10 transition hover:-translate-y-0.5 hover:shadow-md sm:flex-col sm:items-start"
              >
                <Icon className="size-5 text-accent-dark" aria-hidden />
                <span className="flex flex-1 items-center justify-between gap-2 sm:w-full">
                  {label}
                  <ArrowRight className="size-4 opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
