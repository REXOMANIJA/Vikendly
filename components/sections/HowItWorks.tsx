import { useTranslations } from 'next-intl';
import { Search, Send, Sun } from 'lucide-react';

const steps = [
  { key: 'step1', icon: Search },
  { key: 'step2', icon: Send },
  { key: 'step3', icon: Sun },
] as const;

export default function HowItWorks() {
  const t = useTranslations('howItWorks');

  return (
    <section id="how-it-works" className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary text-center mb-12">
          {t('title')}
        </h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {steps.map(({ key, icon: Icon }, i) => (
            <li key={key} className="text-center">
              <div className="relative mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-accent text-white">
                <Icon className="size-7" strokeWidth={1.75} aria-hidden />
                <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white ring-2 ring-background">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-semibold text-lg text-primary mb-1.5">{t(`${key}.title`)}</h3>
              <p className="text-sm text-text/70 leading-relaxed max-w-xs mx-auto">{t(`${key}.text`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
