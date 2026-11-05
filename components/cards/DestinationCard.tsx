import { ViewTransition } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

interface DestinationCardProps {
  /** Destination id, names the photo so it can grow into the search page banner */
  id: string;
  name: string;
  slug: string;
  image: string;
  /** e.g. "Srbija" */
  country: string;
  /** e.g. "2 kuće" */
  houseCount: string;
  /** Large tile with bigger text */
  featured?: boolean;
  className?: string;
}

export default function DestinationCard({
  id,
  name,
  slug,
  image,
  country,
  houseCount,
  featured = false,
  className = '',
}: DestinationCardProps) {
  return (
    <Link
      href={{ pathname: '/search', query: { destination: slug } }}
      transitionTypes={['nav-forward']}
      className={`group relative block min-h-44 overflow-hidden rounded-2xl shadow-md transition-shadow hover:shadow-xl focus-visible:outline-2 focus-visible:outline-accent ${className}`}
    >
      <ViewTransition name={`destination-${id}`} share="vk-morph" default="none">
        <Image
          src={image}
          alt=""
          fill
          unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </ViewTransition>
      <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent" />
      <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-primary opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowUpRight className="size-4" aria-hidden />
      </span>
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-white">
        <p className="text-xs font-medium uppercase tracking-wider text-white/75">{country}</p>
        <h3 className={`font-serif font-bold ${featured ? 'text-3xl md:text-4xl' : 'text-xl'}`}>{name}</h3>
        <p className="mt-0.5 text-sm text-white/85">{houseCount}</p>
      </div>
    </Link>
  );
}
