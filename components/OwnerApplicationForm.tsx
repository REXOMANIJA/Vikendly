'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CircleCheck } from 'lucide-react';
import { submitOwnerApplication } from '@/lib/actions';
import PrivacyNote from '@/components/PrivacyNote';

const inputClass =
  'w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-text placeholder:text-text/40 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent';
const labelClass = 'block text-sm font-medium text-text mb-1.5';

/**
 * "Prijavite svoju kuću" form, used on the homepage and on /za-vlasnike.
 * Saved to Supabase (table owner_applications) and sent to the team's Telegram (lib/actions.ts).
 */
export default function OwnerApplicationForm({ idPrefix = 'owner' }: { idPrefix?: string }) {
  const t = useTranslations('ownerCTA');
  const locale = useLocale();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'invalid' | 'tooMany' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const result = await submitOwnerApplication(new FormData(e.currentTarget));
      setStatus(result.ok ? 'sent' : result.error === 'server' ? 'error' : result.error);
    } catch {
      setStatus('error');
    }
  };

  const id = (name: string) => `${idPrefix}-${name}`;

  if (status === 'sent') {
    return (
      <div className="py-10 text-center" role="status">
        <CircleCheck className="mx-auto mb-4 size-14 text-accent-dark" strokeWidth={1.5} aria-hidden />
        <p className="font-serif text-2xl font-bold text-primary">{t('form.success')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="font-serif text-2xl font-bold text-primary mb-2">{t('form.heading')}</p>
      <input type="hidden" name="locale" value={locale} />
      {/* Spam trap: hidden from people, bots fill it in */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
        <label htmlFor={id('website')}>Website</label>
        <input id={id('website')} type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={id('name')} className={labelClass}>
            {t('form.name')}
          </label>
          <input id={id('name')} type="text" required autoComplete="name" name="name" minLength={2} maxLength={120} className={inputClass} />
        </div>
        <div>
          <label htmlFor={id('phone')} className={labelClass}>
            {t('form.phone')}
          </label>
          <input
            id={id('phone')}
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
        <label htmlFor={id('location')} className={labelClass}>
          {t('form.location')}
        </label>
        <input
          id={id('location')}
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
        <label htmlFor={id('description')} className={labelClass}>
          {t('form.description')}
        </label>
        <textarea
          id={id('description')}
          required
          rows={4}
          name="description"
          maxLength={2000}
          placeholder={t('form.descriptionPlaceholder')}
          className={`${inputClass} resize-none`}
        />
      </div>
      {(status === 'invalid' || status === 'tooMany' || status === 'error') && (
        <p role="alert" className="rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent-dark">
          {t(status === 'invalid' ? 'form.errorInvalid' : status === 'tooMany' ? 'form.errorTooMany' : 'form.errorServer')}
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full bg-accent-dark text-white py-3 rounded-lg font-medium hover:bg-primary transition-colors disabled:opacity-60 disabled:cursor-wait"
      >
        {status === 'sending' ? t('form.sending') : t('form.submit')}
      </button>
      <PrivacyNote kind="owner" />
    </form>
  );
}
