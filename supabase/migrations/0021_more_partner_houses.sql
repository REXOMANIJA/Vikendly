-- Vikendly: 3 more real houses whose owners agreed to be listed (16 Nov 2026)
-- Same as 0020: details and photos from each property's Booking.com page; photos are in
-- public/images/houses/<house>/. Prices are the Booking.com price for 2 people (Nov 2026),
-- converted to EUR – confirm them with each owner and correct them in admin.
-- Run once in Supabase → SQL Editor. Safe to run twice: a house whose slug exists is skipped.

do $$
declare
  h jsonb;
  v_id uuid;
begin
  for h in select * from jsonb_array_elements($json$[
  {
    "slug": "vila-lucic",
    "name": "Vila Lučić",
    "destination_id": "zlatibor",
    "categories": ["mountain", "family"],
    "capacity": 8, "bedrooms": 2, "bathrooms": 2,
    "weekday_price": 52, "weekend_price": 52, "min_nights": 1,
    "parties": false, "pets": true, "smoking": false,
    "check_in": "13:00", "check_out": "10:30",
    "address": "Breza 10, 31315 Zlatibor", "lat": 43.733670380903, "lng": 19.698997932819,
    "amenities": ["wifi", "parking", "kitchen", "bbq", "terrace", "tv", "heating", "washer"],
    "units": [
      {"name": "Studio 1", "capacity": 4, "price": 52, "pets": true},
      {"name": "Studio 2", "capacity": 4, "price": 52, "pets": true}
    ],
    "photos": "vila-lucic",
    "description_sr": "Stara zlatiborska kuća iz sredine prošlog veka, među stogodišnjim borovima, sa velikim privatnim dvorištem – do jezera u centru Zlatibora stiže se za pet minuta hoda. U kući su dva studio apartmana od 28 m², svaki sa izlazom direktno u dvorište. Svaki ima francuski ležaj i razvlačni kauč, kuhinju sa rernom, frižiderom i posuđem, trpezarijski sto, TV i kupatilo sa kadom. U dvorištu su terasa, zidani roštilj, mesta za piknik i ljuljaške za decu, a parking je besplatan. Mirno mesto u šumi, a ipak blizu svega.",
    "description_en": "An old Zlatibor house from the middle of the last century, among hundred-year-old pine trees, with a large private garden – the lake in the centre of Zlatibor is a five-minute walk away. The house has two 28 m² studio apartments, each opening straight onto the garden. Each has a double bed and a sofa bed, a kitchen with an oven, fridge and cookware, a dining table, a TV and a bathroom with a bath. The garden has a terrace, a brick barbecue, picnic spots and swings for children, and parking is free. A quiet spot in the forest, yet close to everything.",
    "rules_sr": "Kućni ljubimci su dozvoljeni na upit (moguća doplata).\nZabranjeno pušenje.\nBez žurki.\nPlaćanje samo gotovinom.",
    "rules_en": "Pets are allowed on request (a charge may apply).\nNo smoking.\nNo parties.\nCash payment only."
  },
  {
    "slug": "blue-river-sojenica",
    "name": "Blue River – sojenica na Dunavu",
    "destination_id": "beograd",
    "categories": ["lake"],
    "capacity": 6, "bedrooms": 2, "bathrooms": 1,
    "weekday_price": 130, "weekend_price": 130, "min_nights": 1,
    "parties": false, "pets": true, "smoking": false,
    "check_in": "14:00", "check_out": "11:00",
    "address": "Rajskih ptica 103a, Palilula, 11000 Beograd", "lat": 44.8439436882629, "lng": 20.5677486406112,
    "amenities": ["wifi", "parking", "kitchen", "bbq", "terrace", "tv", "ac", "heating", "washer"],
    "units": [],
    "photos": "blue-river",
    "description_sr": "Sojenica od 145 m² na samoj obali Dunava, u mirnom delu Beograda, sa pogledom na reku sa svake terase. Ima dve spavaće sobe sa tri bračna kreveta, prostran dnevni boravak, potpuno opremljenu kuhinju sa mašinom za sudove i aparatom za kafu, i kupatilo. Na velikim terasama su trpezarijski sto, ležaljke i roštilj – zalasci sunca nad Dunavom su posebna priča. U prizemlju je sto za stoni tenis, a parking je besplatan. Kućni ljubimci su dobrodošli bez doplate.",
    "description_en": "A 145 m² house on stilts right on the bank of the Danube, in a quiet part of Belgrade, with a river view from every terrace. It has two bedrooms with three double beds, a spacious living room, a fully equipped kitchen with a dishwasher and coffee machine, and a bathroom. The large terraces have a dining table, sun loungers and a barbecue – sunsets over the Danube are something special. Downstairs there is a table-tennis table, and parking is free. Pets are welcome at no extra charge.",
    "rules_sr": "Kućni ljubimci su dobrodošli, bez doplate.\nBez žurki.\nDeca uz reku samo u pratnji odraslih.",
    "rules_en": "Pets are welcome, no extra charge.\nNo parties.\nChildren by the river only with an adult."
  },
  {
    "slug": "etno-selo-komarnica",
    "name": "Etno selo Komarnica",
    "destination_id": "durmitor",
    "categories": ["mountain", "pool", "family"],
    "capacity": 29, "bedrooms": 5, "bathrooms": 5,
    "weekday_price": 55, "weekend_price": 55, "min_nights": 1,
    "parties": false, "pets": true, "smoking": false,
    "check_in": "12:00", "check_out": "10:00",
    "address": "Komarnica, 81450 Šavnik, Crna Gora", "lat": 43.028581390327226, "lng": 19.04538854538569,
    "amenities": ["wifi", "parking", "kitchen", "bbq", "terrace", "tv", "heating"],
    "units": [
      {"name": "Šale sa bazenom", "capacity": 5, "price": 65, "pets": true},
      {"name": "Šale 1", "capacity": 6, "price": 55, "pets": true},
      {"name": "Šale 2", "capacity": 6, "price": 55, "pets": true},
      {"name": "Šale 3", "capacity": 6, "price": 55, "pets": true},
      {"name": "Šale 4", "capacity": 6, "price": 55, "pets": true}
    ],
    "photos": "etno-komarnica",
    "description_sr": "Etno naselje drvenih A-frame šalea u dolini Komarnice, ispod visokih stena na obodu Durmitora – jedno od najlepših i najmirnijih mesta u Crnoj Gori. Svaki šale (43–45 m²) ima spavaću sobu, dnevni boravak sa razvlačnim kaučem, kuhinju, kupatilo, terasu i balkon sa pogledom na planinu. Šale sa bazenom ima i sopstveni bazen. U naselju su mesta za piknik, ognjište i sunčana terasa, a domaćini nude iznajmljivanje ski opreme. Okolina je raj za planinarenje, bicikl i kanjon Nevidio. Kućni ljubimci su dobrodošli bez doplate.",
    "description_en": "An ethno village of wooden A-frame chalets in the Komarnica valley, beneath tall cliffs on the edge of Durmitor – one of the most beautiful and peaceful places in Montenegro. Each chalet (43–45 m²) has a bedroom, a living area with a sofa bed, a kitchen, a bathroom, a terrace and a balcony with a mountain view. The pool chalet also has its own pool. The village has picnic spots, an outdoor fireplace and a sun terrace, and the hosts offer ski equipment hire. The area is a paradise for hiking, cycling and the Nevidio canyon. Pets are welcome at no extra charge.",
    "rules_sr": "Tišina od 22 do 7 h.\nKućni ljubimci su dobrodošli na upit, bez doplate.\nZabranjeno pušenje, bez žurki.\nPlaćanje samo gotovinom.",
    "rules_en": "Quiet hours from 10 pm to 7 am.\nPets are welcome on request, no extra charge.\nNo smoking, no parties.\nCash payment only."
  }
  ]$json$::jsonb)
  loop
    -- Skip houses that are already there (running the file twice changes nothing)
    continue when exists (select 1 from public.houses where slug = h->>'slug');

    insert into public.houses (
      slug, name, destination_id, capacity, bedrooms, bathrooms,
      weekday_price, weekend_price, min_nights,
      description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed,
      check_in_time, check_out_time, address, lat, lng, is_published, rules_sr, rules_en
    ) values (
      h->>'slug', h->>'name', h->>'destination_id',
      (h->>'capacity')::int, (h->>'bedrooms')::int, (h->>'bathrooms')::int,
      (h->>'weekday_price')::numeric, (h->>'weekend_price')::numeric, (h->>'min_nights')::int,
      h->>'description_sr', h->>'description_en',
      (h->>'parties')::boolean, (h->>'pets')::boolean, (h->>'smoking')::boolean,
      h->>'check_in', h->>'check_out', h->>'address',
      (h->>'lat')::double precision, (h->>'lng')::double precision,
      true, h->>'rules_sr', h->>'rules_en'
    )
    returning id into v_id;

    insert into public.house_categories (house_id, category_id)
      select v_id, value from jsonb_array_elements_text(h->'categories');

    insert into public.house_amenities (house_id, amenity_id)
      select v_id, value from jsonb_array_elements_text(h->'amenities');

    -- Photos 01.jpg … 15.jpg in public/images/houses/<folder>/ (01 = cover)
    insert into public.house_photos (house_id, url, sort_order)
      select v_id, format('/images/houses/%s/%s.jpg', h->>'photos', lpad(n::text, 2, '0')), n - 1
      from generate_series(1, 15) as n;

    -- Separate apartments / huts (prices per night for the whole unit)
    insert into public.house_units (
      house_id, sort_order, name, capacity, weekday_price, weekend_price,
      parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time
    )
    select v_id, (ordinality - 1)::int, u->>'name', (u->>'capacity')::int,
      (u->>'price')::numeric, (u->>'price')::numeric,
      false, coalesce((u->>'pets')::boolean, false), false, h->>'check_in', h->>'check_out'
    from jsonb_array_elements(h->'units') with ordinality as list(u, ordinality);
  end loop;
end
$$;
