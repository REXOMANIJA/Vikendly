import { site } from '@/lib/site';

/**
 * Privacy policy and terms of use, in Serbian and English.
 *
 * Written in plain language to match how the site really works (what the forms collect,
 * where it is stored, who sees it). Before launch, have them checked by a lawyer, and fill
 * in the business name and contact details in lib/site.ts.
 */

export type LegalSection = {
  id: string;
  title: string;
  /** Paragraphs, then an optional bullet list, then optional paragraphs after it */
  text: string[];
  list?: string[];
  after?: string[];
};

const contactSr = site.email ? `na email ${site.email}` : 'preko stranice Kontakt';
const contactEn = site.email ? `by email at ${site.email}` : 'through the Contact page';

export const privacy: Record<'sr' | 'en', LegalSection[]> = {
  sr: [
    {
      id: 'ko-smo',
      title: 'Ko obrađuje vaše podatke',
      text: [
        `Sajt Vikendly vodi ${site.operator} (u daljem tekstu: „mi“). Mi odlučujemo zašto i kako se obrađuju podaci koje ostavite na sajtu i odgovorni smo za njih.`,
        `Za sva pitanja o vašim podacima javite nam se ${contactSr}.`,
      ],
    },
    {
      id: 'koje-podatke',
      title: 'Koje podatke prikupljamo',
      text: ['Prikupljamo samo ono što nam sami pošaljete preko formulara na sajtu:'],
      list: [
        'Upit za rezervaciju: ime i prezime, broj telefona, email (ako ga upišete), poruka, datumi boravka, broj osoba i izabrana kuća.',
        'Prijava vlasnika: ime i prezime, broj telefona, lokacija kuće i kratak opis.',
        'Ocena boravka (samo ako vam pošaljemo link posle boravka): ime koje upišete, ocena i komentar. Posle našeg pregleda ime, ocena i komentar se javno prikazuju na stranici kuće.',
        'Zaštita od zloupotrebe: kada pošaljete formular, čuvamo jednosmerno šifrovan zapis vaše internet adrese (IP). Iz njega se ne može pročitati vaša adresa i brišemo ga posle 24 sata.',
      ],
      after: ['Za pregledanje sajta ne morate da ostavljate nikakve podatke i ne pravite nalog.'],
    },
    {
      id: 'zasto',
      title: 'Zašto koristimo podatke',
      text: [],
      list: [
        'Da bismo proverili termin sa vlasnikom kuće i javili vam se u vezi sa upitom.',
        'Da bismo kontaktirali vlasnika koji je prijavio kuću i dogovorili saradnju.',
        'Da bismo sajt zaštitili od lažnih i masovnih slanja formulara.',
      ],
      after: [
        'Osnov za obradu je vaš zahtev: podatke koristimo da bismo uradili ono što ste tražili (radnje pre zaključenja ugovora), kao i naš legitimni interes da sajt zaštitimo od zloupotrebe. Podatke ne prodajemo i ne koristimo ih za reklame.',
      ],
    },
    {
      id: 'ko-vidi',
      title: 'Ko vidi vaše podatke',
      text: [],
      list: [
        'Vikendly tim, u administraciji sajta.',
        'Vlasnik kuće: kada je potrebno da se dogovorite o boravku, prosleđujemo mu vaše ime i broj telefona.',
        'Pružaoci usluga koje koristimo za rad sajta: Supabase (baza podataka), Vercel (hosting sajta) i Telegram (obaveštenja timu o novom upitu ili prijavi). Oni podatke čuvaju i prenose po našem nalogu i ne koriste ih za svoje potrebe.',
      ],
      after: [
        'Neki od ovih pružalaca usluga imaju servere van Srbije (u Evropskoj uniji ili SAD). Sa njima radimo pod njihovim standardnim uslovima za zaštitu podataka.',
      ],
    },
    {
      id: 'koliko-dugo',
      title: 'Koliko dugo čuvamo podatke',
      text: [
        'Upite i prijave čuvamo najduže 24 meseca od slanja, da bismo mogli da odgovorimo na pitanja o boravku ili saradnji, a zatim ih brišemo. Ranije ih brišemo ako to zatražite. Šifrovani zapis internet adrese brišemo posle 24 sata.',
      ],
    },
    {
      id: 'kolacici',
      title: 'Kolačići i mapa',
      text: [
        'Bez vaše dozvole sajt ne koristi kolačiće za praćenje ni reklame. Pamti samo ono što je neophodno za rad (na primer prijavu Vikendly tima u administraciju i vaš izbor o kolačićima).',
        'Meta Pixel (Facebook i Instagram): samo ako u obaveštenju o kolačićima izaberete „Prihvatam“, učitavamo alat kompanije Meta koji meri koliko nam reklame na Facebooku i Instagramu pomažu. Meta tada može da postavi svoje kolačiće, vidi vašu internet adresu i stranice koje otvorite na sajtu, i da li ste poslali upit ili prijavu. Vaše ime, telefon i email nikada ne šaljemo kompaniji Meta. Meta te podatke obrađuje prema svojoj politici privatnosti (facebook.com/privacy/policy), a servere ima i van Srbije. Dozvolu možete povući bilo kada preko linka „Podešavanja kolačića“ na dnu sajta.',
        'Kuće koje sačuvate srcem pamte se samo u vašem pregledaču, na vašem uređaju. Mi ih ne vidimo i ne šaljemo nigde.',
        'Broj poseta merimo alatom Vercel Web Analytics, koji ne koristi kolačiće i ne prepoznaje pojedinačne posetioce: vidimo samo zbirne brojke, na primer koliko je ljudi posetilo neku stranicu i iz koje zemlje.',
        'Na stranici kuće prikazujemo Google mapu sa lokacijom. Kada se mapa učita, Google može da postavi svoje kolačiće i vidi vašu internet adresu, prema svojoj politici privatnosti (policies.google.com/privacy).',
      ],
    },
    {
      id: 'prava',
      title: 'Vaša prava',
      text: ['Po Zakonu o zaštiti podataka o ličnosti imate pravo da:'],
      list: [
        'saznate koje podatke o vama imamo i dobijete njihovu kopiju,',
        'tražite da ispravimo netačne podatke,',
        'tražite da obrišemo vaše podatke,',
        'uložite prigovor na obradu ili tražite da je ograničimo.',
      ],
      after: [
        `Zahtev nam pošaljite ${contactSr}. Odgovaramo u roku od 30 dana.`,
        'Ako mislite da vaše podatke obrađujemo nezakonito, možete podneti pritužbu Povereniku za informacije od javnog značaja i zaštitu podataka o ličnosti (www.poverenik.rs).',
      ],
    },
    {
      id: 'izmene',
      title: 'Izmene ove politike',
      text: [
        'Ako promenimo način na koji obrađujemo podatke, ažuriraćemo ovu stranicu i datum poslednje izmene na vrhu.',
      ],
    },
  ],
  en: [
    {
      id: 'who-we-are',
      title: 'Who handles your data',
      text: [
        `Vikendly is run by ${site.operator} (“we”). We decide why and how the details you leave on the site are used, and we are responsible for them.`,
        `For any question about your data, contact us ${contactEn}.`,
      ],
    },
    {
      id: 'what-we-collect',
      title: 'What we collect',
      text: ['We only collect what you send us through the forms on the site:'],
      list: [
        'Booking request: name, phone number, email (if you add it), message, dates, number of guests and the house.',
        'Owner application: name, phone number, location of the house and a short description.',
        'Review of your stay (only if we send you a link after your stay): the name you type, your rating and comment. After we read it, the name, rating and comment are shown publicly on the house page.',
        'Abuse protection: when you send a form, we keep a one-way scrambled record of your internet (IP) address. Your address cannot be read from it, and we delete it after 24 hours.',
      ],
      after: ['You don’t need to give any details or create an account to browse the site.'],
    },
    {
      id: 'why',
      title: 'Why we use it',
      text: [],
      list: [
        'To check the dates with the house owner and get back to you about your request.',
        'To contact owners who applied and agree on working together.',
        'To protect the site from fake and mass form submissions.',
      ],
      after: [
        'We use your details because you asked us to (steps before a contract), and because of our legitimate interest in protecting the site from abuse. We never sell your data or use it for advertising.',
      ],
    },
    {
      id: 'who-sees-it',
      title: 'Who sees your data',
      text: [],
      list: [
        'The Vikendly team, in the site’s admin panel.',
        'The house owner: when you need to agree on your stay, we pass on your name and phone number.',
        'Services that run the site: Supabase (database), Vercel (hosting) and Telegram (alerts to our team about a new request or application). They store and send data on our behalf and don’t use it for their own purposes.',
      ],
      after: [
        'Some of these services have servers outside Serbia (in the EU or the USA). We use them under their standard data protection terms.',
      ],
    },
    {
      id: 'how-long',
      title: 'How long we keep it',
      text: [
        'We keep requests and applications for up to 24 months after they are sent, so we can answer questions about a stay or our cooperation, and then delete them. We delete them sooner if you ask. The scrambled IP record is deleted after 24 hours.',
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies and the map',
      text: [
        'Without your permission the site uses no tracking or advertising cookies. It only stores what it needs to work (for example, the Vikendly team’s admin login and your cookie choice).',
        'Meta Pixel (Facebook and Instagram): only if you choose “Accept” in the cookie notice, we load a Meta tool that measures how well our Facebook and Instagram ads work. Meta may then set its own cookies and see your internet address, the pages you open on the site, and whether you sent a request or application. We never send your name, phone number or email to Meta. Meta handles this data under its own privacy policy (facebook.com/privacy/policy) and has servers outside Serbia. You can withdraw permission at any time through the “Cookie settings” link at the bottom of the site.',
        'Houses you save with the heart are kept only in your browser, on your device. We never see them or send them anywhere.',
        'We count visits with Vercel Web Analytics, which uses no cookies and cannot recognise individual visitors: we only see totals, such as how many people visited a page and from which country.',
        'House pages show a Google map of the location. When the map loads, Google may set its own cookies and see your internet address, under its own privacy policy (policies.google.com/privacy).',
      ],
    },
    {
      id: 'your-rights',
      title: 'Your rights',
      text: ['Under the Serbian Law on Personal Data Protection you can:'],
      list: [
        'find out what data we hold about you and get a copy,',
        'ask us to correct it,',
        'ask us to delete it,',
        'object to its use or ask us to limit it.',
      ],
      after: [
        `Send your request ${contactEn}. We reply within 30 days.`,
        'If you think we handle your data unlawfully, you can complain to the Commissioner for Information of Public Importance and Personal Data Protection (www.poverenik.rs).',
      ],
    },
    {
      id: 'changes',
      title: 'Changes to this policy',
      text: ['If we change how we handle data, we will update this page and the date at the top.'],
    },
  ],
};

export const terms: Record<'sr' | 'en', LegalSection[]> = {
  sr: [
    {
      id: 'o-sajtu',
      title: 'O Vikendly-ju',
      text: [
        `Vikendly je katalog vikend kuća koji vodi ${site.operator}. Mi nismo vlasnici kuća: povezujemo goste sa vlasnicima, proveravamo termine i prenosimo dogovor. Korišćenjem sajta prihvatate ove uslove.`,
      ],
    },
    {
      id: 'upit',
      title: 'Upit nije rezervacija',
      text: [
        'Upit koji pošaljete sa stranice kuće je besplatan i ne obavezuje vas. Rezervacija postoji tek kada vam potvrdimo termin posle razgovora sa vlasnikom i kada se sa vlasnikom dogovorite o uslovima boravka.',
      ],
    },
    {
      id: 'cene',
      title: 'Cene',
      text: [
        'Cena prikazana na sajtu je ukupna cena boravka za izabrane datume i broj osoba, po cenovniku koji je odredio vlasnik. Trudimo se da cene budu tačne, ali vlasnik ih može promeniti. Važi cena koju vam potvrdimo pri potvrdi termina.',
        'Plaćanje, depozit i otkazivanje dogovarate direktno sa vlasnikom, po njegovim uslovima, koje vam saopštavamo pre potvrde.',
      ],
    },
    {
      id: 'boravak',
      title: 'Boravak i pravila kuće',
      text: [
        'Za vreme boravka važe pravila kuće navedena na njenoj stranici (vreme dolaska i odlaska, žurke, ljubimci, pušenje, broj osoba). Odgovornost za kuću i za tačnost podataka o njoj ima vlasnik. Gost odgovara za štetu koju napravi tokom boravka.',
      ],
    },
    {
      id: 'provereno',
      title: 'Oznaka „Provereno uživo“',
      text: [
        'Oznaka znači da je neko iz Vikendly tima bio u kući i proverio da odgovara oglasu na dan posete. Ona ne garantuje stanje kuće u svakom budućem trenutku. Ako kuća ne odgovara oglasu, javite nam se i proverićemo.',
      ],
    },
    {
      id: 'vlasnici',
      title: 'Uslovi za vlasnike',
      text: ['Vlasnik koji objavljuje kuću na Vikendly-ju prihvata da:'],
      list: [
        'je objava besplatna, a Vikendly naplaćuje proviziju na rezervacije koje dovede; visina provizije se dogovara pre objave i potvrđuje pisanim putem,',
        'su podaci, cene, pravila i fotografije koje daje tačni i da ima pravo da ih koristi,',
        'nam na vreme javlja zauzete termine i promene cena,',
        'podatke gostiju koristi samo za dogovor i realizaciju tog boravka,',
        'Vikendly može ukloniti oglas ili oznaku „Provereno uživo“ ako podaci nisu tačni ili ako gosti prijave ozbiljne probleme.',
      ],
      after: ['Vlasnik može tražiti uklanjanje oglasa u bilo kom trenutku, bez troškova.'],
    },
    {
      id: 'odgovornost',
      title: 'Odgovornost',
      text: [
        'Vikendly ne odgovara za odnos između gosta i vlasnika, za stanje kuće ni za štetu nastalu tokom boravka, osim ako je nastala našom krivicom. Sadržaj sajta (tekstove, fotografije, logo) ne smete kopirati bez naše dozvole.',
      ],
    },
    {
      id: 'izmene',
      title: 'Izmene i merodavno pravo',
      text: [
        'Ove uslove možemo menjati; važi verzija objavljena na ovoj stranici u trenutku slanja upita. Na ove uslove primenjuje se pravo Republike Srbije.',
        `Pitanja o uslovima pošaljite nam ${contactSr}.`,
      ],
    },
  ],
  en: [
    {
      id: 'about',
      title: 'About Vikendly',
      text: [
        `Vikendly is a catalogue of weekend houses run by ${site.operator}. We don’t own the houses: we connect guests with owners, check dates and pass on the arrangement. By using the site you accept these terms.`,
      ],
    },
    {
      id: 'request',
      title: 'A request is not a booking',
      text: [
        'A request sent from a house page is free and doesn’t commit you to anything. A booking exists only once we confirm the dates after talking to the owner, and you and the owner agree on the terms of the stay.',
      ],
    },
    {
      id: 'prices',
      title: 'Prices',
      text: [
        'The price shown is the total for the chosen dates and number of guests, based on the owner’s price list. We do our best to keep prices accurate, but owners can change them. The price we give you when confirming the dates is the one that applies.',
        'Payment, deposit and cancellation are agreed directly with the owner, on their terms, which we tell you before confirming.',
      ],
    },
    {
      id: 'stay',
      title: 'Your stay and house rules',
      text: [
        'The house rules on the house page apply during your stay (check-in and check-out times, parties, pets, smoking, number of guests). The owner is responsible for the house and for the accuracy of its details. Guests are responsible for any damage they cause.',
      ],
    },
    {
      id: 'verified',
      title: 'The “Verified in person” badge',
      text: [
        'The badge means someone from the Vikendly team visited the house and checked that it matched the listing on that day. It is not a guarantee of the house’s condition at every later moment. If a house doesn’t match its listing, tell us and we will look into it.',
      ],
    },
    {
      id: 'owners',
      title: 'Terms for owners',
      text: ['Owners who list a house on Vikendly agree that:'],
      list: [
        'listing is free, and Vikendly charges a commission on bookings it brings; the rate is agreed before the listing goes live and confirmed in writing,',
        'the details, prices, rules and photos they provide are accurate and theirs to use,',
        'they tell us about taken dates and price changes in good time,',
        'they use guests’ details only to arrange and host that stay,',
        'Vikendly may remove a listing or its “Verified in person” badge if details are inaccurate or guests report serious problems.',
      ],
      after: ['Owners can ask for their listing to be removed at any time, at no cost.'],
    },
    {
      id: 'liability',
      title: 'Liability',
      text: [
        'Vikendly is not responsible for the relationship between guest and owner, the condition of the house or damage during a stay, unless caused by our fault. You may not copy the site’s content (texts, photos, logo) without our permission.',
      ],
    },
    {
      id: 'changes',
      title: 'Changes and governing law',
      text: [
        'We may change these terms; the version published on this page when you send a request applies. These terms are governed by the law of the Republic of Serbia.',
        `Questions about these terms: contact us ${contactEn}.`,
      ],
    },
  ],
};
