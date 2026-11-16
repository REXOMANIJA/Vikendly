import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

// Any address that doesn't match a page (e.g. /nesto-pogresno) shows the site's own 404
// (app/[locale]/not-found.tsx) instead of Next.js's default black page.

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'notFound' });
  return { title: t('metaTitle') };
}

export default async function CatchAll({ params }: { params: Params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  notFound();
}
