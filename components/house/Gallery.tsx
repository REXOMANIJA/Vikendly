'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';

/**
 * House photos.
 * - Desktop: one large photo + up to four small ones, "All photos (N)" button.
 * - Phones: swipeable strip with a counter.
 * - Any photo opens a full-screen viewer (swipe, arrows, keyboard, thumbnails).
 * Swiping uses CSS scroll-snap, so it feels native on touch screens without a library.
 */
export default function Gallery({ photos, name }: { photos: string[]; name: string }) {
  const t = useTranslations('house.gallery');
  const tHouse = useTranslations('house');
  const [open, setOpen] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const mobileStrip = useRef<HTMLDivElement>(null);
  const alt = (i: number) => tHouse('photoAlt', { name, n: i + 1 });

  if (photos.length === 0) return null;
  const grid = photos.slice(0, 5);
  const hiddenCount = photos.length - grid.length;

  return (
    <>
      {/* ── Phones: swipe through photos ── */}
      <div className="relative md:hidden -mx-4">
        <div
          ref={mobileStrip}
          className="flex snap-x snap-mandatory overflow-x-auto no-scrollbar"
          onScroll={(e) => {
            const el = e.currentTarget;
            setMobileIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {photos.map((photo, i) => (
            <button
              key={photo}
              type="button"
              onClick={() => setOpen(i)}
              className="relative aspect-[4/3] w-full shrink-0 snap-center"
              aria-label={t('open', { n: i + 1 })}
            >
              <Image src={photo} alt={alt(i)} fill unoptimized priority={i === 0} sizes="100vw" className="object-cover" />
            </button>
          ))}
        </div>
        {photos.length > 1 && (
          <span className="pointer-events-none absolute bottom-3 right-6 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            {t('counter', { current: mobileIndex + 1, total: photos.length })}
          </span>
        )}
      </div>

      {/* ── Desktop: big photo + grid ── */}
      <div
        className={`relative hidden md:grid gap-2 overflow-hidden rounded-2xl ${
          grid.length >= 3 ? 'grid-cols-4 grid-rows-2 aspect-[2/1]' : grid.length === 2 ? 'grid-cols-2 aspect-[2/1]' : 'aspect-[21/9]'
        }`}
      >
        {grid.map((photo, i) => {
          // With 3–4 photos the last one stretches so the grid has no holes
          const span =
            i === 0 && grid.length >= 3
              ? 'col-span-2 row-span-2'
              : grid.length === 3 && i > 0
                ? 'col-span-2'
                : grid.length === 4 && i === 3
                  ? 'col-span-2'
                  : '';
          const showMore = i === grid.length - 1 && hiddenCount > 0;
          return (
            <button
              key={photo}
              type="button"
              onClick={() => setOpen(i)}
              className={`group relative overflow-hidden ${span}`}
              aria-label={t('open', { n: i + 1 })}
            >
              <Image
                src={photo}
                alt={alt(i)}
                fill
                unoptimized
                priority={i === 0}
                sizes={i === 0 ? '50vw' : '25vw'}
                className="object-cover transition duration-300 group-hover:scale-[1.03] group-hover:brightness-90"
              />
              {showMore && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/45 font-serif text-3xl font-bold text-white">
                  {t('more', { count: hiddenCount })}
                </span>
              )}
            </button>
          );
        })}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => setOpen(0)}
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg bg-white/95 px-4 py-2 text-sm font-medium text-primary shadow-md hover:bg-white"
          >
            <Images className="size-4" aria-hidden />
            {t('showAll', { count: photos.length })}
          </button>
        )}
      </div>

      {open !== null && (
        <Lightbox
          photos={photos}
          start={open}
          name={name}
          alt={alt}
          onClose={(lastIndex) => {
            setOpen(null);
            // Keep the phone strip in sync with where the viewer was closed
            mobileStrip.current?.scrollTo({ left: lastIndex * mobileStrip.current.clientWidth });
          }}
        />
      )}
    </>
  );
}

function Lightbox({
  photos,
  start,
  name,
  alt,
  onClose,
}: {
  photos: string[];
  start: number;
  name: string;
  alt: (i: number) => string;
  onClose: (lastIndex: number) => void;
}) {
  const t = useTranslations('house.gallery');
  const [index, setIndex] = useState(start);
  // The photo we're on or moving to. A ref (not just state) so quick repeated arrow presses
  // each move one photo further instead of all aiming at the same one mid-animation.
  const indexRef = useRef(start);
  // While a button/keyboard scroll animates, ignore the in-between scroll positions
  const scrollingTo = useRef<number | null>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const strip = useRef<HTMLDivElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const el = strip.current;
      if (!el) return;
      const target = Math.max(0, Math.min(photos.length - 1, i));
      indexRef.current = target;
      setIndex(target);
      scrollingTo.current = target;
      clearTimeout(scrollTimer.current);
      // Safety net: never block swipe tracking for long, even if the animation is cut short
      scrollTimer.current = setTimeout(() => (scrollingTo.current = null), 700);
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollTo({ left: target * el.clientWidth, behavior: smooth && !reduceMotion ? 'smooth' : 'instant' });
    },
    [photos.length]
  );

  const onStripScroll = (el: HTMLDivElement) => {
    const position = Math.round(el.scrollLeft / el.clientWidth);
    if (scrollingTo.current !== null) {
      if (position === scrollingTo.current) scrollingTo.current = null; // animation arrived
      return;
    }
    // A finger swipe
    if (position !== indexRef.current) {
      indexRef.current = position;
      setIndex(position);
    }
  };

  // Open at the clicked photo, lock page scroll, focus the close button, restore focus after
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    goTo(start, false);
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [goTo, start]);

  // Keyboard: arrows to move, Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(indexRef.current);
      if (e.key === 'ArrowRight') goTo(indexRef.current + 1);
      if (e.key === 'ArrowLeft') goTo(indexRef.current - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(scrollTimer.current);
    };
  }, [goTo, onClose]);

  // Keep the active thumbnail visible
  useEffect(() => {
    thumbs.current?.children[index]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [index]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('dialog', { name })}
      className="fixed inset-0 z-[100] flex flex-col bg-[#0b0f0e] text-white"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium" aria-live="polite">
          {t('counter', { current: index + 1, total: photos.length })}
        </span>
        <button
          ref={closeButton}
          type="button"
          onClick={() => onClose(indexRef.current)}
          className="rounded-full p-2 hover:bg-white/10"
          aria-label={t('close')}
        >
          <X className="size-6" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={strip}
          className="flex h-full snap-x snap-mandatory overflow-x-auto no-scrollbar"
          onScroll={(e) => onStripScroll(e.currentTarget)}
        >
          {photos.map((photo, i) => (
            <div key={photo} className="relative h-full w-full shrink-0 snap-center">
              <Image
                src={photo}
                alt={alt(i)}
                fill
                unoptimized
                sizes="100vw"
                className="object-contain"
                // Load neighbours first so swiping never shows an empty frame
                loading={Math.abs(i - start) <= 1 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        {index > 0 && (
          <button
            type="button"
            onClick={() => goTo(indexRef.current - 1)}
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 hover:bg-white/25 md:block"
            aria-label={t('prev')}
          >
            <ChevronLeft className="size-6" />
          </button>
        )}
        {index < photos.length - 1 && (
          <button
            type="button"
            onClick={() => goTo(indexRef.current + 1)}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 hover:bg-white/25 md:block"
            aria-label={t('next')}
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {photos.length > 1 && (
        <div ref={thumbs} className="flex justify-start gap-2 overflow-x-auto no-scrollbar px-4 py-3 md:justify-center">
          {photos.map((photo, i) => (
            <button
              key={photo}
              type="button"
              onClick={() => goTo(i)}
              aria-label={t('open', { n: i + 1 })}
              aria-current={i === index || undefined}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md transition ${
                i === index ? 'ring-2 ring-white' : 'opacity-50 hover:opacity-80'
              }`}
            >
              <Image src={photo} alt="" fill unoptimized sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
