-- Vikendly: 5 real houses whose owners agreed to be listed (16 Nov 2026)
-- Details and photos come from each property's Booking.com page; photos are in
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
    "slug": "brvnara-miris-bora",
    "name": "Brvnara Miris Bora",
    "destination_id": "tara",
    "categories": ["mountain", "pool", "family"],
    "capacity": 14, "bedrooms": 4, "bathrooms": 3,
    "weekday_price": 61, "weekend_price": 61, "min_nights": 1,
    "parties": false, "pets": false, "smoking": false,
    "check_in": "14:00", "check_out": "11:00",
    "address": "Račanska Šljivovica, 31244 Šljivovica", "lat": 43.9049150722883, "lng": 19.5088964036015,
    "amenities": ["wifi", "parking", "kitchen", "bbq", "terrace", "tv", "ac", "heating"],
    "units": [
      {"name": "Dvosoban apartman", "capacity": 6, "price": 65},
      {"name": "Apartman 1", "capacity": 4, "price": 61},
      {"name": "Apartman 2", "capacity": 4, "price": 61}
    ],
    "photos": "miris-bora",
    "description_sr": "Brvnara na velikom privatnom imanju od preko 5.000 m², okružena borovom šumom Nacionalnog parka Tara. Podeljena je na tri potpuno odvojena apartmana, svaki sa svojim ulazom, kuhinjom, kupatilom, spavaćim sobama i dnevnom sobom – možete uzeti jedan ili celu brvnaru za ekipu do 14 osoba. Dvosoban apartman ima dve spavaće sobe i dnevnu sobu sa pogledom na šumu. Gosti koriste sezonski bazen sa pogledom na planinu, dečje igralište i natkrivenu letnju kuhinju sa roštiljem i toaletom za do 14 osoba. Svaki apartman ima svoju baštensku garnituru i ležaljke, a parking je ispred kuće.",
    "description_en": "A log cabin on a large private estate of over 5,000 m², surrounded by the pine forest of Tara National Park. It is split into three completely separate apartments, each with its own entrance, kitchen, bathroom, bedrooms and living room – take one, or the whole cabin for a group of up to 14. The two-bedroom apartment has two bedrooms and a living room looking out on the forest. Guests share a seasonal pool with a mountain view, a children's playground and a covered outdoor pavilion with a barbecue and toilet for up to 14 people. Every apartment has its own garden furniture and sun loungers, and parking is right in front of the house.",
    "rules_sr": "Tišina od 22 do 9 h.\nPlaćanje samo gotovinom.\nBazen radi sezonski (leti).\nKrevetac za bebe do 3 godine besplatno, na upit.",
    "rules_en": "Quiet hours from 10 pm to 9 am.\nCash payment only.\nThe pool is open in season (summer).\nA free cot for babies up to 3 on request."
  },
  {
    "slug": "brvnara-tarski-proplanak",
    "name": "Brvnara Tarski proplanak",
    "destination_id": "tara",
    "categories": ["mountain"],
    "capacity": 4, "bedrooms": 1, "bathrooms": 1,
    "weekday_price": 105, "weekend_price": 105, "min_nights": 1,
    "parties": false, "pets": false, "smoking": false,
    "check_in": "14:00", "check_out": "10:30",
    "address": "Mala Reka 335, 31257 Kaluđerske Bare", "lat": 43.906807643500244, "lng": 19.542633440926597,
    "amenities": ["wifi", "parking", "kitchen", "bbq", "terrace", "tv", "ac", "heating"],
    "units": [],
    "photos": "tarski-proplanak",
    "description_sr": "Nova A-frame brvnara od 53 m² na proplanku kod Kaluđerskih Bara, u srcu Tare. Kroz ogroman stakleni zid uživate u pogledu na livade i šumu, a uveče na zalazak sunca nad planinom. U prizemlju je dnevni boravak sa razvlačnim kaučem i opremljena kuhinja sa trpezarijom, a na galeriji spavaća soba sa francuskim i jednim singl krevetom. Ispred kuće su terasa sa baštenskim nameštajem i roštilj, a parking je u dvorištu. Mirna ulica, a pešačke staze Tare počinju u blizini.",
    "description_en": "A new 53 m² A-frame cabin in a meadow near Kaluđerske Bare, in the heart of Tara. Through the huge glass wall you look out over meadows and forest, and in the evening at the sunset over the mountain. Downstairs there is a living area with a sofa bed and a kitchen with a dining table; the gallery upstairs is a bedroom with a double and a single bed. In front of the house there is a terrace with garden furniture and a barbecue, and parking in the yard. A quiet street, with Tara's walking trails starting nearby.",
    "rules_sr": "Bez kućnih ljubimaca.\nZabranjeno pušenje.\nPlaćanje gotovinom.\nKrevetac za bebe do 2 godine besplatno, na upit.",
    "rules_en": "No pets.\nNo smoking.\nCash payment.\nA free cot for babies up to 2 on request."
  },
  {
    "slug": "konak-kod-munje",
    "name": "Konak kod Munje",
    "destination_id": "tara",
    "categories": ["mountain", "family"],
    "capacity": 6, "bedrooms": 2, "bathrooms": 2,
    "weekday_price": 60, "weekend_price": 60, "min_nights": 1,
    "parties": false, "pets": false, "smoking": false,
    "check_in": "10:00", "check_out": "18:00",
    "address": "Jasikovice, Kaluđerske Bare, 31257 Omar", "lat": 43.89946330604465, "lng": 19.591724873430167,
    "amenities": ["wifi", "parking", "kitchen", "bbq", "terrace", "tv", "ac", "heating"],
    "units": [],
    "photos": "konak-kod-munje",
    "description_sr": "Vila od 70 m² u etno naselju kod Kaluđerskih Bara na Tari, sa pogledom na planinu. Ima dve spavaće sobe (bračni krevet i dva singl kreveta), dva kupatila i prostranu dnevnu sobu sa dva razvlačna kauča, kuhinjom i peći na drva. U uređenom dvorištu su natkrivena terasa, sto pod suncobranom, roštilj i dečje igralište sa ljuljaškama. Na imanju je i drvena sala sa šankom, koja se može iznajmiti za proslave do 50 osoba. Mirno mesto, idealno za porodice, a zimi su u blizini skijanje i sankanje.",
    "description_en": "A 70 m² villa in an ethno-style settlement near Kaluđerske Bare on Tara, with a mountain view. It has two bedrooms (a double bed and two single beds), two bathrooms and a spacious living room with two sofa beds, a kitchen and a wood-burning stove. The landscaped garden has a covered terrace, a table under a parasol, a barbecue and a children's playground with swings. On the property there is also a wooden hall with a bar that can be hired for celebrations of up to 50 people. A quiet place, ideal for families; in winter skiing and sledging are close by.",
    "rules_sr": "Bez kućnih ljubimaca.\nPlaćanje samo gotovinom.\nSala za proslave do 50 osoba – na upit.\nKrevetac za bebe do 3 godine besplatno, na upit.",
    "rules_en": "No pets.\nCash payment only.\nHall for celebrations of up to 50 people – on request.\nA free cot for babies up to 3 on request."
  },
  {
    "slug": "dobrila-apartmani",
    "name": "Dobrila apartmani",
    "destination_id": "zlatibor",
    "categories": ["apartment", "family"],
    "capacity": 5, "bedrooms": 2, "bathrooms": 2,
    "weekday_price": 22, "weekend_price": 22, "min_nights": 1,
    "parties": false, "pets": false, "smoking": false,
    "check_in": "13:00", "check_out": "10:30",
    "address": "Vojvođanska 44, 31315 Zlatibor", "lat": 43.736007454359445, "lng": 19.702544510364532,
    "amenities": ["wifi", "parking", "kitchen", "terrace", "tv", "heating", "washer"],
    "units": [
      {"name": "Jednosoban apartman", "capacity": 3, "price": 22},
      {"name": "Apartman za dvoje", "capacity": 2, "price": 22}
    ],
    "photos": "dobrila-apartmani",
    "description_sr": "Uredni apartmani u porodičnoj kući na Zlatiboru, u mirnoj ulici sa cvetnom baštom. Svaki apartman ima poseban ulaz, kupatilo, kuhinju sa frižiderom i posuđem, trpezarijski sto, TV i balkon ili terasu. Jednosoban apartman (35 m²) prima do tri osobe, a manji apartman je za dvoje. Gosti koriste sunčanu terasu i baštu sa stolovima za ručavanje napolju, a parking je besplatan u dvorištu. Apartmani se renoviraju svake godine, a domaćini su poznati po čistoći i ljubaznosti. Odlično za par ili malu porodicu, i leti i za zimski odmor.",
    "description_en": "Tidy apartments in a family house on Zlatibor, on a quiet street with a flower garden. Each apartment has its own entrance, bathroom, a kitchen with a fridge and cookware, a dining table, a TV and a balcony or terrace. The one-bedroom apartment (35 m²) sleeps up to three, and the smaller apartment is for two. Guests share a sunny terrace and a garden with tables for eating outside, and parking in the yard is free. The apartments are refreshed every year, and the hosts are known for cleanliness and kindness. Great for a couple or a small family, in summer or for a winter break.",
    "rules_sr": "Tišina od 22 do 8 h.\nBez kućnih ljubimaca.\nBez žurki.\nPlaćanje samo gotovinom.",
    "rules_en": "Quiet hours from 10 pm to 8 am.\nNo pets.\nNo parties.\nCash payment only."
  },
  {
    "slug": "zlatiborski-katuni",
    "name": "Zlatiborski katuni",
    "destination_id": "zlatibor",
    "categories": ["mountain", "family", "lake"],
    "capacity": 12, "bedrooms": 3, "bathrooms": 2,
    "weekday_price": 59, "weekend_price": 59, "min_nights": 1,
    "parties": false, "pets": true, "smoking": false,
    "check_in": "15:00", "check_out": "11:00",
    "address": "Kobilja glava, 31340 Zlatibor", "lat": 43.698314856785, "lng": 19.662815378592,
    "amenities": ["wifi", "parking", "kitchen", "fireplace", "bbq", "terrace", "tv", "heating", "washer"],
    "units": [
      {"name": "Katun sa dve spavaće sobe", "capacity": 6, "price": 59, "pets": true},
      {"name": "Katun sa jednom spavaćom sobom", "capacity": 6, "price": 63, "pets": true}
    ],
    "photos": "zlatiborski-katuni",
    "description_sr": "Naselje tradicionalnih zlatiborskih katuna – drvenih kućica uređenih u modernom stilu – na Kobiljoj glavi, sa pogledom na jezero, reku i planine. Svaki katun ima svoju kuhinju, kupatilo, dnevni boravak sa TV-om i kaminom, balkon i terasu. Katun sa dve spavaće sobe (52 m²) ima bračni krevet, krevet na sprat i razvlačni kauč, a katun sa jednom spavaćom sobom (43 m²) dva singl i jedan bračni krevet plus kauč. Gosti imaju privatnu plažu, roštilj i mesta za piknik, a na licu mesta se iznajmljuje ski oprema i prodaju ski karte. Kućni ljubimci su dobrodošli.",
    "description_en": "A settlement of traditional Zlatibor 'katun' huts – wooden cottages furnished in a modern style – at Kobilja Glava, with views of the lake, river and mountains. Each hut has its own kitchen, bathroom, living area with a TV and fireplace, a balcony and a terrace. The two-bedroom hut (52 m²) has a king bed, a bunk bed and a sofa bed; the one-bedroom hut (43 m²) has two single beds and a double bed plus a sofa bed. Guests have a private beach, barbecue and picnic areas, and ski equipment hire and ski passes are available on site. Pets are welcome.",
    "rules_sr": "Tišina od 23 do 8 h.\nKućni ljubimci su dozvoljeni (moguća doplata).\nPlaćanje samo gotovinom.\nKrevetac za bebe do 2 godine besplatno, na upit.",
    "rules_en": "Quiet hours from 11 pm to 8 am.\nPets are allowed (a charge may apply).\nCash payment only.\nA free cot for babies up to 2 on request."
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
