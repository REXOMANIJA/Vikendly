import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Receipt, PartyPopper, BadgeCheck } from 'lucide-react';
import SearchBar from '@/components/SearchBar';

// What makes Vikendly different, shown right under the search box
const promises = [
  { key: 'totalPrice', icon: Receipt },
  { key: 'partyRules', icon: PartyPopper },
  { key: 'verified', icon: BadgeCheck },
] as const;

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section className="relative flex items-center min-h-[480px] md:min-h-[680px] py-14 md:py-24">
      <div className="absolute inset-0">
        <Image
          src="/images/hero.svg"
          alt={t('imageAlt')}
          fill
          unoptimized
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-primary/55" />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-4 text-balance">
            {t('headline')}
          </h1>
          <p className="text-lg md:text-2xl text-white/90 text-balance">{t('subheadline')}</p>
        </div>

        <div className="max-w-5xl mx-auto">
          <SearchBar />

          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-white">
            {promises.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-center sm:justify-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-sm md:text-base font-medium">{t(`promises.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
