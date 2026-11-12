import { useLocale, useTranslations } from 'next-intl';
import type { LegalSection } from '@/content/legal';
import { formatDate, parseDateParam } from '@/lib/dates';
import { site } from '@/lib/site';

/** Privacy policy / terms: title, last-updated date, contents list and numbered sections. */
export default function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  const t = useTranslations('legal');
  const locale = useLocale();
  const updated = parseDateParam(site.legalUpdated);

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl font-bold text-primary md:text-5xl">{title}</h1>
        {updated && <p className="mt-3 text-sm text-text/60">{t('updated', { date: formatDate(updated, locale) })}</p>}

        <nav aria-label={t('contents')} className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-primary/10 md:p-6">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-text/50">{t('contents')}</p>
          <ol className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-primary hover:text-accent-dark hover:underline">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id}>
              <h2 className="font-serif text-2xl font-bold text-primary">
                {i + 1}. {s.title}
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed text-text/85">
                {s.text.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {s.list && (
                  <ul className="list-disc space-y-1.5 pl-5 marker:text-accent">
                    {s.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {s.after?.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
