import { useTranslations } from 'next-intl';
import { ArrowRight, Users, SlidersHorizontal, BadgeCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import OwnerApplicationForm from '@/components/OwnerApplicationForm';

const benefits = [
  { key: 'guests', icon: Users },
  { key: 'control', icon: SlidersHorizontal },
  { key: 'visit', icon: BadgeCheck },
] as const;

/** Homepage "Za vlasnike" block: short pitch + application form. Full details are on /za-vlasnike. */
export default function OwnerCTA() {
  const t = useTranslations('ownerCTA');

  return (
    <section id="list-your-house" className="py-16 md:py-20 bg-sand">
      <div className="container mx-auto px-4 grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
        {/* Left: why list with us */}
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-accent-dark">{t('eyebrow')}</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary text-balance">{t('title')}</h2>
          <p className="mt-4 text-text/75 leading-relaxed">{t('description')}</p>
          <ul className="mt-8 space-y-5">
            {benefits.map(({ key, icon: Icon }) => (
              <li key={key} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold text-primary">{t(`benefits.${key}.title`)}</h3>
                  <p className="text-sm text-text/70">{t(`benefits.${key}.text`)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/owners"
            className="mt-8 inline-flex items-center gap-2 font-semibold text-accent-dark hover:text-primary"
          >
            {t('moreLink')}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        {/* Right: the form, as a light card */}
        <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl">
          <OwnerApplicationForm />
        </div>
      </div>
    </section>
  );
}
