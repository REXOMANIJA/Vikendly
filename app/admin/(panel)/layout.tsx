import Link from 'next/link';
import { ExternalLink, LogOut } from 'lucide-react';
import { createAdminClient, getAdminUser } from '@/lib/supabase/server';
import { countNewBookingRequests, countNewOwnerApplications, countNewReviews } from '@/lib/admin-data';
import AdminNav from '@/components/admin/AdminNav';
import { signOut } from '../actions';

// Admin pages always show live data and are never cached
export const dynamic = 'force-dynamic';

/** The Vikendly logo mark (same drawing as app/icon.svg) */
function Logo({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="10" fill="#f5f1e8" />
      <circle cx="28" cy="13" r="4.5" fill="#e07a5f" />
      <path d="M9 30V20.5L18 13l9 7.5V30z" fill="#1a3c34" />
      <rect x="15.5" y="23" width="5" height="7" rx="1" fill="#f5f1e8" />
    </svg>
  );
}

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();

  if (!admin) {
    // Logged in, but this account is not in public.admins
    const supabase = await createAdminClient();
    const { data } = await supabase.auth.getUser();
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-xl space-y-4">
          <h1 className="font-serif text-2xl font-bold text-primary">Nemate pristup</h1>
          <p className="text-text/80">
            Nalog <strong>{data.user?.email}</strong> nije administrator. Administratora dodaje vlasnik
            sajta u Supabase-u (tabela <code>admins</code>).
          </p>
          <form action={signOut}>
            <button className="rounded-lg border-2 border-primary px-4 py-2 font-medium text-primary">Odjavite se</button>
          </form>
        </div>
      </main>
    );
  }

  const [requests, applications, reviews] = await Promise.all([
    countNewBookingRequests(),
    countNewOwnerApplications(),
    countNewReviews(),
  ]);
  const counts = { requests, applications, reviews };
  const footerLink = 'flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white';

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Computer: sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-primary px-4 py-6 lg:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-3 px-2">
          <Logo />
          <span className="font-serif text-xl font-bold text-white">
            Vikendly <span className="block font-sans text-xs font-medium uppercase tracking-widest text-white/60">admin</span>
          </span>
        </Link>
        <AdminNav counts={counts} variant="side" />
        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          <a href="/" target="_blank" className={footerLink}>
            <ExternalLink className="size-[18px]" aria-hidden /> Otvorite sajt
          </a>
          <form action={signOut}>
            <button className={`${footerLink} w-full`}>
              <LogOut className="size-[18px]" aria-hidden /> Odjava
            </button>
          </form>
          <p className="truncate px-3 pt-2 text-xs text-white/50" title={admin.email ?? ''}>{admin.email}</p>
        </div>
      </aside>

      {/* Phone and tablet: top bar with a menu that scrolls sideways */}
      <header className="sticky top-0 z-40 bg-primary px-4 pt-3 lg:hidden">
        <div className="mb-3 flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo className="size-8" />
            <span className="font-serif text-lg font-bold text-white">Vikendly <span className="font-sans text-xs font-medium text-white/60">admin</span></span>
          </Link>
          <a href="/" target="_blank" className="ml-auto rounded-lg p-2 text-white/80 hover:bg-white/10" aria-label="Otvorite sajt">
            <ExternalLink className="size-5" />
          </a>
          <form action={signOut}>
            <button className="rounded-lg p-2 text-white/80 hover:bg-white/10" aria-label="Odjava">
              <LogOut className="size-5" />
            </button>
          </form>
        </div>
        <AdminNav counts={counts} variant="top" />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</main>
    </div>
  );
}
