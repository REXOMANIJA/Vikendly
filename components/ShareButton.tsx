'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Link2, MessageCircle, Share2 } from 'lucide-react';

/**
 * "Podelite": phones open their own share sheet (WhatsApp, Viber, Instagram…);
 * computers get a small menu with WhatsApp, Viber and "copy link".
 */
export default function ShareButton({ title, text }: { title: string; text: string }) {
  const t = useTranslations('share');
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Close the menu on a click outside or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const url = () => window.location.origin + window.location.pathname;

  const onShare = async () => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url: url() });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return; // the visitor closed the share sheet
      }
    }
    setOpen((o) => !o);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(t('copyPrompt'), url());
    }
  };

  const message = () => encodeURIComponent(`${text} ${url()}`);
  const item = 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text hover:bg-primary/5';

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={onShare}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary ring-1 ring-primary/15 transition-colors hover:bg-primary/5"
      >
        <Share2 className="size-4" aria-hidden />
        {t('button')}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-56 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-primary/10">
          <a role="menuitem" className={item} href={`https://wa.me/?text=${message()}`} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
            <MessageCircle className="size-4 text-primary" aria-hidden /> WhatsApp
          </a>
          <a role="menuitem" className={item} href={`viber://forward?text=${message()}`} onClick={() => setOpen(false)}>
            <MessageCircle className="size-4 text-primary" aria-hidden /> Viber
          </a>
          <button role="menuitem" type="button" className={item} onClick={copy}>
            {copied ? <Check className="size-4 text-primary" aria-hidden /> : <Link2 className="size-4 text-primary" aria-hidden />}
            {copied ? t('copied') : t('copy')}
          </button>
        </div>
      )}
    </div>
  );
}
