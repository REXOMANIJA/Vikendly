import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Receipt, Users, Volume2, BadgeCheck, MessageCircle } from 'lucide-react';

const features = [
  { key: 'totalPrice', icon: Receipt },
  { key: 'pricePerPerson', icon: Users },
  { key: 'noiseRules', icon: Volume2 },
  { key: 'verified', icon: BadgeCheck },
  { key: 'directContact', icon: MessageCircle },
] as const;

export default function WhyVikendly() {
  const t = useTranslations('whyVikendly');

  return (
    <section id="why-vikendly" className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4 grid gap-10 lg:grid-cols-12 lg:gap-16 items-center">
        {/* Left: the pitch */}
        <div className="lg:col-span-5">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-accent">{t('eyebrow')}</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary text-balance">{t('title')}</h2>
          <p className="mt-4 text-text/70 leading-relaxed">{t('intro')}</p>
          <div className="relative mt-8 hidden aspect-[4/3] overflow-hidden rounded-2xl lg:block">
            <Image src="/images/house-04.svg" alt="" fill unoptimized className="object-cover" />
          </div>
        </div>

        {/* Right: the five promises */}
        <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:col-span-7">
          {features.map(({ key, icon: Icon }) => (
            <li key={key} className="flex gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <Icon className="size-6" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-lg text-primary">{t(`${key}.title`)}</h3>
                <p className="mt-1 text-sm text-text/70 leading-relaxed">{t(`${key}.text`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
