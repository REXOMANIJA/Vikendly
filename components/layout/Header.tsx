'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, House, KeyRound, Lightbulb, MapPin, Menu, X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';

const navItems = [
  { key: 'houses', href: { pathname: '/', hash: 'houses' }, icon: House },
  // Own page: lists every destination, however many there are
  { key: 'destinations', href: { pathname: '/destinations' }, icon: MapPin },
  { key: 'howItWorks', href: { pathname: '/', hash: 'how-it-works' }, icon: Lightbulb },
] as const;

const ownerHref = { pathname: '/', hash: 'list-your-house' } as const;

export default function Header() {
  const t = useTranslations('header');
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // A bit more solid, with a shadow, once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the phone menu when the page changes
  useEffect(() => setOpen(false), [pathname]);

  // While the phone menu is open: no scrolling behind it, Escape closes it
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const isActive = (key: (typeof navItems)[number]['key']) =>
    key === 'destinations' && pathname.startsWith('/destinations');

  return (
    <header
      // Named so page-change animations leave the header in place (see globals.css)
      style={{ viewTransitionName: 'site-header' }}
      className={`sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled || open
          ? 'border-primary/10 bg-background/90 shadow-[0_6px_24px_-12px_rgb(26_60_52/0.35)] backdrop-blur-md'
          : 'border-transparent bg-background'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between gap-4 transition-[height] duration-300 ${scrolled ? 'h-16' : 'h-16 md:h-20'}`}>
          <Link href="/" aria-label={t('homeLabel')} className="group shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-dark">
            <Logo />
          </Link>

          {/* Desktop menu */}
          <nav className="hidden items-center gap-1 rounded-full bg-white/70 p-1 ring-1 ring-primary/10 md:flex">
            {navItems.map((item) => {
              const active = isActive(item.key);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors lg:px-5 ${
                    active ? 'bg-primary text-white' : 'text-text hover:bg-primary/8 hover:text-primary'
                  }`}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>
            <Link
              href={ownerHref}
              className="hidden items-center gap-2 rounded-full bg-accent-dark px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary hover:shadow-md md:inline-flex"
            >
              <KeyRound className="size-4" aria-hidden />
              {t('listYourHouse')}
            </Link>

            {/* Phone menu button */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t('closeMenu') : t('menu')}
              className="relative flex size-11 items-center justify-center rounded-full bg-white text-primary ring-1 ring-primary/15 transition-colors hover:bg-primary hover:text-white md:hidden"
            >
              <Menu className={`size-5 transition-all duration-200 ${open ? 'scale-50 rotate-90 opacity-0' : ''}`} aria-hidden />
              <X className={`absolute size-5 transition-all duration-200 ${open ? '' : 'scale-50 -rotate-90 opacity-0'}`} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* Phone menu: drops down under the header and fills the screen */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] overflow-y-auto border-t border-primary/10 bg-background md:hidden"
      >
        <div className="vk-menu-in flex min-h-full flex-col px-4 pb-8 pt-4">
          <nav>
            <ul className="space-y-2">
              {navItems.map((item, i) => {
                const Icon = item.icon;
                const active = isActive(item.key);
                return (
                  <li key={item.key} className="vk-menu-item" style={{ animationDelay: `${60 + i * 50}ms` }}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-4 rounded-2xl p-4 transition-colors ${
                        active ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-sand'
                      }`}
                    >
                      <span className={`flex size-11 items-center justify-center rounded-xl ${active ? 'bg-white/15' : 'bg-background'}`}>
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="flex-1 font-serif text-xl font-bold">{t(`nav.${item.key}`)}</span>
                      <ChevronRight className="size-5 opacity-50" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="vk-menu-item mt-6" style={{ animationDelay: '220ms' }}>
            <Link
              href={ownerHref}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-accent-dark px-5 py-4 font-semibold text-white"
            >
              <KeyRound className="size-5" aria-hidden />
              {t('listYourHouse')}
            </Link>
          </div>

          <div className="vk-menu-item mt-auto flex items-end justify-between gap-4 pt-10" style={{ animationDelay: '270ms' }}>
            <p className="max-w-[14rem] text-sm text-text/60">{t('menuTagline')}</p>
            <div className="text-right">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-text/50">{t('language')}</p>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
