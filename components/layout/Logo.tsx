/**
 * Vikendly logo: a small house with a weekend sun, next to the name.
 * The sun rises a little when the logo link is hovered (parent has the "group" class).
 */
export default function Logo({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const text = tone === 'dark' ? 'text-primary' : 'text-white';
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" className="size-9 shrink-0 md:size-10" aria-hidden>
        <rect width="40" height="40" rx="12" className="fill-primary" />
        <circle
          cx="28"
          cy="13"
          r="4.5"
          className="fill-accent transition-transform duration-500 group-hover:-translate-y-1"
        />
        <path d="M9 30V20.5L18 13l9 7.5V30z" className="fill-background" />
        <rect x="15.5" y="23" width="5" height="7" rx="1" className="fill-primary" />
      </svg>
      <span className={`font-serif text-2xl font-bold tracking-tight ${text}`}>Vikendly</span>
    </span>
  );
}
