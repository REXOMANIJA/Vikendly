import { houses } from '@/data/houses';
import { destinations } from '@/data/destinations';
import { categories } from '@/data/categories';
import { House, Destination, Category } from '@/types';

export function getHouses(): House[] {
  return houses;
}

export function getHouseById(id: string): House | undefined {
  return houses.find((house) => house.id === id);
}

export function getDestinations(): Destination[] {
  return destinations;
}

export function getDestinationById(id: string): Destination | undefined {
  return destinations.find((dest) => dest.id === id);
}

export function getDestinationBySlug(slug: string): Destination | undefined {
  return destinations.find((dest) => dest.slug === slug);
}

export function getHouseCountByDestination(destinationId: string): number {
  return houses.filter((house) => house.destinationId === destinationId).length;
}

export function getCategories(): Category[] {
  return categories;
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((cat) => cat.id === id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((cat) => cat.slug === slug);
}

export function getFreeThisWeekend(): House[] {
  // For now, return a random selection of houses
  // In production, this would check actual availability
  return houses.slice(0, 6);
}
