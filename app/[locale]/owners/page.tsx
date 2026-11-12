import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  BadgeCheck,
  Camera,
  Check,
  ChevronDown,
  ClipboardCheck,
  Handshake,
  PhoneCall,
  SlidersHorizontal,
  Sparkles,
  Users,
} from 'lucide-react';
import OwnerApplicationForm from '@/components/OwnerApplicationForm';
import { localizedAlternates } from '@/lib/seo';

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'owners' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: localizedAlternates(locale, '/owners'),
    openGraph: { title: t('metaTitle'), description: t('metaDescription'), images: ['/images/categories/family.jpg'] },
  };
}

const steps = [
  { key: 'apply', icon: ClipboardCheck },
  { key: 'visit', icon: Handshake },
  { key: 'publish', icon: Camera },
  { key: 'guests', icon: PhoneCall },
] as const;

const benefits = [
  { key: 'guests', icon: Users },
  { key: 'control', icon: SlidersHorizontal },
  { key: 'verified', icon: BadgeCheck },
  { key: 'noHassle', icon: Sparkles },
] as const;

const pricePoints = ['free', 'commission', 'noLockIn'] as const;
const needs = ['photos', 'capacity', 'prices', 'rules', 'phone'] as const;
const faqs = ['exclusive', 'payment', 'visit', 'change', 'remove'] as const;

/** /za-vlasnike: everything an owner needs to decide, then the application form. */
export default async function OwnersPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('owners');

  return (
    <>
      {/* Intro */}
      <section className="bg-sand">
        <div className="container mx-auto grid items-center gap-10 px-4 py-12 md:py-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-accent-dark">{t('eyebrow')}</p>
            <h1 className="font-serif text-4xl font-bold text-primary text-balance md:text-5xl">{t('title')}</h1>
            <p className="mt-5 text-lg leading-relaxed text-text/75">{t('intro')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#prijava"
                className="rounded-full bg-accent-dark px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-primary"
              >
                {t('ctaApply')}
              </a>
              <a
                href="#kako-funkcionise"
                className="rounded-full bg-white px-6 py-3 font-semibold text-primary ring-1 ring-primary/15 transition-colors hover:bg-primary hover:text-white"
              >
                {t('ctaHow')}
              </a>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl">
            <Image
              src="/images/categories/family.jpg"
              alt=""
              fill
              priority
              quality={70}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="kako-funkcionise" className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">{t('stepsTitle')}</h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ key, icon: Icon }, i) => (
              <li key={key} className="relative rounded-2xl bg-white p-6 ring-1 ring-primary/10">
                <span className="absolute right-5 top-4 font-serif text-4xl font-bold text-primary/10">{i + 1}</span>
                <span className="flex size-12 items-center justify-center rounded-xl bg-accent/15 text-accent-dark">
                  <Icon className="size-6" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-primary">{t(`steps.${key}.title`)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-text/70">{t(`steps.${key}.text`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Benefits + price */}
      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">{t('benefitsTitle')}</h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2">
              {benefits.map(({ key, icon: Icon }) => (
                <li key={key} className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background text-primary">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-semibold text-primary">{t(`benefits.${key}.title`)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-text/70">{t(`benefits.${key}.text`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-3xl bg-primary p-7 text-white shadow-xl md:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">{t('priceTitle')}</h2>
              <p className="mt-2 font-serif text-3xl font-bold">{t('priceLead')}</p>
              <p className="mt-3 leading-relaxed text-white/85">{t('priceText')}</p>
              <ul className="mt-6 space-y-3">
                {pricePoints.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent">
                      <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden />
                    </span>
                    {t(`pricePoints.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What we need + FAQ */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">{t('needTitle')}</h2>
            <ul className="mt-8 space-y-3">
              {needs.map((key) => (
                <li key={key} className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-primary/10">
                  <Check className="mt-0.5 size-5 shrink-0 text-accent-dark" aria-hidden />
                  <span className="text-text/85">{t(`need.${key}`)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">{t('faqTitle')}</h2>
            <div className="mt-8 space-y-3">
              {faqs.map((key) => (
                <details key={key} className="group rounded-xl bg-white ring-1 ring-primary/10 open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-semibold text-primary [&::-webkit-details-marker]:hidden">
                    {t(`faq.${key}.q`)}
                    <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="px-4 pb-4 leading-relaxed text-text/75">{t(`faq.${key}.a`)}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="prijava" className="scroll-mt-20 bg-sand py-16 md:py-20">
        <div className="container mx-auto grid items-start gap-10 px-4 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-serif text-3xl font-bold text-primary md:text-4xl">{t('formTitle')}</h2>
            <p className="mt-4 text-lg leading-relaxed text-text/75">{t('formText')}</p>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-xl md:p-8">
            <OwnerApplicationForm idPrefix="owners-page" />
          </div>
        </div>
      </section>
    </>
  );
}
