import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';

const links = ['about', 'contact', 'terms', 'privacy'] as const;

export default function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <p className="font-serif text-2xl font-bold mb-4">Vikendly</p>
            <p className="text-white/80 max-w-md">{t('tagline')}</p>
          </div>

          <div>
            <h2 className="font-semibold mb-4">{t('linksTitle')}</h2>
            {/* TODO: these pages don't exist yet (Phase 2). Shown as plain text so they aren't dead links. */}
            <ul className="space-y-2 text-white/80">
              {links.map((key) => (
                <li key={key}>{t(`links.${key}`)}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold mb-4">{t('languageTitle')}</h2>
            <LanguageSwitcher variant="dark" />
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/60 text-sm">
          <p>{t('copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
