-- Vikendly: 5 demo houses to show future owners how a listing looks
-- Run once in Supabase → SQL Editor. Safe to run twice: a house whose address name (slug)
-- already exists is skipped.
--
-- These houses are examples, not real places. Photos are free Unsplash photos in
-- public/images/demo/ (see PHOTO_CREDITS.md). To remove them later, run:
--   delete from public.houses where slug in ('brvnara-jelova-kosa', 'apartman-suncani-vrh',
--     'kuca-medju-vinogradima', 'vila-sa-bazenom-ripanj', 'brvnara-na-obali-drine');
-- (photos, categories, amenities and prices are deleted with them)

do $$
declare
  h jsonb;
  v_id uuid;
begin
  for h in select * from jsonb_array_elements($json$[
  {
    "slug": "brvnara-jelova-kosa",
    "name": "Brvnara Jelova Kosa",
    "destination_id": "zlatibor",
    "categories": ["mountain", "family"],
    "capacity": 8, "day_capacity": null, "bedrooms": 3, "bathrooms": 2,
    "weekday_price": 110, "weekend_price": 140, "min_nights": 2,
    "tiers": [{"max_guests": 4, "weekday_price": 85, "weekend_price": 110}],
    "parties": false, "pets": true, "smoking": false,
    "address": "Ribnica, Zlatibor", "lat": 43.7189, "lng": 19.7121,
    "featured_rank": 5,
    "amenities": ["wifi", "parking", "kitchen", "fireplace", "bbq", "terrace", "tv", "heating", "washer"],
    "photos": ["/images/demo/zlatibor-1.jpg", "/images/demo/zlatibor-2.jpg", "/images/demo/zlatibor-3.jpg", "/images/demo/zlatibor-4.jpg"],
    "description_sr": "Prostrana brvnara od punog drveta na obodu borove šume, desetak minuta vožnje od centra Zlatibora. U prizemlju je dnevna soba sa kaminom od kamena i velikom kožnom garniturom, potpuno opremljena kuhinja i trpezarija za osam osoba. Na spratu su tri spavaće sobe, a sa balkona se pruža pogled na šumu. Ispred kuće je ograđeno dvorište sa roštiljem i parkingom za dva automobila. Leti je idealna za šetnje i Ribničko jezero, a zimi do staza Tornika stižete za pola sata.",
    "description_en": "A spacious solid-log cabin on the edge of a pine forest, about ten minutes' drive from the centre of Zlatibor. Downstairs there is a living room with a stone fireplace and a large leather sofa, a fully equipped kitchen and a dining table for eight. Upstairs there are three bedrooms, and the balcony looks out over the forest. In front of the house there is a fenced yard with a barbecue and parking for two cars. In summer it is ideal for walks and Ribnica lake; in winter the Tornik slopes are half an hour away.",
    "rules_sr": "Kućni ljubimci su dobrodošli uz prethodnu najavu.\nTišina posle 23 h.\nDrva za kamin su uračunata u cenu.",
    "rules_en": "Pets are welcome if you tell us in advance.\nQuiet after 11 pm.\nFirewood for the fireplace is included.",
    "nearby_sr": "Centar Zlatibora 10 min vožnje\nRibničko jezero 2 km\nProdavnica 800 m\nSki centar Tornik 30 min vožnje\nBeograd 3 h 15 min",
    "nearby_en": "Zlatibor centre 10 min by car\nRibnica lake 2 km\nShop 800 m\nTornik ski centre 30 min by car\nBelgrade 3 h 15 min"
  },
  {
    "slug": "apartman-suncani-vrh",
    "name": "Apartman Sunčani vrh",
    "destination_id": "kopaonik",
    "categories": ["apartment", "mountain"],
    "capacity": 4, "day_capacity": null, "bedrooms": 1, "bathrooms": 1,
    "weekday_price": 65, "weekend_price": 85, "min_nights": 2,
    "tiers": [],
    "parties": false, "pets": false, "smoking": false,
    "address": "Brzeće, Kopaonik", "lat": 43.3036, "lng": 20.8580,
    "featured_rank": 6,
    "amenities": ["wifi", "parking", "kitchen", "tv", "heating"],
    "photos": ["/images/demo/kopaonik-1.jpg", "/images/demo/kopaonik-2.jpg", "/images/demo/kopaonik-3.jpg"],
    "description_sr": "Moderan apartman od 48 m² u novoj zgradi sa pogledom na planinu. Ima spavaću sobu sa bračnim krevetom, dnevnu sobu sa razvlačnim kaučem za dvoje i kuhinju sa svim što vam treba za kraći ili duži boravak. Kroz velike prozore cele godine gledate vrhove Kopaonika. Zgrada ima lift, ostavu za skije i besplatan parking. Odličan izbor za par ili manju porodicu, i za skijanje i za letnji odmor.",
    "description_en": "A modern 48 m² apartment in a new building with a mountain view. It has a bedroom with a double bed, a living room with a sofa bed for two and a kitchen with everything you need for a short or long stay. The large windows look out on the peaks of Kopaonik all year round. The building has a lift, a ski storage room and free parking. A great choice for a couple or a small family, for skiing or a summer break.",
    "rules_sr": "Pušenje nije dozvoljeno ni na terasi.\nSkije i pancerice čuvaju se u ostavi u prizemlju.",
    "rules_en": "No smoking, including on the balcony.\nSkis and ski boots go in the storage room on the ground floor.",
    "nearby_sr": "Ski centar Kopaonik 10 min vožnje\nPrevoz do staza ispred zgrade\nProdavnica i restorani 300 m\nBeograd 4 h",
    "nearby_en": "Kopaonik ski centre 10 min by car\nShuttle to the slopes in front of the building\nShop and restaurants 300 m\nBelgrade 4 h"
  },
  {
    "slug": "kuca-medju-vinogradima",
    "name": "Kuća među vinogradima",
    "destination_id": "fruska-gora",
    "categories": ["family"],
    "capacity": 6, "day_capacity": null, "bedrooms": 3, "bathrooms": 2,
    "weekday_price": 80, "weekend_price": 100, "min_nights": 2,
    "tiers": [{"max_guests": 4, "weekday_price": 65, "weekend_price": 85}],
    "parties": false, "pets": true, "smoking": false,
    "address": "Irig, Fruška Gora", "lat": 45.1013, "lng": 19.8565,
    "featured_rank": 7,
    "amenities": ["wifi", "parking", "kitchen", "fireplace", "bbq", "terrace", "tv", "ac", "heating"],
    "photos": ["/images/demo/fruska-1.jpg", "/images/demo/fruska-3.jpg", "/images/demo/fruska-2.jpg", "/images/demo/fruska-4.jpg"],
    "description_sr": "Porodična kuća na brdu iznad vinograda, na mirnom mestu blizu Iriga. Ima tri spavaće sobe, dva kupatila i veliku kuhinju sa trpezarijom za šest osoba. Ispod kuće je natkrivena terasa sa zidanim roštiljem, a iz dvorišta se pruža pogled na vinograde i šume Fruške gore. Deca imaju dosta prostora za igru, a odrasli mir i čašu domaćeg vina na terasi. U blizini su manastiri, vinarije i staze za šetnju i bicikl.",
    "description_en": "A family house on a hill above the vineyards, in a quiet spot near Irig. It has three bedrooms, two bathrooms and a large kitchen with a dining table for six. Below the house there is a covered terrace with a brick barbecue, and the garden looks out over the vineyards and forests of Fruška Gora. Children have plenty of room to play, and grown-ups get peace and a glass of local wine on the terrace. Monasteries, wineries and walking and cycling trails are close by.",
    "rules_sr": "Kućni ljubimci su dobrodošli.\nTišina posle 22 h, kuća je u mirnom kraju.",
    "rules_en": "Pets are welcome.\nQuiet after 10 pm, the house is in a quiet area.",
    "nearby_sr": "Irig 3 km\nBanja Vrdnik 10 min vožnje\nManastir Krušedol 15 min vožnje\nNovi Sad 35 min\nBeograd 1 h",
    "nearby_en": "Irig 3 km\nVrdnik spa 10 min by car\nKrušedol monastery 15 min by car\nNovi Sad 35 min\nBelgrade 1 h"
  },
  {
    "slug": "vila-sa-bazenom-ripanj",
    "name": "Vila sa bazenom Ripanj",
    "destination_id": "beograd",
    "categories": ["party", "pool"],
    "capacity": 6, "day_capacity": 30, "bedrooms": 3, "bathrooms": 2,
    "weekday_price": 140, "weekend_price": 220, "min_nights": 1,
    "tiers": [],
    "parties": true, "pets": false, "smoking": true,
    "address": "Ripanj, Beograd", "lat": 44.6356, "lng": 20.5262,
    "featured_rank": 8,
    "amenities": ["wifi", "parking", "kitchen", "bbq", "terrace", "tv", "ac"],
    "photos": ["/images/demo/avala-1.jpg", "/images/demo/avala-3.jpg", "/images/demo/avala-2.jpg", "/images/demo/avala-4.jpg", "/images/demo/avala-5.jpg"],
    "description_sr": "Moderna vila sa bazenom podno Avale, 25 minuta od centra Beograda. Bazen je 8 × 4 m, oko njega su ležaljke i velika popločana terasa, a uveče se pale lampice iznad stolova u dvorištu. Unutra je otvoren prostor sa kuhinjom, šankom i ozvučenjem, a na spratu tri spavaće sobe za šest osoba. Pravo mesto za rođendane, momačke i devojačke večeri i okupljanja do 30 ljudi tokom dana. Dvorište je ograđeno, a parking ima mesta za deset automobila.",
    "description_en": "A modern villa with a pool at the foot of Avala, 25 minutes from central Belgrade. The pool is 8 × 4 m, with sun loungers and a large paved terrace around it, and in the evening string lights come on over the tables in the garden. Inside there is an open-plan space with a kitchen, a bar and a sound system, and upstairs three bedrooms for six people. The right place for birthdays, stag and hen parties and gatherings of up to 30 people during the day. The garden is fenced and there is parking for ten cars.",
    "rules_sr": "Muzika napolju do 23 h, posle toga unutra.\nBazen radi od maja do septembra.\nDepozit 100 € vraća se po odlasku.",
    "rules_en": "Music outside until 11 pm, after that indoors.\nThe pool is open from May to September.\nA €100 deposit is returned when you leave.",
    "nearby_sr": "Centar Beograda 25 min vožnje\nAvala i Avalski toranj 10 min\nProdavnica 1 km\nDostava hrane i pića dolazi do kuće",
    "nearby_en": "Central Belgrade 25 min by car\nAvala and Avala Tower 10 min\nShop 1 km\nFood and drink delivery comes to the house"
  },
  {
    "slug": "brvnara-na-obali-drine",
    "name": "Brvnara na obali Drine",
    "destination_id": "drina",
    "categories": ["lake", "mountain"],
    "capacity": 5, "day_capacity": null, "bedrooms": 2, "bathrooms": 1,
    "weekday_price": 70, "weekend_price": 90, "min_nights": 2,
    "tiers": [],
    "parties": false, "pets": true, "smoking": false,
    "address": "Perućac, Bajina Bašta", "lat": 43.9577, "lng": 19.4328,
    "featured_rank": 9,
    "amenities": ["wifi", "parking", "kitchen", "bbq", "terrace", "heating"],
    "photos": ["/images/demo/drina-1.jpg", "/images/demo/drina-2.jpg", "/images/demo/drina-3.jpg", "/images/demo/drina-4.jpg"],
    "description_sr": "Stara brvnara obnovljena sa puno ljubavi, u šumi na samoj obali Drine kod Perućca. Ima dve spavaće sobe za pet osoba, kuhinju sa trpezarijskim stolom od masivnog drveta i natkriven trem na kome se jutarnja kafa pije uz zvuk reke. Kroz dvorište se stiže do malog drvenog pristana za kupanje i pecanje. Idealna za one koji žele mir, prirodu, splavarenje i izlete na Taru.",
    "description_en": "An old log cabin, lovingly restored, in the woods right on the bank of the Drina near Perućac. It has two bedrooms for five people, a kitchen with a solid-wood dining table and a covered porch where you drink your morning coffee to the sound of the river. Through the garden you reach a small wooden jetty for swimming and fishing. Ideal for anyone who wants peace, nature, rafting and day trips to Tara.",
    "rules_sr": "Kućni ljubimci su dobrodošli.\nDeca uz reku samo u pratnji odraslih.",
    "rules_en": "Pets are welcome.\nChildren by the river only with an adult.",
    "nearby_sr": "Drina 50 m (pristan za kupanje)\nPerućac i reka Vrelo 2 km\nNacionalni park Tara 20 min vožnje\nBajina Bašta 15 min\nBeograd 3 h 30 min",
    "nearby_en": "Drina 50 m (jetty for swimming)\nPerućac and the Vrelo river 2 km\nTara National Park 20 min by car\nBajina Bašta 15 min\nBelgrade 3 h 30 min"
  }
  ]$json$::jsonb)
  loop
    -- Skip houses that are already there (running the file twice changes nothing)
    continue when exists (select 1 from public.houses where slug = h->>'slug');

    insert into public.houses (
      slug, name, destination_id, capacity, day_capacity, bedrooms, bathrooms,
      weekday_price, weekend_price, min_nights,
      description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed,
      check_in_time, check_out_time, address, lat, lng, is_published, featured_rank,
      rules_sr, rules_en, nearby_sr, nearby_en
    ) values (
      h->>'slug', h->>'name', h->>'destination_id',
      (h->>'capacity')::int, nullif(h->>'day_capacity', '')::int,
      (h->>'bedrooms')::int, (h->>'bathrooms')::int,
      (h->>'weekday_price')::numeric, (h->>'weekend_price')::numeric, (h->>'min_nights')::int,
      h->>'description_sr', h->>'description_en',
      (h->>'parties')::boolean, (h->>'pets')::boolean, (h->>'smoking')::boolean,
      '15:00', '11:00', h->>'address', (h->>'lat')::double precision, (h->>'lng')::double precision,
      true, nullif(h->>'featured_rank', '')::int,
      h->>'rules_sr', h->>'rules_en', h->>'nearby_sr', h->>'nearby_en'
    )
    returning id into v_id;

    insert into public.house_categories (house_id, category_id)
      select v_id, value from jsonb_array_elements_text(h->'categories');

    insert into public.house_amenities (house_id, amenity_id)
      select v_id, value from jsonb_array_elements_text(h->'amenities');

    insert into public.house_photos (house_id, url, sort_order)
      select v_id, value, (ordinality - 1)::int
      from jsonb_array_elements_text(h->'photos') with ordinality;

    insert into public.house_price_tiers (house_id, max_guests, weekday_price, weekend_price)
      select v_id, (t->>'max_guests')::int, (t->>'weekday_price')::numeric, (t->>'weekend_price')::numeric
      from jsonb_array_elements(h->'tiers') as t;
  end loop;
end
$$;
