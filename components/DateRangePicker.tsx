'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { DayPicker, type DateRange } from 'react-day-picker';
import { enGB, srLatn } from 'react-day-picker/locale';
import { CalendarDays, X } from 'lucide-react';
import 'react-day-picker/style.css';
import { countNights } from '@/lib/pricing';
import { formatDate, formatStay, parseDateParam, toDateParam } from '@/lib/dates';

interface DateRangePickerProps {
  /** "yyyy-MM-dd" or "" */
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
  /** Visible label above the field */
  label?: string;
  id?: string;
  className?: string;
}

/** Shows two months on wider screens */
function useIsWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return wide;
}

/**
 * Arrival + departure in one field with a calendar.
 * Dates are shown day-month-year ("13.11. – 15.11.2026."); values stay "yyyy-MM-dd" strings.
 * Desktop: dropdown with two months. Phones: panel from the bottom with one month.
 */
export default function DateRangePicker({ checkIn, checkOut, onChange, label, id, className = '' }: DateRangePickerProps) {
  const t = useTranslations('datePicker');
  const locale = useLocale();
  const wide = useIsWide();
  const autoId = useId();
  const fieldId = id ?? `dates-${autoId}`;
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const from = parseDateParam(checkIn);
  const to = parseDateParam(checkOut);
  const selected: DateRange | undefined = from ? { from, to } : undefined;
  const nights = from && to ? countNights(from, to) : 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Close on outside click and Escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onSelect = (range: DateRange | undefined) => {
    const nextFrom = range?.from;
    // A one-day "range" (same day clicked twice) means only arrival is chosen
    const nextTo = range?.to && nextFrom && range.to.getTime() !== nextFrom.getTime() ? range.to : undefined;
    onChange(nextFrom ? toDateParam(nextFrom) : '', nextTo ? toDateParam(nextTo) : '');
    if (nextFrom && nextTo && wide) setTimeout(() => setOpen(false), 250); // desktop: close once both are picked
  };

  const status = !from ? t('pickCheckIn') : !to ? t('pickCheckOut') : t('nights', { count: nights });

  return (
    <div ref={wrapper} className={`relative ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium mb-1.5">
          {label}
        </label>
      )}
      <button
        ref={trigger}
        id={fieldId}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex h-11 w-full items-center gap-2 rounded-lg border bg-white px-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
          open ? 'border-primary ring-2 ring-primary' : 'border-gray-300 hover:border-primary/60'
        }`}
      >
        <CalendarDays className="size-4 shrink-0 text-primary" aria-hidden />
        <span className={`truncate ${from ? 'text-text' : 'text-text/50'}`}>
          {from && to ? formatStay(from, to, locale) : from ? `${formatDate(from, locale)} – …` : t('placeholder')}
        </span>
      </button>

      {open && (
        <>
          {/* Phones: dim the page behind the bottom panel */}
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden" aria-hidden onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label={label ?? t('label')}
            className="vk-calendar fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl md:absolute md:inset-x-auto md:bottom-auto md:left-0 md:top-full md:mt-2 md:max-h-none md:w-max md:rounded-2xl md:p-5"
          >
            <div className="mb-2 flex items-center justify-between gap-4">
              <p className="font-semibold text-primary" aria-live="polite">{status}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label={t('close')}
                className="rounded-full p-1.5 text-text/60 hover:bg-background md:hidden">
                <X className="size-5" />
              </button>
            </div>

            <DayPicker
              mode="range"
              selected={selected}
              onSelect={onSelect}
              resetOnSelect
              locale={locale === 'sr' ? srLatn : enGB}
              numberOfMonths={wide ? 2 : 1}
              pagedNavigation={wide}
              defaultMonth={from ?? today}
              startMonth={today}
              disabled={{ before: today }}
              excludeDisabled
              modifiers={{ weekendNight: { dayOfWeek: [5, 6] } }}
              modifiersClassNames={{ weekendNight: 'vk-weekend' }}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-primary/10 pt-3">
              <span className="inline-flex items-center gap-2 text-xs text-text/60">
                <span className="size-1.5 rounded-full bg-accent" aria-hidden /> {t('weekendLegend')}
              </span>
              <div className="flex gap-2">
                {from && (
                  <button type="button" onClick={() => onChange('', '')}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-text/70 hover:bg-background">
                    {t('clear')}
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark">
                  {t('done')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
