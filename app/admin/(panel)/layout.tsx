import Link from 'next/link';
import { Home, Inbox, ExternalLink, LogOut, CalendarCheck } from 'lucide-react';
import { createAdminClient, getAdminUser } from '@/lib/supabase/server';
import { countNewBookingRequests } from '@/lib/admin-data';
import { signOut } from '../actions';

// Admin pages always show live data and are never cached
export const dynamic = 'force-dynamic';

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

  const nav = 'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/10';
  const newRequests = await countNewBookingRequests();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
          <Link href="/admin/upiti" className="mr-4 font-serif text-xl font-bold text-primary">
            Vikendly <span className="font-sans text-sm font-normal text-text/60">admin</span>
          </Link>
          <nav className="flex flex-1 flex-wrap gap-1">
            <Link href="/admin/upiti" className={nav}>
              <CalendarCheck className="size-4" aria-hidden /> Upiti
              {newRequests > 0 && (
                <span className="rounded-full bg-accent-dark px-1.5 py-0.5 text-xs font-semibold text-white" title="Novi upiti">
                  {newRequests}
                </span>
              )}
            </Link>
            <Link href="/admin/kuce" className={nav}><Home className="size-4" aria-hidden /> Kuće</Link>
            <Link href="/admin/prijave" className={nav}><Inbox className="size-4" aria-hidden /> Prijave vlasnika</Link>
            <a href="/sr" target="_blank" className={nav}><ExternalLink className="size-4" aria-hidden /> Sajt</a>
          </nav>
          <span className="hidden text-sm text-text/60 sm:inline">{admin.email}</span>
          <form action={signOut}>
            <button className={nav} title="Odjava"><LogOut className="size-4" aria-hidden /> Odjava</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
