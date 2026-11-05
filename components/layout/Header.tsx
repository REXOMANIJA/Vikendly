import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { key: 'houses', hash: 'houses' },
  { key: 'destinations', hash: 'destinations' },
  { key: 'howItWorks', hash: 'how-it-works' },
] as const;

export default function Header() {
  const t = useTranslations('header');

  return (
    <header className="bg-background/95 backdrop-blur border-b border-primary/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 h-16">
          <Link
            href="/"
            className="font-serif text-2xl font-bold text-primary hover:text-accent transition-colors"
            aria-label={t('homeLabel')}
          >
            {t('logo')}
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={{ pathname: '/', hash: item.hash }}
                className="text-text hover:text-accent transition-colors font-medium"
              >
                {t(`nav.${item.key}`)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href={{ pathname: '/', hash: 'list-your-house' }}
              className="hidden sm:block bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-primary transition-colors"
            >
              {t('listYourHouse')}
            </Link>
          </div>
        </div>

        {/* Mobile nav: simple scrollable row instead of hiding the links entirely */}
        <nav className="md:hidden flex gap-6 overflow-x-auto no-scrollbar pb-3 -mt-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={{ pathname: '/', hash: item.hash }}
              className="whitespace-nowrap text-text hover:text-accent font-medium"
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
          <Link
            href={{ pathname: '/', hash: 'list-your-house' }}
            className="whitespace-nowrap text-accent font-medium sm:hidden"
          >
            {t('listYourHouse')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
