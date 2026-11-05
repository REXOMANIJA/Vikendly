import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

type Href = React.ComponentProps<typeof Link>['href'];

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  /** Small label above the title */
  eyebrow?: string;
  align?: 'left' | 'center';
  /** Optional link shown to the right of a left-aligned heading */
  action?: { href: Href; label: string };
  className?: string;
}

export default function SectionHeading({
  title,
  subtitle,
  eyebrow,
  align = 'left',
  action,
  className = 'mb-10',
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <div
      className={`flex flex-col gap-4 ${
        centered ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'
      } ${className}`}
    >
      <div className={centered ? 'max-w-2xl' : 'max-w-2xl'}>
        {eyebrow && (
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>
        )}
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary text-balance">{title}</h2>
        {subtitle && <p className="mt-3 text-text/70">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1.5 font-medium text-primary hover:text-accent transition-colors"
        >
          {action.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
