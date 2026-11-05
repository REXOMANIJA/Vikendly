'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { submitOwnerApplication } from '@/lib/actions';
import { CircleCheck, Users, SlidersHorizontal, BadgeCheck } from 'lucide-react';

const benefits = [
  { key: 'guests', icon: Users },
  { key: 'control', icon: SlidersHorizontal },
  { key: 'visit', icon: BadgeCheck },
] as const;

const inputClass =
  'w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent';
const labelClass = 'block text-sm font-medium text-text mb-1.5';

export default function OwnerCTA() {
  const t = useTranslations('ownerCTA');
  const locale = useLocale();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'invalid' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    try {
      // Saved to Supabase → table owner_applications (see lib/actions.ts)
      const result = await submitOwnerApplication(new FormData(e.currentTarget));
      setStatus(result.ok ? 'sent' : result.error === 'invalid' ? 'invalid' : 'error');
    } catch {
      setStatus('error');
    }
  };
  const submitted = status === 'sent';

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
        </div>

        {/* Right: the form, as a light card */}
        <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl">
          {submitted ? (
            <div className="py-10 text-center" role="status">
              <CircleCheck className="mx-auto mb-4 size-14 text-accent-dark" strokeWidth={1.5} aria-hidden />
              <p className="font-serif text-2xl font-bold text-primary">{t('form.success')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="font-serif text-2xl font-bold text-primary mb-2">{t('form.heading')}</p>
              <input type="hidden" name="locale" value={locale} />
              {/* Spam trap: hidden from people, bots fill it in */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
                <label htmlFor="owner-website">Website</label>
                <input id="owner-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="owner-name" className={labelClass}>
                    {t('form.name')}
                  </label>
                  <input
                    id="owner-name"
                    type="text"
                    required
                    autoComplete="name"
                    name="name"
                    minLength={2}
                    maxLength={120}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="owner-phone" className={labelClass}>
                    {t('form.phone')}
                  </label>
                  <input
                    id="owner-phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    name="phone"
                    minLength={6}
                    maxLength={40}
                    placeholder="+381 6x xxx xxxx"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="owner-location" className={labelClass}>
                  {t('form.location')}
                </label>
                <input
                  id="owner-location"
                  type="text"
                  required
                  name="location"
                  minLength={2}
                  maxLength={200}
                  placeholder={t('form.locationPlaceholder')}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="owner-description" className={labelClass}>
                  {t('form.description')}
                </label>
                <textarea
                  id="owner-description"
                  required
                  rows={4}
                  name="description"
                  maxLength={2000}
                  placeholder={t('form.descriptionPlaceholder')}
                  className={`${inputClass} resize-none`}
                />
              </div>
              {(status === 'invalid' || status === 'error') && (
                <p role="alert" className="rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent-dark">
                  {t(status === 'invalid' ? 'form.errorInvalid' : 'form.errorServer')}
                </p>
              )}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full bg-accent-dark text-white py-3 rounded-lg font-medium hover:bg-primary transition-colors disabled:opacity-60 disabled:cursor-wait"
              >
                {status === 'sending' ? t('form.sending') : t('form.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
