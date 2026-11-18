# Vikendly – instructions for Claude

Read this first in every session. **Open work is in `LAUNCH_CHECKLIST.md`** (section "Open – to do
next"); deeper architecture notes are in `PROJECT.md`; photo licences in `PHOTO_CREDITS.md`.

## What this is

Vikendly (vikendly.com) is a small, curated marketplace for **weekend houses in Serbia and the
region**. Guests don't book or pay online: they send a **request** (upit); the Vikendly team checks
the dates with the owner by phone and calls the guest back. Owners apply via `/za-vlasnike`; the team
visits, then publishes the house in the admin panel. Business model: free listing, **commission per
booking** brought by Vikendly.

Live: Vercel (auto-deploys `main` from GitHub `REXOMANIJA/Vikendly`). Database + storage + auth:
Supabase. Alerts: Telegram bot @VikendlyBot.

## Working with the owner (the user)

- Non-technical. Writes in **Serbian or English**: answer in the language of their message, in plain
  words, no jargon. Show results (what changed on the site), not code.
- **"Save and upload" = commit and push to `main`.** Never commit or push without being asked.
  Before pushing, scan the staged diff for secrets (Telegram token, keys) and leftover `TEMP-PREVIEW`.
- **Database changes:** write a new numbered file in `supabase/migrations/` (next is `0024_…`), make
  it safe to run twice (`if not exists`, `create or replace`, guarded `update`s), and ask the owner
  to run it in Supabase → SQL Editor. Never assume it ran: check with a read-only REST query using
  the publishable key from `.env.local` (e.g. `curl "$URL/rest/v1/table?select=col&limit=1" -H "apikey: $KEY"`).
  Code must keep working before the migration is run (see `lib/data.ts` fallback pattern).
- **Never** use a Supabase service-role/secret key. Never type the owner's passwords – for admin
  testing ask them to log in in the preview themselves. Don't save houses in admin on their behalf
  unless they asked for that exact change.
- **Photos:** only free-licensed (Unsplash free licence, not Unsplash+); add credits to `PHOTO_CREDITS.md`.
- Things that need the owner's content or decision (About us text, commission %, legal entity,
  Instagram, real houses) – ask, don't invent. Business details live in `lib/site.ts`.
- End each finished piece with: what changed, what was checked, what the owner must do (migration,
  Vercel setting), and offer "save and upload".

## Stack

Next.js 16 (App Router, Turbopack, React 19.3) · TypeScript · Tailwind CSS 4 (tokens in
`app/globals.css` `@theme`: primary `#1a3c34`, background `#f5f1e8`, accent `#e07a5f`,
accent-dark `#a84b2e`, sand `#ece4d3`) · next-intl 4 (sr default, en) · Supabase (`@supabase/ssr`) ·
react-day-picker 10 · maplibre-gl 6 (maps: OpenFreeMap tiles, look in `lib/map-style.ts`; its worker
is committed in `public/maplibre/`; after updating maplibre-gl run `node scripts/copy-map-worker.cjs` and commit) · lucide-react (no brand icons) · Jest · Vercel Analytics.

## Map of the code

- `app/[locale]/…` public site. Localized URLs in `i18n/routing.ts` (`/pretraga`, `/kuce/[slug]`, `/destinacije`,
  `/za-vlasnike`, `/kontakt`, `/cesta-pitanja`, `/uslovi-koriscenja`, `/privatnost`). Always link with internal names
  via `Link` from `@/i18n/navigation`. `[...rest]` + `not-found.tsx` = site 404; `error.tsx` = error page;
  `template.tsx` = page-change animations (View Transitions).
- `app/admin/…` admin (Serbian only): Upiti (requests), Kuće, Destinacije, Prijave vlasnika.
  Server actions in `app/admin/actions.ts`; reads in `lib/admin-data.ts`.
- `lib/data.ts` – all public data access (published houses loaded once per request). In tests
  (`NODE_ENV=test`) it returns sample data from `/data`.
- `lib/ranking.ts` – "Preporučeno" order for house lists (search default, holiday offers, similar
  houses, empty-search suggestions): verified first, then points for reviews, complete listing,
  homepage pick, new house, group fit and a daily shuffle. Homepage "Izdvojeno" keeps the admin's order.
- `lib/pricing.ts` + `lib/booking.ts` – **all price and request rules, shared by browser and server**
  (the server recalculates every price). `lib/actions.ts` – public form actions (booking request,
  owner application) with rate limits (`lib/notify.ts`) and Telegram alerts.
- `components/house/PriceCalculator.tsx` – booking box. `components/search/SearchFilters.tsx` – filter
  bar. `components/admin/HouseForm.tsx` + `UnitsEditor.tsx`, `PartyPricesEditor.tsx`, `GroupPricesEditor.tsx`.
- Texts: `locales/sr/common.json` and `locales/en/common.json` – **always add both**. Legal texts:
  `content/legal.ts`. Business details: `lib/site.ts`.
- SEO: `lib/seo.ts` (`localizedAlternates` – every public page sets its canonical), `app/sitemap.ts`,
  `app/robots.ts`, share images `public/images/og-sr.jpg` / `og-en.jpg`, icons `app/icon.svg`, `app/apple-icon.tsx`.

## Booking and price model (important)

- A listing is either **rented as one** (house fields: capacity, weekday/weekend price, optional
  "cene za manje grupe" tiers) or **split into units** (`house_units`). With units, the house's
  capacity/prices/rules are derived from the units on save (`withUnitTotals` in admin actions).
- Unit types: **with beds** (capacity, weekday/weekend price, optional group-price tiers, rules,
  optional "tokom dana najviše" = daytime limit, info only) and **party-only** (`party_only`, capacity 0,
  `day_capacity` = max people, `party_prices` levels `{max_guests, weekday_price, weekend_price}`).
- Weekend = **Friday and Saturday** (nights for stays; the party day for parties). A party-only
  booking is one day (date picker in single mode, checkOut = day + 1, no minimum stay). With a stay,
  the party day is the arrival day.
- Places with beds have **no party price**; they only show the daytime limit.
- Search/cards price a listing with units as the cheapest combination of bed units that fits
  (`quoteStay`). Booking requests save `details` (per-unit breakdown) and `party_guests`.
- Example in production: **Kutak u Vraniću** = Brvnara (4) + Kuća sa balkonom (6) + Letnjikovac
  (party-only, up to 30/50/70 people).
- **Holiday prices** (`house_special_prices`, admin → house → "Posebne cene za praznike"): a price per
  night for chosen nights (first–last night inclusive), per bed unit or for the whole house. It replaces
  weekday/weekend and group prices for those nights; optional `min_nights` raises the minimum stay
  when a stay includes one of those nights (`stayMinNights`). Party-only spaces keep normal prices.
- **Holidays** (admin → Praznici, `holidays` + `holiday_houses`): one reusable offer per holiday
  (name, dates, text, picture, on/off, ticked free houses). While on and not past its departure day it
  shows on the homepage (`HolidayOffer`) and at `/sr/praznici/[slug]`. The site has no availability
  calendar: the team ticks houses they confirmed are free.
- Everyone starts on Serbian (`localeDetection: false` in `i18n/routing.ts`); EN only via the switch.
  Serbian URLs have **no prefix** (`localePrefix: 'as-needed'`: `/kuce/…`, `/pretraga`), English is `/en/…`;
  old `/sr/…` links redirect. Admin links to the public site use plain `/kuce/…`.

## Database status

Migrations **0001–0012 have all been run** in Supabase (checked 12 Nov 2026). **0013 (venues, reviews) run 13 Nov. 0014 (free-text rules) run (checked 13 Nov). 0015 (nearby text), 0016 (holidays, special prices) and 0017 (holiday read fix, party holiday prices) run 13 Nov. 0018 (5 demo houses) run 16 Nov. 0019 (5 more demo houses) run 16 Nov. 0020 (5 real partner houses from Booking.com) and 0021 (3 more: Vila Lučić, Blue River, Etno selo Komarnica), run 16 Nov. 0022 (deleted the 10 demo houses) run 16 Nov; demo photos removed.** **0023 (anon may not read houses.address: column-level grant) written 18 Nov, NOT yet run – check.** Tables of note:
`houses`, `house_units`, `house_price_tiers`, `house_photos`, `booking_requests` (with `details`,
`party_guests`), `reviews` (0013: token link per confirmed booking, approved before public), `owner_applications`, `rate_limits`, `destinations` (id = URL slug, fixed after
creation). **Address privacy:** the public site never reads `houses.address` (lib/data.ts reads named
`PUBLIC_HOUSE_COLUMNS`, never `*`); maps show the exact pin but no address, Google link or directions.
After 0023 the anon key has a column-level grant on `houses`: a new house column the public site reads
must be added to that grant.
Save function: `admin_save_house(jsonb)` – redefine it fully in any migration that adds
house/unit fields. Storage bucket: `house-photos`.

## Environment

`.env.local` (never committed): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, optional `NEXT_PUBLIC_SITE_URL` (default https://vikendly.com).
The same must exist in Vercel. Template: `.env.example`.

## How to check work (do all before saying "done")

1. `npx tsc --noEmit`
2. `npx jest` (90 tests at last count; add tests for new price/booking rules in `__tests__/`)
3. `npx next build --experimental-build-mode compile`
4. Browser: preview server `vikendly` from `.claude/launch.json` (port 3000). Check desktop (1280×800)
   **and phone (375×812)**, Serbian and English, no sideways scroll
   (`document.documentElement.scrollWidth === innerWidth`). Reset the viewport afterwards.

## Known traps (learned the hard way)

- **Shell quoting on Windows breaks regexes and `\n`** in inline `node -e`/`sed` edits (backslashes
  vanish; `\|` became alternation and wrote into the wrong place). Use the Edit/Write tools, or put
  edit scripts in the scratchpad as `.cjs` files. Re-read the result. Files may have CRLF endings.
- A `'use client'` file can't export plain values to server components (they become client
  references) – shared constants/types go in a normal module (e.g. `lib/search.ts`).
- next-intl sends only the namespaces listed in `lib/client-messages.ts` to the browser. A new
  `useTranslations('x')` in a `'use client'` component needs `'x'` added there (test checks paths).
  Check texts in the rendered DOM. ICU plurals: Serbian needs `one/few/other`.
- When the preview pane is hidden or tiny: `requestAnimationFrame` doesn't run, so Suspense sections
  (the booking box) don't hydrate and view transitions stall – show the pane (`show_pane preview`),
  and use DOM checks instead of screenshots if the pane is very small.
- `proxy.ts` matcher must keep skipping files with a dot and `apple-icon`.
- `next/image`: use `unoptimized={isVector(src)}` (`lib/images.ts`) – SVG drawings unoptimized,
  photos optimized. Allowed qualities: 70, 75.
- To preview a feature that needs DB data that doesn't exist yet, a temporary override in
  `lib/data.ts` marked `// TEMP-PREVIEW` is OK – **remove it and re-run checks before finishing**
  (watch for a lost trailing comma).
- Dev server logs keep old errors; reload the page and read fresh output before chasing them.

## Next session – start here

1. Open `LAUNCH_CHECKLIST.md` → "Open – to do next".
2. Ask the owner which items they want, and collect any content listed under "Needs content or a
   decision" (About us text, Instagram, commission %, legal entity).
3. All code items from the review are done (13 Nov 2026). Check that 0013 ran. Admin pages
   (applications, WhatsApp/Viber, "kuća iz prijave", review links, Ocene) were not yet seen in the
   browser: the owner must log in in the preview first.
4. After each group: run the checks above, update `LAUNCH_CHECKLIST.md` (move items to "Done" by
   editing the rows directly), then offer "save and upload".
