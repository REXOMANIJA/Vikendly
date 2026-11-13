import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, AtSign, Camera, KeyRound, Mail, MessageCircle, Phone, Search } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { localizedAlternates } from '@/lib/seo';
import { phoneDigits, site } from '@/lib/site';

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { title: t('metaTitle'), description: t('intro'), alternates: localizedAlternates(locale, '/contact') };
}

const pill =
  'inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white';

export default async function ContactPage({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  const digits = phoneDigits(site.phone);
  const hasDirect = Boolean(site.email || site.phone || site.instagram);

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-serif text-4xl font-bold text-primary md:text-5xl">{t('title')}</h1>
        <p className="mt-3 text-lg text-text/75">{t('intro')}</p>

        {/* Direct contact (filled in lib/site.ts) */}
        {hasDirect ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {site.phone && (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-primary/10">
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text/50">
                  <Phone className="size-4" aria-hidden /> {t('phone')}
                </p>
                <a href={`tel:${digits}`} className="mt-2 block font-serif text-2xl font-bold text-primary hover:text-accent-dark">
                  {site.phone}
                </a>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`tel:${digits}`} className={pill}>
                    <Phone className="size-4" aria-hidden /> {t('call')}
                  </a>
                  <a href={`https://wa.me/${digits.replace('+', '')}`} target="_blank" rel="noopener noreferrer" className={pill}>
                    <MessageCircle className="size-4" aria-hidden /> {t('whatsapp')}
                  </a>
                  <a href={`viber://chat?number=${encodeURIComponent(digits)}`} className={pill}>
                    <MessageCircle className="size-4" aria-hidden /> {t('viber')}
                  </a>
                </div>
              </div>
            )}
            {site.email && (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-primary/10">
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text/50">
                  <Mail className="size-4" aria-hidden /> {t('email')}
                </p>
                <a href={`mailto:${site.email}`} className="mt-2 block break-all font-serif text-2xl font-bold text-primary hover:text-accent-dark">
                  {site.email}
                </a>
              </div>
            )}
            {site.instagram && (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-primary/10">
                <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-text/50">
                  <Camera className="size-4" aria-hidden /> {t('instagram')}
                </p>
                <a
                  href={`https://www.instagram.com/${site.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 font-serif text-2xl font-bold text-primary hover:text-accent-dark"
                >
                  <AtSign className="size-5" aria-hidden />
                  {site.instagram}
                </a>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl bg-sand px-5 py-4 text-text/80">{t('noDirect')}</p>
        )}

        {/* Where guests and owners should go */}
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 ring-1 ring-primary/10">
            <Search className="size-6 text-accent-dark" aria-hidden />
            <h2 className="mt-3 font-serif text-2xl font-bold text-primary">{t('guestsTitle')}</h2>
            <p className="mt-2 text-text/75">{t('guestsText')}</p>
            <Link href="/search" className="mt-4 inline-flex items-center gap-2 font-semibold text-accent-dark hover:text-primary">
              {t('guestsLink')} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="rounded-2xl bg-white p-6 ring-1 ring-primary/10">
            <KeyRound className="size-6 text-accent-dark" aria-hidden />
            <h2 className="mt-3 font-serif text-2xl font-bold text-primary">{t('ownersTitle')}</h2>
            <p className="mt-2 text-text/75">{t('ownersText')}</p>
            <Link href="/owners" className="mt-4 inline-flex items-center gap-2 font-semibold text-accent-dark hover:text-primary">
              {t('ownersLink')} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
