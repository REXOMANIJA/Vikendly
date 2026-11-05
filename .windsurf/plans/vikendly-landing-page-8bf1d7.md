# Vikendly Landing Page Implementation Plan

This plan outlines building a mobile-first landing page for Vikendly, a curated marketplace for weekend houses in the Balkans, using Next.js with TypeScript, Tailwind CSS, and next-intl for Serbian/English translations.

## Folder Structure

```
/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx          # Root layout with fonts, i18n provider
│   │   ├── page.tsx            # Landing page
│   │   └── search/
│   │       └── page.tsx        # Search results placeholder
│   ├── globals.css            # Tailwind directives
│   └── layout.tsx              # Root layout (middleware redirect)
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── LanguageSwitcher.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── Categories.tsx
│   │   ├── Destinations.tsx
│   │   ├── FreeThisWeekend.tsx
│   │   ├── WhyVikendly.tsx
│   │   ├── HowItWorks.tsx
│   │   └── OwnerCTA.tsx
│   ├── cards/
│   │   ├── HouseCard.tsx
│   │   ├── CategoryCard.tsx
│   │   └── DestinationCard.tsx
│   ├── SearchBar.tsx
│   └── SectionHeading.tsx
├── lib/
│   ├── data.ts                 # Mock data access functions
│   ├── pricing.ts              # calculateTotalPrice function
│   └── i18n.ts                 # next-intl configuration
├── data/
│   ├── houses.ts               # 12 mock houses
│   ├── destinations.ts         # Destination data with tourist tax
│   ├── categories.ts           # Category definitions
│   └── amenities.ts            # Amenity definitions
├── types/
│   └── index.ts                # TypeScript types (House, Destination, Category, Amenity, PricingRule)
├── public/
│   ├── images/
│   │   ├── hero.jpg
│   │   ├── house-01.jpg through house-12.jpg
│   │   ├── category-*.jpg
│   │   └── destination-*.jpg
├── locales/
│   ├── sr/
│   │   └── common.json         # Serbian translations
│   └── en/
│       └── common.json         # English translations
├── __tests__/
│   └── pricing.test.ts         # Unit tests for calculateTotalPrice
├── middleware.ts               # next-intl middleware
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── README.md
└── PROJECT.md                  # Vision, stack, architecture rules
```

## Design System

**Color Palette (Tailwind theme tokens):**
- `primary`: Deep forest green (#1A3C34)
- `background`: Warm sand/cream (#F5F1E8)
- `accent`: Burnt orange (#E07A5F)
- `text`: Dark neutral (#2D2D2D)
- All colors will be checked for WCAG AA contrast

**Typography:**
- Headings: Playfair Display (serif, supports Serbian Latin)
- Body: Inter (sans-serif)
- Loaded via next/font/google

**Placeholder Images:**
- Soft gradient backgrounds using palette colors
- Named clearly for easy replacement
- No text overlays

## Technical Decisions

**i18n:**
- URL-based routing (/sr and /en)
- SR as default locale
- hreflang tags for SEO
- All text from translation files

**Date Picker:**
- react-day-picker for range selection
- Mobile-friendly and keyboard accessible

**Budget Filter:**
- Number input for max total budget (EUR)
- Quick-select chips: 200, 300, 500, 800

**Pricing Logic:**
- Friday + Saturday = weekend rate
- Other nights = weekday rate
- Tourist tax: configurable per destination (1.5 EUR/person/night placeholder)
- Total = (nights × rates) + cleaning fee + (tourist tax × guests × nights)

## Step-by-Step Implementation

### Step 1: Project Setup
- Initialize Next.js with TypeScript, Tailwind, ESLint
- Install dependencies: next-intl, react-day-picker, @testing-library/react, jest
- Configure Tailwind with custom color theme
- Set up fonts (Playfair Display + Inter)
- Configure next-intl with URL routing
- Create folder structure
- Write README.md with setup instructions
- Write PROJECT.md with vision, stack, and architecture rules
- Commit: "Initial project setup with folder structure, Tailwind theme, fonts, and i18n configuration"

### Step 2: Types, Mock Data, and Pricing
- Define TypeScript types in `/types/index.ts`: House, Destination, Category, Amenity, PricingRule
- Create 12 realistic mock houses in `/data/houses.ts` with all required fields
- Create destination data with tourist tax in `/data/destinations.ts`
- Create categories in `/data/categories.ts`
- Create amenities in `/data/amenities.ts`
- Implement `/lib/data.ts` with functions: getHouses(), getDestinations(), getCategories(), getFreeThisWeekend()
- Implement `/lib/pricing.ts` with calculateTotalPrice() function
- Add unit tests for calculateTotalPrice() in `__tests__/pricing.test.ts`
- Create placeholder gradient images in `/public/images/`
- Commit: "Types, mock data, data access functions, and pricing logic with tests"

### Step 3: Header, Footer, and Layout
- Create `/components/layout/Header.tsx` with logo, nav, language switcher, CTA button
- Create `/components/layout/Footer.tsx` with links, language switcher, social placeholders, copyright
- Create `/components/layout/LanguageSwitcher.tsx` component
- Create root layout in `/app/[locale]/layout.tsx` with fonts and i18n provider
- Create middleware for locale routing
- Add translation keys for header/footer
- Commit: "Header, footer, language switcher, and root layout with i18n"

### Step 4: Hero with Search Bar
- Create `/components/SearchBar.tsx` with destination dropdown, date picker (react-day-picker), guests input, budget input with quick-select chips
- Create `/components/sections/Hero.tsx` with background image, headline, subheadline, and SearchBar
- Add translation keys for hero section
- Implement form submission to /search with query params
- Commit: "Hero section with search bar and date picker"

### Step 5: Categories, Destinations, and Free This Weekend
- Create `/components/cards/CategoryCard.tsx` component
- Create `/components/sections/Categories.tsx` with 6 category cards
- Create `/components/cards/DestinationCard.tsx` component
- Create `/components/sections/Destinations.tsx` with 9 destination cards
- Create `/components/cards/HouseCard.tsx` component
- Create `/components/sections/FreeThisWeekend.tsx` using getFreeThisWeekend()
- Add translation keys for all sections
- Commit: "Categories, destinations, and Free this weekend sections with card components"

### Step 6: Why Vikendly, How It Works, and Owner CTA
- Create `/components/sections/WhyVikendly.tsx` with 4-5 feature points
- Create `/components/sections/HowItWorks.tsx` with 3 steps
- Create `/components/sections/OwnerCTA.tsx` with form (name, phone, location, description)
- Add form validation and success message (no backend)
- Add TODO comment for backend integration
- Add translation keys
- Commit: "Why Vikendly, How it works, and Owner CTA form sections"

### Step 7: Polish and SEO
- Assemble all sections in `/app/[locale]/page.tsx` landing page
- Ensure mobile-first responsive design
- Add accessibility: alt texts, ARIA labels, keyboard navigation, focus states
- Add SEO metadata: title, description, Open Graph tags in layout
- Create `/app/sitemap.ts` and `/app/robots.ts`
- Optimize images (next/image)
- Test contrast ratios
- Commit: "Landing page assembly with responsiveness, accessibility, and SEO metadata"

### Step 8: Search Placeholder Page
- Create `/app/[locale]/search/page.tsx`
- Parse query params: destination, category, checkIn, checkOut, guests, budget
- Filter mock data using getHouses()
- Apply budget filter using calculateTotalPrice() when dates are provided
- Display filtered results or empty state
- Show "from" nightly price when no dates selected
- Add translation keys for search page
- Commit: "Search placeholder page with query param filtering and budget calculation"

## Verification After Each Step

1. **Step 1**: Run `npm run dev`, verify app starts, check Tailwind colors work, test language switching
2. **Step 2**: Run tests with `npm test`, verify mock data structure, test calculateTotalPrice manually
3. **Step 3**: Check header/footer render, language switcher works, layout wraps content
4. **Step 4**: Test search bar inputs, date picker range selection, form submission redirects
5. **Step 5**: Verify cards render correctly, links work with query params, mock data displays
6. **Step 6**: Test form validation, success message shows, all sections render
7. **Step 7**: Test on mobile viewport, check contrast with tool, verify meta tags
8. **Step 8**: Test search with various query params, verify budget filtering works correctly

## Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "next-intl": "^3.x",
    "react-day-picker": "^8.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x",
    "@testing-library/react": "^14.x",
    "@testing-library/jest-dom": "^6.x",
    "jest": "^29.x",
    "jest-environment-jsdom": "^29.x"
  }
}
```
