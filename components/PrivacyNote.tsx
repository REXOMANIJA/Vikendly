import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * Short line under a form: what we do with the data, with a link to the privacy policy.
 * Required because both public forms collect a name and phone number.
 */
export default function PrivacyNote({ kind, className = '' }: { kind: 'booking' | 'owner'; className?: string }) {
  const t = useTranslations('privacyNote');
  return (
    <p className={`text-xs leading-relaxed text-text/60 ${className}`}>
      {t(kind)}{' '}
      <Link href="/privacy" className="underline underline-offset-2 hover:text-primary">
        {t('link')}
      </Link>
      .
    </p>
  );
}
