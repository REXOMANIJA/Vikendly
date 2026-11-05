'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    description: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const update = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with backend to save the form submission
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setFormData({ name: '', phone: '', location: '', description: '' });
  };

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
                    value={formData.name}
                    onChange={update('name')}
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
                    value={formData.phone}
                    onChange={update('phone')}
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
                  value={formData.location}
                  onChange={update('location')}
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
                  value={formData.description}
                  onChange={update('description')}
                  placeholder={t('form.descriptionPlaceholder')}
                  className={`${inputClass} resize-none`}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-accent-dark text-white py-3 rounded-lg font-medium hover:bg-primary transition-colors"
              >
                {t('form.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
