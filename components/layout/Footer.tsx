import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';

const links = [
  { key: 'owners', href: '/owners' },
  { key: 'destinations', href: '/destinations' },
  { key: 'contact', href: '/contact' },
  { key: 'terms', href: '/terms' },
  { key: 'privacy', href: '/privacy' },
] as const;

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="inline-block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
              <Logo tone="light" />
            </Link>
            <p className="mt-4 max-w-md text-white/80">{t('tagline')}</p>
          </div>

          <nav aria-label={t('linksTitle')}>
            <h2 className="mb-4 font-semibold">{t('linksTitle')}</h2>
            <ul className="space-y-2">
              {links.map(({ key, href }) => (
                <li key={key}>
                  <Link href={href} className="text-white/80 transition-colors hover:text-white hover:underline">
                    {t(`links.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="mb-4 font-semibold">{t('languageTitle')}</h2>
            {/* w-fit: keeps the switcher its own size instead of stretching across the column */}
            <div className="w-fit">
              <LanguageSwitcher variant="dark" />
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-white/60">
          <p>{t('copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
