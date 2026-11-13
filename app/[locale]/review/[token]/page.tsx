import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CircleCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getReviewInvite } from '@/lib/data';
import { formatStay, parseDateParam } from '@/lib/dates';
import ReviewForm from '@/components/ReviewForm';

type Params = Promise<{ locale: string; token: string }>;

// Every link is different and private: never cached, never shown in Google
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'review' });
  return { title: t('metaTitle'), robots: { index: false, follow: false } };
}

export default async function ReviewPage({ params }: { params: Params }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const invite = await getReviewInvite(token);
  if (!invite) notFound();
  const t = await getTranslations('review');
  const checkIn = parseDateParam(invite.checkIn);
  const checkOut = parseDateParam(invite.checkOut);

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent-dark">{t('eyebrow')}</p>
        <h1 className="mt-1 font-serif text-3xl font-bold text-primary md:text-4xl">
          {t('title', { house: invite.houseName })}
        </h1>
        {checkIn && checkOut && <p className="mt-2 text-text/70">{formatStay(checkIn, checkOut, locale)}</p>}

        {invite.status === 'invited' ? (
          <ReviewForm token={token} initialName={invite.guestName} />
        ) : (
          <div className="mt-8 rounded-2xl bg-white p-6 text-center ring-1 ring-primary/10">
            <CircleCheck className="mx-auto size-10 text-primary" aria-hidden />
            <p className="mt-3 font-serif text-xl font-bold text-primary">{t('alreadyTitle')}</p>
            <p className="mt-1 text-text/75">{t('alreadyText')}</p>
          </div>
        )}

        <Link
          href={{ pathname: '/houses/[slug]', params: { slug: invite.houseSlug } }}
          className="mt-8 inline-block font-semibold text-accent-dark hover:text-primary"
        >
          {t('houseLink', { house: invite.houseName })}
        </Link>
      </div>
    </div>
  );
}
