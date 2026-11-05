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

All data access goes through async functions in `lib/data.ts`, which read from **Supabase**. Components never query Supabase directly: pages fetch data and pass it down as props.

- Published houses are loaded once per request (`react` `cache()`) and filtered in memory. Fine for a curated catalogue; switch to per-query filters if it grows into the thousands.
- In tests (`NODE_ENV=test`) the same functions return the sample data in `/data` instead.
- Pages revalidate every hour (`export const revalidate = 3600`), so changes in Supabase show up within an hour.

**Functions:** `getHouses`, `getHouseBySlug`, `getFeaturedHouses` (houses with `featured_rank`), `getSimilarHouses`, `getHouseCountsByDestination`, `getDestinations`, `getDestinationById`, `getDestinationBySlug`, `getCategories`, `getCategoryBySlug`

### Supabase

- Keys live in `.env.local` (not committed; see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never use the secret/service-role key in this app.
- Schema and security rules: `supabase/migrations/0001_init.sql`. Sample data: `supabase/seed.sql` (generated from `/data`). New schema changes go in new numbered files (`0002_…sql`), run in Supabase → SQL Editor.
- Row Level Security: the public can read reference data and **published** houses only, and can insert into `owner_applications` but never read it. Applications are read in the Supabase dashboard.
- A house appears on the site when `is_published = true`; `featured_rank` (1, 2, 3…) puts it in "Izdvojeno za ovaj vikend".

### Admin panel (`/admin`, Serbian only)

- Separate root layout in `app/admin/` (not under `[locale]`). `proxy.ts` sends `/admin/*` to Supabase session handling instead of next-intl and redirects visitors without a session to `/admin/login`.
- Admins are Supabase Auth users listed in `public.admins` (`supabase/migrations/0002_admin.sql`). Add one: create the user in Supabase → Authentication, then
  `insert into public.admins (user_id) select id from auth.users where email = '…';`
- All writes run with the admin's own session (`lib/supabase/server.ts`); permissions are enforced by RLS policies using `public.is_admin()`, not only by the app.
- Houses: list with publish toggle, add/edit form (`components/admin/HouseForm.tsx`). Saving calls the SQL function `admin_save_house(jsonb)`, which saves the house with its categories, amenities and photos in one transaction. Saving refreshes the public site immediately (`revalidatePath`).
- Photos are uploaded from the browser to the public Storage bucket `house-photos` (admins only, max 8 MB, JPG/PNG/WebP/AVIF). Removing a photo in the form doesn't delete the file from Storage; deleting a house does (needs the select policy from `0003_admin_photo_select.sql`).
- Booking requests: `/admin/upiti` (admin home), newest first, status new → contacted → confirmed / declined, guest and owner phone side by side. The menu shows the number of new requests.
- Owner applications: `/admin/prijave`, with status (new → contacted → visited → published / rejected).
- Supabase clients: `lib/supabase/public.ts` (anonymous, public pages), `lib/supabase/server.ts` (admin session, server), `lib/supabase/browser.ts` (admin session, browser).
- Owner form → server action `submitOwnerApplication` in `lib/actions.ts` (validation + honeypot spam trap).

### Pricing Logic

The pricing calculation is a pure function in `/lib/pricing.ts`:

```typescript
calculateTotalPrice(house, checkIn, checkOut, guests)
```

Returns:
- Total = nights × nightly price (weekday or weekend rate for the group size). There are **no extra fees**: no cleaning fee and no tourist tax (removed in 0005).

**Weekend definition:** Friday and Saturday nights are weekend rate, other nights are weekday rate.

**Prices by group size:** the house's weekday/weekend price is the **whole-house price** (up to `capacity`). Optional `house_price_tiers` ("up to N guests") give cheaper prices for smaller groups; `getNightlyRates(house, guests)` picks the smallest tier the group fits in, otherwise the whole-house price. "From" prices use `getLowestNightlyPrice`. Nights are counted with `Math.round` so stays across a clock change aren't over-counted.

**Capacity:** `capacity` = guests who can stay overnight ("Noćenje: do X osoba"). Optional `day_capacity` = guests allowed for a party or daytime gathering. Bedrooms and bathrooms are optional. Search and the price calculator use overnight capacity.

**Booking requests:** guests never contact owners directly. The house page sends a request (`submitBookingRequest` in `lib/actions.ts`, which re-checks dates, min nights, capacity and recalculates the price on the server) into `booking_requests`. The team sees requests at `/admin/upiti` (newest first), calls the owner and gets back to the guest. Owner phone numbers are private: table `house_owner_contacts`, readable by admins only.

### TypeScript Types

All types matching future database tables are defined in `/types/index.ts`:
- `House` - Property details
- `Destination` - Location (country)
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
- Localized URLs are defined in `pathnames` in `i18n/routing.ts`. The folder is `app/[locale]/houses/[slug]`, visitors see `/sr/kuce/vila-ribnica` and `/en/houses/vila-ribnica`. Link with the internal name: `{ pathname: '/houses/[slug]', params: { slug } }`
- Text stored per house in both languages uses `LocalizedText` (`{ sr, en }`), e.g. `house.description`

### House pages

- `app/[locale]/houses/[slug]/page.tsx`: photos, description, amenities, rules, location, similar houses; prerendered for every house
- `components/house/PriceCalculator.tsx`: price breakdown (weekday/weekend nights, per person), min-nights and capacity warnings, and the booking request form (name, phone, optional email and message)
- Dates/guests are passed in the URL (`?checkIn=yyyy-MM-dd&checkOut=…&guests=…`) from search and homepage cards so the calculator is prefilled

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
- Data in Supabase; owner applications are saved
- No admin panel, authentication or payments

## Future Phases (Not in Scope)

- Admin panel for managing houses
- User authentication
- Booking flow and payments
- Owner dashboard
- Admin panel instead of Supabase Table Editor
