import { Star } from 'lucide-react';

/** 1–5 stars, filled up to `value` (rounded to the nearest whole star) */
export default function Stars({ value, className = 'size-4', label }: { value: number; className?: string; label?: string }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={`${className} ${i <= full ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-text/25'}`}
        />
      ))}
    </span>
  );
}
