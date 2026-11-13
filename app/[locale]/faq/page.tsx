import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, ChevronDown, MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { localizedAlternates } from '@/lib/seo';

type Params = Promise<{ locale: string }>;

/** Order of the questions on the page (texts in locales/…/common.json → faq.items) */
const questions = [
  'howToBook',
  'payment',
  'deposit',
  'cancellation',
  'price',
  'checkIn',
  'pets',
  'parties',
  'verified',
] as const;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'faq' });
  return { title: t('metaTitle'), description: t('metaDescription'), alternates: localizedAlternates(locale, '/faq') };
}

export default async function FaqPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('faq');

  // Lets Google show the questions directly in search results
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((key) => ({
      '@type': 'Question',
      name: t(`items.${key}.q`),
      acceptedAnswer: { '@type': 'Answer', text: t(`items.${key}.a`) },
    })),
  };

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent-dark">{t('eyebrow')}</p>
        <h1 className="mt-1 font-serif text-4xl font-bold text-primary md:text-5xl">{t('title')}</h1>
        <p className="mt-3 text-lg text-text/75">{t('intro')}</p>

        <div className="mt-8 space-y-3">
          {questions.map((key, i) => (
            <details
              key={key}
              open={i === 0}
              className="group rounded-2xl bg-white ring-1 ring-primary/10 open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 font-semibold text-primary marker:hidden hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-accent-dark [&::-webkit-details-marker]:hidden">
                <span className="text-lg">{t(`items.${key}.q`)}</span>
                <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="px-5 pb-5 leading-relaxed text-text/80">{t(`items.${key}.a`)}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 rounded-2xl bg-sand p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <MessageCircle className="mt-1 size-6 shrink-0 text-accent-dark" aria-hidden />
            <div>
              <h2 className="font-serif text-xl font-bold text-primary">{t('moreTitle')}</h2>
              <p className="text-text/75">{t('moreText')}</p>
            </div>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-white hover:bg-accent-dark"
          >
            {t('moreLink')} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
