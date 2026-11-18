import Link from 'next/link';
import {
  CalendarCheck, Inbox, Star, Home, Phone, Send, Wrench, Sparkles, ArrowRight, CheckCircle2, TrendingUp, CalendarDays, Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  countNewOwnerApplications, countNewReviews, listBookingRequests, listHolidaysForAdmin, listHousesForAdmin, reviewSummary,
} from '@/lib/admin-data';
import { ago, daysUntil, dayKey, euro, greeting, hoursSince, inDays } from '@/lib/admin-format';

/**
 * Admin home ("Pregled"): what needs doing today, the main numbers, requests per week,
 * upcoming stays and which houses guests ask about most.
 */
export default async function AdminOverviewPage() {
  const [requests, houses, applications, pendingReviews, rating, holidays] = await Promise.all([
    listBookingRequests(),
    listHousesForAdmin(),
    countNewOwnerApplications(),
    countNewReviews(),
    reviewSummary(),
    listHolidaysForAdmin(),
  ]);
  const now = new Date();
  const today = dayKey(now);
  const month = today.slice(0, 7);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const lastMonth = dayKey(lastMonthDate).slice(0, 7);
  const createdMonth = (r: { created_at: string }) => dayKey(new Date(r.created_at)).slice(0, 7);

  const newRequests = requests.filter((r) => r.status === 'new').sort((a, b) => a.created_at.localeCompare(b.created_at));
  const thisMonth = requests.filter((r) => createdMonth(r) === month);
  const prevMonth = requests.filter((r) => createdMonth(r) === lastMonth);
  const confirmedMonth = thisMonth.filter((r) => r.status === 'confirmed');
  const upcoming = requests
    .filter((r) => r.status === 'confirmed' && r.check_in >= today)
    .sort((a, b) => a.check_in.localeCompare(b.check_in));
  const sendAddress = upcoming.filter((r) => daysUntil(r.check_in, now) <= 7);
  const published = houses.filter((h) => h.is_published);
  // Only houses guests can see are worth completing first
  const needsWork = published.filter((h) => h.health.percent < 100).sort((a, b) => a.health.percent - b.health.percent);
  const avgHealth = published.length ? Math.round(published.reduce((s, h) => s + h.health.percent, 0) / published.length) : 0;
  const nextHoliday = (holidays ?? [])
    .filter((h) => h.is_active && h.check_out >= today)
    .sort((a, b) => a.check_in.localeCompare(b.check_in))[0];

  // Requests per week, last 12 weeks (Monday to Sunday), oldest first
  const weekStart = (d: Date) => {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
    return x.getTime();
  };
  const thisWeek = weekStart(now);
  const weeks = Array.from({ length: 12 }, (_, i) => ({ start: thisWeek - (11 - i) * 7 * 86400000, count: 0 }));
  for (const r of requests) {
    const w = weeks.find((x) => x.start === weekStart(new Date(r.created_at)));
    if (w) w.count++;
  }
  const maxWeek = Math.max(1, ...weeks.map((w) => w.count));
  const topHouses = [...houses].filter((h) => h.requests90 > 0).sort((a, b) => b.requests90 - a.requests90).slice(0, 5);
  const maxTop = Math.max(1, ...topHouses.map((h) => h.requests90));
  const shortDate = new Intl.DateTimeFormat('sr-Latn', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const stayDate = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return shortDate.format(new Date(Date.UTC(y, m - 1, d)));
  };

  // To-do list, most urgent first
  type Todo = { href: string; icon: LucideIcon; title: string; text: string; tone: 'urgent' | 'normal' };
  const todos: Todo[] = [
    ...newRequests.slice(0, 5).map((r) => ({
      href: '/admin/upiti',
      icon: Phone,
      title: `Novi upit: ${r.house_name}`,
      text: `${r.name} · ${stayDate(r.check_in)}–${stayDate(r.check_out)} · ${r.guests} os. · stigao ${ago(r.created_at, now)}`,
      tone: hoursSince(r.created_at, now) > 3 ? ('urgent' as const) : ('normal' as const),
    })),
    ...sendAddress.map((r) => ({
      href: '/admin/upiti',
      icon: Send,
      title: `Pošaljite adresu: ${r.name}`,
      text: `${r.house_name} · dolazak ${inDays(daysUntil(r.check_in, now))} (${stayDate(r.check_in)})`,
      tone: daysUntil(r.check_in, now) <= 2 ? ('urgent' as const) : ('normal' as const),
    })),
    ...(applications > 0
      ? [{ href: '/admin/prijave', icon: Inbox, title: `${applications} ${applications === 1 ? 'nova prijava' : 'nove prijave'} vlasnika`, text: 'Pozovite vlasnike i dogovorite obilazak.', tone: 'normal' as const }]
      : []),
    ...(pendingReviews > 0
      ? [{ href: '/admin/ocene', icon: Star, title: `${pendingReviews} ${pendingReviews === 1 ? 'ocena čeka' : 'ocene čekaju'} odobrenje`, text: 'Pročitajte i objavite na sajtu.', tone: 'normal' as const }]
      : []),
    ...needsWork.slice(0, 3).map((h) => ({
      href: `/admin/kuce/${h.id}`,
      icon: Wrench,
      title: `Dopunite oglas: ${h.name} (${h.health.percent}%)`,
      text: `Nedostaje: ${h.health.missing.slice(0, 3).join(', ')}${h.health.missing.length > 3 ? '…' : ''}`,
      tone: 'normal' as const,
    })),
  ];

  const stats: { label: string; value: string; sub: string; icon: LucideIcon; href: string; highlight?: boolean }[] = [
    {
      label: 'Novi upiti',
      value: String(newRequests.length),
      sub: newRequests[0] ? `najstariji ${ago(newRequests[0].created_at, now)}` : 'sve je odgovoreno',
      icon: CalendarCheck,
      href: '/admin/upiti',
      highlight: newRequests.length > 0,
    },
    {
      label: 'Upiti ovog meseca',
      value: String(thisMonth.length),
      sub: `prošli mesec: ${prevMonth.length}`,
      icon: TrendingUp,
      href: '/admin/upiti',
    },
    {
      label: 'Potvrđeno ovog meseca',
      value: String(confirmedMonth.length),
      sub: `vrednost ${euro(confirmedMonth.reduce((s, r) => s + r.quoted_total, 0))}`,
      icon: CheckCircle2,
      href: '/admin/upiti',
    },
    {
      label: 'Kuće na sajtu',
      value: `${published.length}/${houses.length}`,
      sub: `oglasi prosečno ${avgHealth}% kompletni`,
      icon: Home,
      href: '/admin/kuce',
    },
    {
      label: 'Ocena gostiju',
      value: rating ? rating.average.toFixed(1).replace('.', ',') : '–',
      sub: rating ? `${rating.count} ${rating.count === 1 ? 'ocena' : 'ocena'}` : 'još nema ocena',
      icon: Star,
      href: '/admin/ocene',
    },
  ];

  const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-primary/5 md:p-6';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wider text-accent-dark">
          {new Intl.DateTimeFormat('sr-Latn', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Belgrade' }).format(now)}
        </p>
        <h1 className="font-serif text-3xl font-bold text-primary md:text-4xl">{greeting(now)}!</h1>
        <p className="mt-1 text-text/70">
          {todos.length === 0
            ? 'Sve je sređeno. Nema ničega što čeka na vas.'
            : `Danas ${todos.length === 1 ? 'vas čeka 1 stvar' : `vas čeka ${todos.length} ${todos.length < 5 ? 'stvari' : 'stvari'}`}.`}
        </p>
      </div>

      {/* Main numbers */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-5">
        {stats.map(({ label, value, sub, icon: Icon, href, highlight }) => (
          <Link
            key={label}
            href={href}
            className={`group rounded-2xl p-4 shadow-sm transition-transform hover:-translate-y-0.5 md:p-5 ${
              highlight ? 'bg-accent-dark text-white' : 'bg-white ring-1 ring-primary/5'
            } ${label === 'Ocena gostiju' ? 'col-span-2 xl:col-span-1' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${highlight ? 'text-white/85' : 'text-text/65'}`}>{label}</span>
              <Icon className={`size-5 ${highlight ? 'text-white/80' : 'text-accent-dark'}`} aria-hidden />
            </div>
            <p className={`mt-2 font-serif text-3xl font-bold lining-nums tabular-nums ${highlight ? 'text-white' : 'text-primary'}`}>{value}</p>
            <p className={`mt-1 text-xs ${highlight ? 'text-white/80' : 'text-text/60'}`}>{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* To do */}
        <section className={`${card} lg:col-span-3`}>
          <h2 className="mb-4 font-serif text-xl font-bold text-primary">Za uraditi</h2>
          {todos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-text/70">
              <CheckCircle2 className="size-10 text-primary/40" aria-hidden />
              Nema otvorenih zadataka.
            </div>
          ) : (
            <ul className="space-y-2">
              {todos.map((t, i) => (
                <li key={i}>
                  <Link
                    href={t.href}
                    className="group flex items-start gap-3 rounded-xl border border-primary/8 p-3 transition-colors hover:border-primary/25 hover:bg-background"
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                        t.tone === 'urgent' ? 'bg-accent-dark text-white' : 'bg-primary/8 text-primary'
                      }`}
                    >
                      <t.icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-primary">{t.title}</span>
                      <span className="block text-sm text-text/65">{t.text}</span>
                    </span>
                    <ArrowRight className="mt-2 size-4 shrink-0 text-text/30 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Upcoming stays */}
        <section className={`${card} lg:col-span-2`}>
          <h2 className="mb-4 font-serif text-xl font-bold text-primary">Sledeći dolasci</h2>
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-text/60">Nema potvrđenih dolazaka.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.slice(0, 6).map((r) => (
                <li key={r.id} className="flex items-center gap-3">
                  <span className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-background py-1.5 leading-tight">
                    <span className="text-lg font-bold text-primary">{Number(r.check_in.slice(8))}</span>
                    <span className="text-[11px] uppercase text-text/60">{stayDate(r.check_in).split(' ')[1]}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-primary">{r.name}</span>
                    <span className="block truncate text-sm text-text/60">
                      {r.house_name} · {r.guests} os. · {inDays(daysUntil(r.check_in, now))}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {nextHoliday && (
            <Link
              href="/admin/praznici"
              className="mt-5 flex items-center gap-3 rounded-xl bg-sand/60 p-3 text-sm hover:bg-sand"
            >
              <Sparkles className="size-5 shrink-0 text-accent-dark" aria-hidden />
              <span>
                <strong className="text-primary">{nextHoliday.name_sr}</strong> je na sajtu ·{' '}
                {nextHoliday.house_ids.length} {nextHoliday.house_ids.length === 1 ? 'slobodna kuća' : 'slobodnih kuća'}
              </span>
            </Link>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Requests per week */}
        <section className={`${card} lg:col-span-3`}>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-bold text-primary">Upiti po nedeljama</h2>
            <span className="text-sm text-text/60">poslednjih 12 nedelja</span>
          </div>
          <div className="flex h-44 items-end gap-1.5 md:gap-2.5" role="img" aria-label="Broj upita po nedeljama">
            {weeks.map((w, i) => (
              <div key={w.start} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs font-semibold text-primary">{w.count || ''}</span>
                <div
                  className={`w-full rounded-t-md ${i === weeks.length - 1 ? 'bg-accent' : 'bg-primary/80'}`}
                  style={{ height: `${Math.max(w.count ? 6 : 2, (w.count / maxWeek) * 100)}%`, opacity: w.count ? 1 : 0.25 }}
                  title={`Nedelja od ${shortDate.format(new Date(w.start))}: ${w.count}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-text/50">
            <span>{shortDate.format(new Date(weeks[0].start))}</span>
            <span>ova nedelja</span>
          </div>
        </section>

        {/* Most asked-about houses */}
        <section className={`${card} lg:col-span-2`}>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-xl font-bold text-primary">Najtraženije kuće</h2>
            <span className="text-sm text-text/60">90 dana</span>
          </div>
          {topHouses.length === 0 ? (
            <p className="py-6 text-center text-text/60">Još nema upita.</p>
          ) : (
            <ul className="space-y-3">
              {topHouses.map((h) => (
                <li key={h.id}>
                  <Link href={`/admin/kuce/${h.id}`} className="block hover:opacity-80">
                    <span className="flex justify-between text-sm">
                      <span className="truncate font-medium text-primary">{h.name}</span>
                      <span className="shrink-0 text-text/60">{h.requests90}</span>
                    </span>
                    <span className="mt-1 block h-2 overflow-hidden rounded-full bg-background">
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${(h.requests90 / maxTop) * 100}%` }} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-primary/10 pt-4 text-sm">
            <span className="flex items-center gap-2 text-text/70">
              <CalendarDays className="size-4 text-accent-dark" aria-hidden /> {requests.length} upita ukupno
            </span>
            <span className="flex items-center gap-2 text-text/70">
              <Users className="size-4 text-accent-dark" aria-hidden />
              {requests.reduce((s, r) => s + (r.status === 'confirmed' ? r.guests : 0), 0)} gostiju potvrđeno
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
