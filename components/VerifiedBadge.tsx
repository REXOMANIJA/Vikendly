import { useTranslations } from 'next-intl';
import { BadgeCheck } from 'lucide-react';

/**
 * "Provereno uživo": the Vikendly team has visited this house in person.
 * Shown only when the admin marked the house as verified (houses.verified_at).
 *
 * - "photo": white pill on top of a card photo
 * - "inline": green pill next to text (house page title)
 */
export default function VerifiedBadge({
  variant = 'inline',
  className = '',
}: {
  variant?: 'photo' | 'inline';
  className?: string;
}) {
  const t = useTranslations('verified');
  const look =
    variant === 'photo'
      ? 'bg-white/95 text-primary shadow-md backdrop-blur text-xs px-2.5 py-1'
      : 'bg-primary text-white text-sm px-3 py-1.5';
  return (
    <span
      title={t('tooltip')}
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${look} ${className}`}
    >
      <BadgeCheck className={`size-4 ${variant === 'photo' ? 'text-primary' : 'text-white'}`} aria-hidden />
      {t('badge')}
    </span>
  );
}
