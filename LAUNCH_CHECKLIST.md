| ~~H7~~ | ✅ | **Done 12 Nov.** Was: | ~~D2~~ | ✅ | **Done 12 Nov.** Was: | ~~H1~~ | ✅ | **Done 12 Nov:** max 5 requests / 3 applications per hour per visitor, plus a flood guard in the database. Needs migration 0009. Was: | ~~G4~~ | ✅ | **Done 12 Nov:** e.g. "Vikend kuće – Beograd | Vikendly". Was: | ~~G2~~ | ✅ | **Done 12 Nov:** site icon + phone home-screen icon. Was: | ~~G1~~ | ✅ | **Done 12 Nov:** every page declares its own address in both languages; filtered searches are not listed. Was: | ~~F1~~ | ✅ | **Done 12 Nov:** photos are shrunk to max 2000px before upload, and visitors get screen-sized versions (house page on a phone: 3.4 MB → 183 KB). Was: | ~~E5~~ | ✅ | **Done 12 Nov:** short privacy note with a link under both forms. Was: | ~~E1~~ | ✅ | **Done 12 Nov:** Telegram message for every new request and application. Works once TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set. Was: | ~~C1~~ | ✅ | **Done 12 Nov:** footer links go to the new pages (O nama removed until that page exists). Was: | ~~B5~~ | ✅ | **Done 12 Nov:** /za-vlasnike (/for-owners): how it works, what you get, cost (commission only on bookings, free listing), what we need, FAQ, form. Header button now goes here. Was: | ~~B3~~ | ✅ | **Page done 12 Nov** (/kontakt): still needs your email, phone and Instagram in `lib/site.ts`. Was: | ~~B2~~ | ✅ | **Done 12 Nov:** /uslovi-koriscenja and /terms, with a section for owners (commission per booking). Was: | ~~B1~~ | ✅ | **Done 12 Nov:** /privatnost and /privacy. Have a lawyer check it before launch. Was: # Vikendly – launch checklist

Site review on 12 Nov 2026, local preview, desktop (1280px) and phone (375px), Serbian and English.
Admin panel was reviewed from the code only (not logged in), so it still needs a check on screen.

**Priority**
- **P0** – must be fixed before the site goes to clients
- **P1** – should be done for launch
- **P2** – can come after launch

What works well already (no action needed): all 82 internal links open correctly, nothing scrolls sideways
on phones, both languages have every text, the calendar, search, verified badge, photo viewer, map, page
animations and the phone menu all work.

---

## A. Content and data (what visitors actually see)

| # | Pri | Problem | Where |
|---|-----|---------|-------|
| ~~A1~~ | ✅ | **Done 12 Nov:** new description written (SR + EN) from the house's own details. Was: the only real house has test text with a swear word as its description: "Jebem ti majku sto dobra kuca". It shows on the page, in both languages, and as the Google / share preview text. | Kutak u vranicu → description |
| ~~A2~~ | ✅ | **Done 12 Nov:** all 12 hidden (not deleted; they can be deleted in admin later). Was: 12 of the 13 houses are made-up sample listings with drawn pictures instead of photos (Vila Ribnica, Brvnara na Drini, Planinska kuća Pančić, …). They fill the homepage, search and "Slične kuće". Clients and guests would think the site is fake. | Admin → Kuće |
| ~~A3~~ | ✅ | **Done 12 Nov:** renamed to "Kutak u Vraniću" and moved to Beograd (web address unchanged). Was: "Kutak u vranicu": filed under **Kopaonik**, but its address and map pin are in **Vranić** (near Belgrade). The name should probably be "Kutak u Vraniću" (capital V, ć). | Kutak u vranicu |
| ~~A4~~ | ✅ | **Done 12 Nov:** created a real "Beograd" (`?destination=beograd`, same photo) and turned the old entry back into "Vlasina" (with its drawing). Was: Destination "Beograd" is really the old Vlasina destination renamed, so "Kuća kod Vlasinskog jezera" shows under Beograd. | Admin → Destinacije |
| A5 | P1 | No English descriptions: English pages show the Serbian text. | All houses → description (EN) |
| A6 | P1 | "Zašto Vikendly?" section uses a drawn placeholder picture instead of a real photo. | Homepage |
| A7 | P1 | Destination counts ("3 kuće", "2 kuće") count the sample houses, so they will drop when samples are removed. Destinations with 0 houses still show on the homepage. | Homepage, Destinacije |

## B. Pages that are missing

| # | Pri | Problem |
|---|-----|---------|
| B1 | P0 | **Privacy policy (Politika privatnosti)** – required by law (ZZPL) because both forms collect name and phone. |
| B2 | P0 | **Terms of use (Uslovi korišćenja)** – for guests, and separate **terms for owners** (what you charge, what you promise, how a listing is removed). |
| B3 | P0 | **Contact (Kontakt)** – there is no phone, email, WhatsApp/Viber or Instagram anywhere on the site. |
| B4 | P1 | **About us (O nama)** – who is behind Vikendly. Important for trust, especially for owners. |
| B5 | P0 | **Owner page (Za vlasnike)** – owners you send the site to only get a 4-field form at the bottom of the homepage. They need: how it works, **what it costs (commission/fee)**, what you need from them (photos, prices, rules), the visit/verification, FAQ, and the form. |
| B6 | P1 | **404 page** – a wrong address shows Next.js's default black English page with no header, no logo and no way back. |
| B7 | P1 | **Error page** – if the database is down, visitors get a raw error. Needs a friendly "Something went wrong, try again" page. |
| B8 | P2 | FAQ for guests (deposit, cancellation, check-in, pets, parties). |

## C. Buttons and links that don't work

| # | Pri | Problem | Where |
|---|-----|---------|-------|
| C1 | P0 | Footer "O nama, Kontakt, Uslovi korišćenja, Privatnost" look like links but are plain text (the pages don't exist, see B1–B4). | Footer, every page |
| C2 | P1 | Header "Kuće" goes to the 6 featured houses on the homepage, not to all houses. | Header |
| C3 | P2 | The map card on the house page shows Google's Cyrillic text ("Отвори у Мапама") and Cyrillic place names. | House page → Lokacija |

## D. Design and layout mistakes

| # | Pri | Problem | Where |
|---|-----|---------|-------|
| D1 | P1 | The "Ukupna cena unapred" icon is a receipt with a **$** sign; the site uses euros. | Homepage hero + "Zašto Vikendly" |
| D2 | P1 | Footer language switcher (SR/EN) is stretched across the whole column / whole phone width. | Footer |
| D3 | P1 | Empty search result is one grey line in a big empty page. Should suggest clearing filters, other destinations or popular houses. | Search, no results |
| D4 | P1 | Search results page has no filters or sorting: you can't change destination, dates or guests without going back to the homepage, and you can't sort by price or size. | Search page |
| D5 | P2 | On phones the homepage is very long (about 9,500px) because the 6 featured houses are stacked one under another. A sideways-swipe row would be shorter. | Homepage, phone |
| D6 | P2 | On phones the sticky "Pošaljite upit" bar stays on screen while you fill the form it points to, covering the bottom of the form. | House page, phone |
| D7 | P2 | Clicking a link on a slow connection shows no sign that the next page is loading. A thin progress bar would help. | All pages |
| D8 | P2 | Gosti / Budžet fields show grey sample numbers ("2", "500") that look like already-filled values. | Search bar |

## E. Booking and features that are missing

| # | Pri | Problem |
|---|-----|---------|
| E1 | P0 | **Nobody is notified of new requests.** Booking requests and owner applications only land in the admin, and you have to keep checking. Needs an email (or Telegram/Viber) message to you for every new one. |
| E2 | P1 | The guest gets no confirmation (email/SMS) that the request was received. |
| E3 | P1 | **No availability:** guests can't see which dates are already booked. At least a simple "booked dates" list per house in admin, shown as crossed-out days in the calendar. |
| E4 | P1 | **Parties / day use can't be requested.** A house with "Žurka ili druženje: do 25 osoba" only accepts 1–6 guests in the request form, and there is no party/day price. |
| E5 | P1 | Booking request form has no privacy notice ("Vaše podatke koristimo samo da bismo vas kontaktirali…") with a link to the privacy policy. Same for the owner form. |
| E6 | P2 | Owners can't upload photos or details themselves; you enter everything in admin. Fine for the start, but a longer owner form (photos, prices, capacity) would save you time. |
| E7 | P2 | Reviews/ratings from guests. |
| E8 | P2 | Save favourites / share a house link (WhatsApp share button). |

## F. Speed

| # | Pri | Problem |
|---|-----|---------|
| F1 | P0 | **Photos are not resized.** Every page downloads the full original photos: the Kutak u vranicu page loads **3.4 MB of photos**, even on a phone. Admin accepts uploads up to 8 MB each, so a house with 15 phone photos could be 50+ MB. Fix: resize/compress on upload and let Next.js serve smaller versions. |
| F2 | P2 | No caching headers tuned for photos in Supabase Storage. |

## G. Google, sharing and analytics

| # | Pri | Problem |
|---|-----|---------|
| G1 | P0 | **Wrong "canonical" link:** the Destinacije page and every search page tell Google they are copies of the homepage, so Google won't show them. |
| G2 | P0 | **No site icon (favicon)** in the browser tab, and no icon for "Add to home screen". |
| G3 | P1 | **No share picture:** sending the homepage, Destinacije or a search link on Viber/WhatsApp/Facebook shows no image. Only house pages have one. |
| G4 | P1 | Search pages have no own title (all say the homepage title). Destination searches should be titled e.g. "Vikend kuće Zlatibor \| Vikendly". |
| G5 | P1 | Domain: the site assumes **vikendly.com** for links, sitemap and sharing. Confirm that this is the real domain on Vercel. |
| G6 | P1 | No visitor statistics (e.g. Vercel Analytics or Plausible), so you won't know how many people visit or which houses get requests. |
| G7 | P2 | Google Search Console setup + submit sitemap after launch. |
| G8 | P2 | House pages could carry Google "rich result" data (price, location, photos). |

## H. Security, legal and running the site

| # | Pri | Problem |
|---|-----|---------|
| H1 | P0 | Spam protection on both forms is only a hidden trap field. One bot could fill admin with thousands of fake requests. Needs a limit per visitor and/or a free invisible check (Cloudflare Turnstile). |
| H2 | P1 | The embedded Google Map sets Google cookies. Under Serbian/EU privacy rules this needs to be mentioned in the privacy policy, or the map shown only after a click. |
| H3 | P1 | Standard security headers are not set (protects against the site being framed by others, etc.). |
| H4 | P1 | Admin login has no "Forgot password". If the password is lost, it can only be reset in the Supabase dashboard. |
| H5 | P1 | Supabase free plan: the database is **paused after a week without activity** and has no automatic backups. For a live site: check the plan, or at least set up a regular backup. |
| H6 | P2 | No error alerts: if something breaks on the live site, nobody is told. |
| H7 | P2 | Copyright year "© 2026" is fixed text; should update itself. |

## I. Admin panel (needs a check on screen)

| # | Pri | Problem |
|---|-----|---------|
| I1 | P1 | Admin hasn't been checked on a phone, where you'll likely use it most (requests, calling owners). Log in once in the preview and I'll go through it. |
| I2 | P2 | Owner application → "create house from this application" button, so the name/phone/location are filled in automatically. |
| I3 | P2 | Booking requests: a "call" button (tel: link) and a WhatsApp/Viber link next to the guest's phone. |
| I5 | P1 | Renaming a destination doesn't change its web address (`?destination=…`), but the edit form shows an address made from the *new* name, which is wrong. This is how "Beograd" ended up as `?destination=vlasina`. Either show the real address or say it can't change. |
| I4 | P2 | Count of new requests/applications in the admin menu (red badge). |

---

## Suggested order

1. **Clean the data:** A1, A2, A3, A4 (you, in admin; I can help remove the samples)
2. **Can't launch without:** B1, B2, B3, B5, C1, E1, E5, F1, G1, G2, H1
3. **Launch polish:** B4, B6, B7, D1–D4, E2–E4, G3–G6, H2–H5, I1
4. **After launch:** everything marked P2
