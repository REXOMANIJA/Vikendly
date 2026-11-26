import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';
import { CookieSettingsButton } from './CookieConsent';
import { Camera, Mail, Phone } from 'lucide-react';
import { phoneDigits, site } from '@/lib/site';

const links = [
  { key: 'owners', href: '/owners' },
  { key: 'destinations', href: '/destinations' },
  { key: 'faq', href: '/faq' },
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
            <ul className="mt-5 space-y-2 text-white/80">
              {site.phone && (
                <li>
                  <a href={`tel:${phoneDigits(site.phone)}`} className="inline-flex items-center gap-2 hover:text-white">
                    <Phone className="size-4" aria-hidden /> {site.phone}
                  </a>
                </li>
              )}
              {site.email && (
                <li>
                  <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 hover:text-white">
                    <Mail className="size-4" aria-hidden /> {site.email}
                  </a>
                </li>
              )}
              {site.instagram && (
                <li>
                  <a
                    href={`https://www.instagram.com/${site.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-white"
                  >
                    <Camera className="size-4" aria-hidden /> Instagram @{site.instagram}
                  </a>
                </li>
              )}
            </ul>
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
              <li>
                <CookieSettingsButton label={t('cookieSettings')} />
              </li>
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
