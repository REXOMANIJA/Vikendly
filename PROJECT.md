# Vikendly Project Documentation

## Vision

Vikendly is a curated marketplace for renting weekend houses and vacation homes in Serbia, Croatia, Bosnia and Montenegro. Unlike Airbnb or Booking, we focus on this specific region with a smaller, curated set of houses that the Vikendly team adds manually. Owners apply, and we publish only verified properties.

## Tech Stack

- **Next.js 16** (App Router) - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS with custom theme
- **next-intl** - Internationalization (Serbian Latin + English)
- **react-day-picker** - Date range selection
- **Jest + Testing Library** - Unit testing

## Architecture Rules

### Data Access Pattern

All data access must go through functions in `/lib/data`. Currently these functions return mock data from `/data`, but they will be replaced with Supabase queries without touching the UI components.

**Functions:**
- `getHouses()` - Returns all houses
- `getDestinations()` - Returns all destinations
- `getCategories()` - Returns all categories
- `getFreeThisWeekend()` - Returns houses available this weekend

### Pricing Logic

The pricing calculation is a pure function in `/lib/pricing.ts`:

```typescript
calculateTotalPrice(house, checkIn, checkOut, guests)
```

Returns:
- Nightly total (weekday/weekend rates)
- Cleaning fee
- Tourist tax (per person per night, configurable per destination)

**Weekend definition:** Friday and Saturday nights are weekend rate, other nights are weekday rate.

**Tourist tax:** Configurable per destination (currently 1.5 EUR/person/night placeholder). TODO: Verify real rates per country/municipality.

### TypeScript Types

All types matching future database tables are defined in `/types/index.ts`:
- `House` - Property details
- `Destination` - Location with tourist tax
- `Category` - House type
- `Amenity` - Features
- `PricingRule` - Pricing configuration

### Component Structure

- `/components/layout/` - Header, Footer, LanguageSwitcher
- `/components/sections/` - Page sections (Hero, Categories, etc.)
- `/components/cards/` - Reusable card components
- `/components/SearchBar.tsx` - Search form component
- `/components/SectionHeading.tsx` - Reusable heading

### Internationalization

- URL-based routing: `/sr` and `/en`
- Serbian (Latin) is default locale
- All visible text must come from translation files
- Never hardcode text in components
- Add hreflang tags for SEO (done via `alternates` in `generateMetadata`)
- Setup (next-intl v4): `i18n/routing.ts` (locales), `i18n/request.ts` (loads messages), `i18n/navigation.ts` (locale-aware `Link`/`useRouter`), `proxy.ts` (Next 16 name for middleware; redirects `/` → `/sr` or `/en`)
- Always import `Link`, `useRouter`, `usePathname` from `@/i18n/navigation`, not from `next/link` / `next/navigation`
- Next 16: `params` and `searchParams` are Promises — `await` them in pages/layouts

### Currency

All prices are in EUR.

### Design System

**Color Palette (Tailwind v4 theme — defined in `@theme` in `app/globals.css`; there is no `tailwind.config.ts`):**
- `primary`: #1A3C34 (Deep forest green)
- `background`: #F5F1E8 (Warm sand/cream)
- `accent`: #E07A5F (Burnt orange)
- `text`: #2D2D2D (Dark neutral)

**Typography:**
- Headings: Playfair Display (serif, supports Serbian Latin characters)
- Body: Inter (sans-serif)
- Loaded via next/font/google

**Design Principles:**
- Mobile-first responsive design
- Warm, modern, trustworthy aesthetic
- Nature-inspired palette
- Rounded cards, generous spacing
- Accessible: alt texts, contrast, keyboard navigation

### Placeholder Images

All placeholder images are stored in `/public/images/` with clear naming:
- `hero.svg` - Hero background
- `house-01.svg` through `house-12.svg` - House photos
- (categories use icons from lucide-react, no images)
- `destination-*.svg` - Destination images

Placeholders are simple SVG landscape illustrations in palette colors. When adding real photos,
use `.jpg`/`.webp`, update the paths in `data/houses.ts` and the section components, and remove
the `unoptimized` prop from `<Image>` so Next.js optimizes them.

## Current Phase

**Phase 1:** Landing page + foundation
- Landing page with all sections
- Search functionality (placeholder)
- Mock data
- No admin panel, authentication, payments, or real database

## Future Phases (Not in Scope)

- Admin panel for managing houses
- User authentication
- Booking flow and payments
- Owner dashboard
- Real database (Supabase)
