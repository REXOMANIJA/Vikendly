# UI / UX improvements – task list

Review of the public site on 13 Nov 2026 (desktop 1280×800 and phone 375×812, Serbian, local preview
with sample houses). Admin pages and the English version were not reviewed.

Priority: **P1** = clearly helps guests send a request, do first · **P2** = noticeable polish ·
**P3** = nice to have.

Mark a task done by changing `[ ]` to `[x]`.

---

## 1. Booking box on the house page (most important – this is where requests come from)

- [x] **U1 · P1 · Dates first, then units.** In "Pošaljite upit za rezervaciju" the guest must first
  tick units (Letnjikovac / Brvnara / Kuća sa balkonom), then pick dates. People think "when?" first.
  Put the date picker (and number of guests) at the top, then the unit choice, then the price.
  File: `components/house/PriceCalculator.tsx`.
- [x] **U2 · P1 · Suggest units automatically.** After dates + number of guests are chosen, pre-tick
  the cheapest combination that fits (the same one the cards already use, `quoteStay`), so the guest
  sees a total price immediately and only changes it if they want.
- [x] **U3 · P1 · Show the price before asking for name and phone.** Today the name/phone/email/message
  fields are visible before any price appears, which makes the box look long and "form-like". Show
  the contact fields only after a price is calculated (or collapse them under "Nastavi").
- [x] **U6 · P2 · Same weekday and weekend price shown twice.** Unit cards show "€63 / €63 po noći".
  When both prices are equal show just "€63 po noći" (`perNight` in `HouseUnits.tsx`).

## 2. House page

- [x] **U8 · P2 · "Pravila kuće" looks empty.** For Kutak u Vraniću it shows only "Najkraći boravak: 1 noć",
  while arrival/departure times are hidden inside the unit cards. Always show check-in / check-out,
  parties, pets and smoking in the rules section (as "da / ne / po dogovoru"), even for houses with units.
- [x] **U9 · P2 · Amenities take a lot of space on phone.** 10 large two-column tiles. Show the first 6
  and a "Prikaži sve (10)" button, or use a compact list with small icons.
- [x] **U10 · P2 · Sticky section links on desktop.** The page is long (description, amenities, units,
  rules, reviews, map). A small row of links under the gallery – "Opis · Sadržaj · Delovi · Pravila ·
  Utisci · Lokacija" – helps guests jump.
- [x] **U11 · P3 · Distance info under the map.** e.g. "45 min od centra Beograda", nearest shop/lake.
  Needs a new optional field per house (owner fills in admin).

## 3. Search page (`/search`)

- [x] **U12 · P1 · Filters stay reachable while scrolling.** The filter box scrolls away; to change dates
  after looking at 6 cards the guest must scroll back up. Make a slim sticky bar (dates · guests ·
  "Filteri") on desktop and a floating "Filteri" button on phone.
- [x] **U13 · P2 · "Naziv kuće" as the first field is unusual.** Guests rarely know a house name. Order
  the fields Destinacija → Datumi → Gosti → Budžet, and move name search to the end (or make it a
  small search icon). Same on the homepage hero search.
- [x] **U15 · P2 · Localized URL.** Serbian search page is `/sr/search`; make it `/sr/pretraga`
  (`i18n/routing.ts`, keep `/search` redirecting).
- [x] **U16 · P2 · `/sr/kuce` shows a 404.** People who shorten the URL of a house page land on "Stranica
  ne postoji". Redirect `/kuce` and `/houses` to the search page.
- [x] **U17 · P3 · Map view of results.** Toggle "Lista / Mapa" once there are 10+ real houses.

## 4. Homepage

- [x] **U21 · P2 · Owner form on the homepage.** The full owner application form at the bottom of the
  homepage is replaced with a short banner "Imate vikend kuću? → Izdajte svoju kuću" that leads to
  `/za-vlasnike` (the full form lives there). Guests are the main audience of the homepage.

The other review items (U4, U5, U7, U14, U18–U20, U22–U30 and the rest of U21) were dropped by the
owner on 13 Nov 2026.
