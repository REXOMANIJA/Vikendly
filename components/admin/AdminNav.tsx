'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CalendarCheck, Home, Inbox, Star, Sparkles, MapPin } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Item = { href: string; label: string; icon: LucideIcon; badge?: number; badgeTitle?: string };

/**
 * Admin menu. `variant="side"`: the sidebar on computers; `variant="top"`: a row that scrolls
 * sideways on phones. Red numbers = things waiting for you.
 */
export default function AdminNav({
  counts,
  variant,
}: {
  counts: { requests: number; applications: number; reviews: number };
  variant: 'side' | 'top';
}) {
  const pathname = usePathname();
  const items: Item[] = [
    { href: '/admin', label: 'Pregled', icon: LayoutDashboard },
    { href: '/admin/upiti', label: 'Upiti', icon: CalendarCheck, badge: counts.requests, badgeTitle: 'Novi upiti' },
    { href: '/admin/kuce', label: 'Kuće', icon: Home },
    { href: '/admin/prijave', label: 'Prijave vlasnika', icon: Inbox, badge: counts.applications, badgeTitle: 'Nove prijave' },
    { href: '/admin/ocene', label: 'Ocene', icon: Star, badge: counts.reviews, badgeTitle: 'Čekaju odobrenje' },
    { href: '/admin/praznici', label: 'Praznici', icon: Sparkles },
    { href: '/admin/destinacije', label: 'Destinacije', icon: MapPin },
  ];
  const active = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  if (variant === 'top') {
    return (
      <nav className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none]" aria-label="Admin meni">
        {items.map(({ href, label, icon: Icon, badge, badgeTitle }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
              active(href) ? 'bg-white text-primary shadow-sm' : 'text-white/85 hover:bg-white/10'
            }`}
          >
            <Icon className="size-4" aria-hidden />
            {label}
            {!!badge && (
              <span title={badgeTitle} className="rounded-full bg-accent px-1.5 text-xs font-bold leading-5 text-white">
                {badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1" aria-label="Admin meni">
      {items.map(({ href, label, icon: Icon, badge, badgeTitle }) => (
        <Link
          key={href}
          href={href}
          aria-current={active(href) ? 'page' : undefined}
          className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
            active(href) ? 'bg-white text-primary shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Icon className="size-[18px]" aria-hidden />
          <span className="flex-1">{label}</span>
          {!!badge && (
            <span title={badgeTitle} className="min-w-6 rounded-full bg-accent px-1.5 text-center text-xs font-bold leading-6 text-white">
              {badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
