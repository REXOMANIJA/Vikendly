# Vikendly – launch checklist

Full site review on 12 Nov 2026 (desktop 1280px and phone 375px, Serbian and English), then fixed
step by step. **Status as of 13 Nov 2026**: all code items done (not yet committed); migration 0013 not yet run.

**Priority:** P0 = must fix before sending the site to clients · P1 = should be done for launch ·
P2 = can come after launch

---

## Open – to do next

### Needs content or a decision from the owner (ask before building)

| # | Pri | What | What is needed |
|---|-----|------|----------------|
| B4 | P1 | **"O nama" (About us) page** – who is behind Vikendly. Important for owners' trust. | A few sentences about the team and why Vikendly exists; optional photo. Then add `/o-nama` + footer link. |
| A5 | P1 | **English house descriptions** – English pages show the Serbian text. | Owner writes them in admin (or asks for a translation of the Serbian text to review). |
| — | P2 | **Facebook** link (Instagram @vikendly_ is done: Kontakt page + footer, 13 Nov). | Facebook page name, if there will be one. |
| — | P1 | **Commission %** on the owners page (now "agreed when we meet"). | Owner decides whether to show it. |
| — | P1 | **Legal entity** in privacy policy and terms (now "Vikendly tim"). | Business name, address, PIB, MB once registered → `lib/site.ts` + `content/legal.ts`. Legal texts should be read by a lawyer. |
| — | P1 | **Real houses with photos.** Only 1 published house (Kutak u Vraniću); 12 sample houses are hidden in admin. | Owner adds houses. Sample houses can be deleted in admin → Kuće → "Skrivene". |
| — | P1 | **Demo houses (0018 run, 0019 new):** 10 example houses to show future owners. Not real places. House pages no longer show the address, only the area and the map pin. | Owner runs `0019_more_demo_houses.sql` in Supabase. Delete demo houses when real ones arrive (commands at the top of 0018 and 0019). |
| — | P1 | **Partner houses (0020):** 5 real houses (Miris Bora, Tarski proplanak, Konak kod Munje on Tara; Dobrila, Zlatiborski katuni on Zlatibor), owners agreed. Prices are Booking.com prices for 2 people. | Owner runs `0020_partner_houses.sql` and `0021_more_partner_houses.sql` (Vila Lučić, Blue River, Etno selo Komarnica), then confirms prices, capacity and owner phone numbers in admin. |

### Code work, no input needed

Nothing open. Migrations 0015–0017 have run (13 Nov). Holiday "Nova godina 2027" is on with 7 houses.

### Running the business (owner, outside the code)

| # | Pri | What |
|---|-----|------|
| H5 | P1 | **Supabase free plan pauses the database after a week without visits and keeps no backups.** Upgrade to Pro (~$25/month) before real clients, or set up regular backups. |
| — | P1 | **Vercel → project → Analytics → Enable** (code is in place). |
| — | P1 | **Telegram on Vercel:** `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in Vercel → Settings → Environment Variables, then redeploy. Works locally already. |
| — | P1 | **Email `info@vikendly.com`** via ImprovMX forwarding to Gmail (MX done, SPF TXT record being added in Vercel DNS). |
| G7 | P2 | Google Search Console: verified, `sitemap.xml` submitted. Check "Pages" report after a few days. |

---

## Done (13 Nov 2026, fourth round)

- **UI/UX tasks** U1–U3, U6, U8–U13, U15–U17, U21 (see `UI_UX_TASKS.md`): booking box dates-first with suggested units, combined house rules, compact amenities, section links, "Udaljenosti i okolina" (0015), sticky search filters, `/sr/pretraga` + redirects, results map, owner banner on the homepage.
- **Serbian is the default** for every visitor (no browser-language redirect); English via the SR/EN switch.
- **Holidays:** admin → Praznici (reusable offer: name, dates, text, picture, on/off, ticked free houses) → homepage block + `/sr/praznici/[slug]`; **holiday prices** per house/unit with optional minimum stay (0016).

## Done (13 Nov 2026, third round)

- **Similar houses** on the house page are a sideways-swipe row on phones.
- **IONOS website checker** (13 Nov): pages now send only the texts interactive parts need (`lib/client-messages.ts`): homepage 222 → 205 KB, ~30 KB compressed. The "no CDN" note is wrong (Vercel is a CDN). Homepage Google description lengthened to ~155 characters. Not done: "500+ words on the homepage" (would make the phone homepage longer; needs the owner's content).

- **House rules as text:** admin → house → "Pravila kuće" (Serbian + English, optional); shown on the house page under the rule icons, English falls back to Serbian (migration 0014).
- Phone search opens without the keyboard; name hint "Unesite naziv"; destination tiles no longer overlap; featured houses show "Od €X" (cheapest option); drawn graphic in "Zašto Vikendly"; Telegram test-error button in admin → Upiti.

## Done (13 Nov 2026, second round)

- **Admin form** no longer blocked by hidden "Cene za manje grupe" rows when the house has units (N1).
- **Event venues:** a listing can be only party spaces (no beds). Cards show "Žurka: do N osoba · Od €X po žurci", search counts party guests, the booking box preselects the space, no minimum stay. Needs migration 0013 to save (N2).
- **Share** button (phone share sheet, or WhatsApp / Viber / copy link) and **favourites** (heart on cards and house page, kept in the browser; header heart + page `/sr/sacuvane`, `/en/saved`) (E8).
- **Google data** on house pages: name, photos, address, map pin, from-price, and stars once there are reviews (`lib/structured-data.ts`, tested) (G8).
- **Error alerts:** server errors and pages that crash in a visitor's browser are sent to Telegram, the same error at most every 30 minutes, only on the live site (`instrumentation.ts`, `lib/error-alert.ts`) (H6).
- **Caching:** Supabase photos were already cached 1 year (checked); resized photos now kept 31 days instead of 4 hours, `/images` files 1 week (`next.config.mjs`) (F2).
- **Guest reviews** (E7, needs migration 0013): admin → Upiti → a confirmed request gets "Napravite link za ocenu" → send by WhatsApp or copy for Viber/SMS → guest gives 1–5 stars, comment, first name on `/sr/ocena/…` → Telegram alert → admin → **Ocene** → Objavite / Sakrijte / Obrišite. Approved reviews show on the house page, cards and Google data. Privacy policy updated (reviews, saved houses).

## Done (13 Nov 2026)

- **Header "Kuće"** opens all houses (`/search`) and is highlighted there (C2).
- **"Zašto Vikendly?"** shows a real photo of Kutak u Vraniću (`public/images/why-vikendly.jpg`, see `PHOTO_CREDITS.md`) (A6).
- **Phone:** the bottom "Pošaljite upit" bar hides while the booking box is on screen (D6); featured houses on the homepage are a sideways-swipe row (D5).
- **Loading bar** at the top while a page opens (`components/layout/NavigationProgress.tsx`) (D7).
- **Homepage search:** hints "Broj osoba" / "Bez limita" instead of "2" / "500" (D8).
- **Map:** place names Latin first; Google's Cyrillic "Отвори у Мапама" box hidden (houses without exact coordinates). Google always adds Cyrillic names under the Latin ones in Serbia; no setting removes that (C3).
- **Admin:** WhatsApp + Viber buttons next to guest and owner phones, local numbers get +381 (`lib/phone.ts`, tested) (I3); "Napravite kuću iz prijave" on each application fills owner phone, address and destination (I2); menu shows the number of new owner applications (I4).
- **FAQ page** for guests `/sr/cesta-pitanja`, `/en/faq` (booking, payment, deposit, cancellation, final price, check-in, pets, parties, "Provereno uživo"), in footer and sitemap, with Google FAQ data (B8).
- Removed from the list at the owner's request (13 Nov): I1 admin on phone, H4 forgot password, E2 guest confirmation email, E6 longer owner form.

## Done (12 Nov 2026)

- **Data clean-up:** swear-word test description replaced (A1); 12 sample houses hidden (A2); house renamed "Kutak u Vraniću", moved to Beograd (A3); real "Beograd" destination separate from "Vlasina" (A4); destinations with no houses hidden from guests (A7).
- **New pages:** Za vlasnike `/za-vlasnike` (B5), Kontakt `/kontakt` with phone +381 64 477 3663 and info@vikendly.com (B3), Politika privatnosti (B1), Uslovi korišćenja incl. owner terms (B2), site-styled 404 (B6) and error page (B7). Footer links work (C1).
- **Look:** € icon (D1), footer language switcher size (D2), self-updating copyright year (H7).
- **Search:** filter bar + sorting on results (D4), helpful empty-results screen (D3), search by house name.
- **Booking:** Telegram alert for every request/application (E1), privacy notes under forms (E5), spam limits per visitor + DB flood guard (H1), units (several separately rented parts per listing, each with beds, prices, group prices, rules), party-only spaces (e.g. Letnjikovac: price by number of people, weekday/weekend, one-day booking), daytime-guest info for places with beds (E4). Booked dates: **not doing** – owners tell the team (E3).
- **Speed:** photos shrunk on upload (max 2000px) and served at screen size (F1).
- **Google & sharing:** correct canonical/language links (G1), site + phone icons (G2), share pictures (G3), page titles for destination/category searches (G4), domain vikendly.com confirmed as main address (G5), Vercel Analytics added (G6).
- **Security:** security headers (H3); Google Maps cookies mentioned in privacy policy (H2).
- **Admin:** destination address shown correctly when renaming (I5).
