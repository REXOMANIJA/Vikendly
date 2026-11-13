'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useFavorites } from '@/lib/favorites';

/** Heart that saves a house in this browser (see lib/favorites.ts) */
export default function FavoriteButton({
  slug,
  name,
  variant = 'photo',
  className = '',
}: {
  slug: string;
  name: string;
  /** "photo": round button on a card photo; "pill": button with text on the house page */
  variant?: 'photo' | 'pill';
  className?: string;
}) {
  const t = useTranslations('favorites');
  const { has, toggle } = useFavorites();
  const saved = has(slug);
  const label = saved ? t('remove', { name }) : t('add', { name });

  const onClick = (e: React.MouseEvent) => {
    // On cards the whole card is a link: the heart must not open the house
    e.preventDefault();
    e.stopPropagation();
    toggle(slug);
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        aria-label={label}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors ${
          saved ? 'bg-accent/15 text-accent-dark ring-accent/30' : 'bg-white text-primary ring-primary/15 hover:bg-primary/5'
        } ${className}`}
      >
        <Heart className={`size-4 ${saved ? 'fill-current' : ''}`} aria-hidden />
        {saved ? t('saved') : t('save')}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      // No "relative" here: the card places it with "absolute right-2 top-2" (both together
      // made the browser ignore the placement and put the heart on the left, over the badge)
      className={`z-10 flex size-10 items-center justify-center rounded-full bg-white/90 text-accent-dark shadow-sm transition-transform hover:scale-110 ${className}`}
    >
      <Heart className={`size-5 ${saved ? 'fill-current' : ''}`} aria-hidden />
    </button>
  );
}
