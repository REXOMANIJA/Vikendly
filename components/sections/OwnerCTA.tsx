import { useTranslations } from 'next-intl';
import { ArrowRight, BadgeCheck, KeyRound, SlidersHorizontal, Users } from 'lucide-react';
import { Link } from '@/i18n/navigation';

const benefits = [
  { key: 'guests', icon: Users },
  { key: 'control', icon: SlidersHorizontal },
  { key: 'visit', icon: BadgeCheck },
] as const;

/**
 * Homepage "Za vlasnike": a short banner that leads to /za-vlasnike. The homepage is for guests,
 * so the full application form lives only on the owners page.
 */
export default function OwnerCTA() {
  const t = useTranslations('ownerCTA');

  return (
    <section id="list-your-house" className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-8 text-white shadow-lg md:px-12 md:py-10">
          {/* Soft decorative circle, keeps the banner from looking flat */}
          <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-accent/20 blur-2xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-10">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
                <KeyRound className="size-4" aria-hidden />
                {t('eyebrow')}
              </p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-balance md:text-4xl">{t('bannerTitle')}</h2>
              <p className="mt-3 leading-relaxed text-white/80">{t('bannerText')}</p>
              <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/90">
                {benefits.map(({ key, icon: Icon }) => (
                  <li key={key} className="inline-flex items-center gap-1.5">
                    <Icon className="size-4 text-accent" aria-hidden />
                    {t(`benefits.${key}.title`)}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/owners"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent-dark px-6 py-3.5 font-semibold text-white transition-colors hover:bg-white hover:text-primary"
            >
              {t('bannerButton')}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
