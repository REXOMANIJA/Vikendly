-- Vikendly: 5 more demo houses (same as 0018: examples to show future owners, not real places)
-- Run once in Supabase → SQL Editor. Safe to run twice: a house whose slug already exists is skipped.
-- Photos: public/images/demo/ (see PHOTO_CREDITS.md). To remove them later, run:
--   delete from public.houses where slug in ('a-frame-maljen', 'kuca-na-vlasinskom-jezeru',
--     'planinska-vila-jahorina', 'seoska-kuca-sargan', 'brvnara-pod-durmitorom');

do $$
declare
  h jsonb;
  v_id uuid;
begin
  for h in select * from jsonb_array_elements($json$[
  {
    "slug": "a-frame-maljen",
    "name": "A-frame Maljen",
    "destination_id": "divcibare",
    "categories": ["mountain"],
    "capacity": 4, "day_capacity": null, "bedrooms": 2, "bathrooms": 1,
    "weekday_price": 75, "weekend_price": 95, "min_nights": 2,
    "tiers": [{"max_guests": 2, "weekday_price": 60, "weekend_price": 80}],
    "parties": false, "pets": false, "smoking": false,
    "address": "Divčibare", "lat": 44.1081, "lng": 19.9988,
    "amenities": ["wifi", "parking", "kitchen", "fireplace", "bbq", "terrace", "heating", "ac"],
    "photos": ["/images/demo/divcibare-1.jpg", "/images/demo/divcibare-2.jpg", "/images/demo/divcibare-3.jpg", "/images/demo/divcibare-4.jpg"],
    "description_sr": "Nova A-frame kućica u borovoj šumi na Divčibarama, savršena za par ili dvoje prijatelja sa decom. Kroz ogroman trouglasti prozor iz dnevne sobe gledate pravo u šumu. Prizemlje je jedan otvoren prostor sa kuhinjom, trpezarijom i kaminom, a na galeriji su dve spavaće sobe. Ispred kuće je terasa sa ležaljkama i mesto za logorsku vatru. Mirno je, a do centra Divčibara i staza za šetnju stižete za pet minuta.",
    "description_en": "A new A-frame cabin in the pine forest at Divčibare, perfect for a couple or two friends with children. Through the huge triangular window in the living room you look straight into the forest. The ground floor is one open space with a kitchen, a dining area and a fireplace, and the gallery upstairs has two bedrooms. In front of the house there is a deck with loungers and a fire pit. It is quiet, and the centre of Divčibare and the walking trails are five minutes away.",
    "rules_sr": "Bez kućnih ljubimaca.\nVatra napolju samo na mestu za logorsku vatru.",
    "rules_en": "No pets.\nOutdoor fires only in the fire pit.",
    "nearby_sr": "Centar Divčibara 5 min vožnje\nVidikovac Crni vrh 3 km\nProdavnica 1 km\nValjevo 40 min\nBeograd 2 h",
    "nearby_en": "Divčibare centre 5 min by car\nCrni vrh viewpoint 3 km\nShop 1 km\nValjevo 40 min\nBelgrade 2 h"
  },
  {
    "slug": "kuca-na-vlasinskom-jezeru",
    "name": "Kuća na Vlasinskom jezeru",
    "destination_id": "vlasina",
    "categories": ["lake", "family"],
    "capacity": 8, "day_capacity": null, "bedrooms": 3, "bathrooms": 2,
    "weekday_price": 90, "weekend_price": 110, "min_nights": 2,
    "tiers": [{"max_guests": 5, "weekday_price": 75, "weekend_price": 95}],
    "parties": false, "pets": true, "smoking": false,
    "address": "Vlasinsko jezero", "lat": 42.7065, "lng": 22.3420,
    "amenities": ["wifi", "parking", "kitchen", "bbq", "terrace", "tv", "heating", "washer"],
    "photos": ["/images/demo/vlasina-1.jpg", "/images/demo/vlasina-2.jpg", "/images/demo/vlasina-3.jpg"],
    "description_sr": "Prostrana porodična kuća sa velikom drvenom terasom i travnjakom koji se spušta do obale Vlasinskog jezera. Ima tri spavaće sobe, dva kupatila i trpezariju sa pogledom na vodu. Na terasi su suncobrani, sto za osam osoba i roštilj, a deca imaju mesta za igru na travi. Jezero je poznato po plutajućim ostrvima, a vazduh je čist jer je ovo najviše jezero u Srbiji. Idealno za porodični odmor, pecanje i vožnju čamcem.",
    "description_en": "A spacious family house with a large wooden deck and a lawn running down to the shore of Lake Vlasina. It has three bedrooms, two bathrooms and a dining room overlooking the water. On the deck there are parasols, a table for eight and a barbecue, and children have room to play on the grass. The lake is known for its floating islands, and the air is clean because this is the highest lake in Serbia. Ideal for a family holiday, fishing and boat trips.",
    "rules_sr": "Kućni ljubimci su dobrodošli.\nDeca uz jezero samo u pratnji odraslih.\nČamac na vesla može se iznajmiti kod domaćina.",
    "rules_en": "Pets are welcome.\nChildren by the lake only with an adult.\nA rowing boat can be hired from the host.",
    "nearby_sr": "Jezero 30 m\nPlaža 1 km\nProdavnica i restoran 2 km\nSurdulica 25 min\nBeograd 4 h",
    "nearby_en": "Lake 30 m\nBeach 1 km\nShop and restaurant 2 km\nSurdulica 25 min\nBelgrade 4 h"
  },
  {
    "slug": "planinska-vila-jahorina",
    "name": "Planinska vila Jahorina",
    "destination_id": "jahorina",
    "categories": ["mountain", "party"],
    "capacity": 12, "day_capacity": 20, "bedrooms": 5, "bathrooms": 3,
    "weekday_price": 220, "weekend_price": 280, "min_nights": 2,
    "tiers": [{"max_guests": 8, "weekday_price": 180, "weekend_price": 230}],
    "parties": true, "pets": false, "smoking": false,
    "address": "Jahorina", "lat": 43.7362, "lng": 18.5653,
    "amenities": ["wifi", "parking", "kitchen", "fireplace", "terrace", "tv", "heating", "washer"],
    "photos": ["/images/demo/jahorina-1.jpg", "/images/demo/jahorina-2.jpg", "/images/demo/jahorina-3.jpg", "/images/demo/jahorina-4.jpg"],
    "description_sr": "Velika planinska vila za ekipu, na 200 metara od ski staza Jahorine. Ima pet spavaćih soba za dvanaest osoba, tri kupatila i dnevnu sobu sa kaminom i đakuzijem. U kuhinji sa velikim stolom svi stanu za zajedničku večeru, a sa terase se vide staze i okolni vrhovi. Prostor za ski opremu i sušač za pancerice su u prizemlju. Leti je odlična baza za planinarenje i vožnju bicikla, a zimi za skijanje i proslave.",
    "description_en": "A large mountain villa for groups, 200 metres from the Jahorina ski slopes. It has five bedrooms for twelve people, three bathrooms and a living room with a fireplace and a hot tub. Everyone fits around the big table in the kitchen for dinner together, and the terrace looks out over the slopes and the surrounding peaks. Ski storage and a boot dryer are on the ground floor. In summer it is a great base for hiking and cycling, in winter for skiing and celebrations.",
    "rules_sr": "Proslave su dozvoljene, muzika tiše posle 23 h.\nUlazak u kuću bez ski obuće.\nDepozit 150 € vraća se po odlasku.",
    "rules_en": "Celebrations are allowed, music quieter after 11 pm.\nNo ski boots inside the house.\nA €150 deposit is returned when you leave.",
    "nearby_sr": "Ski staze 200 m\nCentar Jahorine 5 min hoda\nRestorani i apres-ski 400 m\nSarajevo 45 min\nBeograd 5 h",
    "nearby_en": "Ski slopes 200 m\nJahorina centre 5 min walk\nRestaurants and après-ski 400 m\nSarajevo 45 min\nBelgrade 5 h"
  },
  {
    "slug": "seoska-kuca-sargan",
    "name": "Seoska kuća Šargan",
    "destination_id": "mokra-gora",
    "categories": ["family"],
    "capacity": 6, "day_capacity": null, "bedrooms": 2, "bathrooms": 1,
    "weekday_price": 55, "weekend_price": 70, "min_nights": 1,
    "tiers": [],
    "parties": false, "pets": true, "smoking": false,
    "address": "Mokra Gora", "lat": 43.7934, "lng": 19.5104,
    "amenities": ["wifi", "parking", "kitchen", "fireplace", "bbq", "terrace", "heating"],
    "photos": ["/images/demo/mokragora-1.jpg", "/images/demo/mokragora-2.jpg", "/images/demo/mokragora-3.jpg"],
    "description_sr": "Stara seoska kuća od kamena i drveta, obnovljena tako da zadrži duh sela, u dvorištu sa voćnjakom iznad Mokre Gore. Ima dve spavaće sobe za šest osoba, kuhinju sa šporetom na drva i trpezariju za sve. U dvorištu su klupe, roštilj i mnogo mesta za decu. Domaćini nude domaći sir, kajmak i rakiju. Odlično mesto za porodicu koja želi selo, mir i izlete po Tari i Zlatiboru.",
    "description_en": "An old stone-and-timber village house, restored to keep its rural character, in a garden with an orchard above Mokra Gora. It has two bedrooms for six people, a kitchen with a wood-burning stove and a dining table for everyone. In the garden there are benches, a barbecue and plenty of room for children. The hosts offer homemade cheese, kajmak and rakija. A great place for a family that wants village life, peace and day trips to Tara and Zlatibor.",
    "rules_sr": "Kućni ljubimci su dobrodošli.\nDrva za šporet i kamin su uračunata.",
    "rules_en": "Pets are welcome.\nFirewood for the stove and fireplace is included.",
    "nearby_sr": "Šarganska osmica (stanica) 3 km\nProdavnica 2 km\nNacionalni park Tara 30 min vožnje\nZlatibor 35 min\nBeograd 3 h 30 min",
    "nearby_en": "Šargan Eight railway station 3 km\nShop 2 km\nTara National Park 30 min by car\nZlatibor 35 min\nBelgrade 3 h 30 min"
  },
  {
    "slug": "brvnara-pod-durmitorom",
    "name": "Brvnara pod Durmitorom",
    "destination_id": "durmitor",
    "categories": ["mountain"],
    "capacity": 4, "day_capacity": null, "bedrooms": 1, "bathrooms": 1,
    "weekday_price": 60, "weekend_price": 75, "min_nights": 2,
    "tiers": [],
    "parties": false, "pets": true, "smoking": false,
    "address": "Žabljak", "lat": 43.1452, "lng": 19.1006,
    "amenities": ["wifi", "parking", "kitchen", "fireplace", "terrace", "heating"],
    "photos": ["/images/demo/durmitor-1.jpg", "/images/demo/durmitor-3.jpg", "/images/demo/durmitor-4.jpg", "/images/demo/durmitor-2.jpg"],
    "description_sr": "Brvnara na livadi iznad Žabljaka, sa pogledom na vrhove Durmitora. U prizemlju je otvoren prostor sa kuhinjom, šankom i kaminom, a na spratu spavaća soba i galerija sa dva kreveta, za ukupno četiri osobe. Zimi je okružena snegom i odlična za skijanje na Savinom kuku, a leti za planinarenje, rafting Tarom i kupanje u Crnom jezeru. Pored kuće je ostava sa drvima i parking.",
    "description_en": "A log cabin in a meadow above Žabljak, looking out on the peaks of Durmitor. Downstairs there is an open space with a kitchen, a breakfast bar and a fireplace, and upstairs a bedroom and a gallery with two beds, for four people in total. In winter it is surrounded by snow and great for skiing at Savin kuk; in summer for hiking, rafting on the Tara and swimming in the Black Lake. Next to the cabin there is a woodshed and parking.",
    "rules_sr": "Kućni ljubimci su dobrodošli.\nZimi je do kuće potreban auto sa zimskom opremom.",
    "rules_en": "Pets are welcome.\nIn winter you need a car with winter equipment to reach the cabin.",
    "nearby_sr": "Žabljak centar 5 min vožnje\nCrno jezero 4 km\nSki centar Savin kuk 10 min vožnje\nKanjon Tare (Đurđevića Tara) 25 min\nBeograd 6 h 30 min",
    "nearby_en": "Žabljak centre 5 min by car\nBlack Lake 4 km\nSavin kuk ski centre 10 min by car\nTara canyon (Đurđevića Tara bridge) 25 min\nBelgrade 6 h 30 min"
  }
  ]$json$::jsonb)
  loop
    -- Skip houses that are already there (running the file twice changes nothing)
    continue when exists (select 1 from public.houses where slug = h->>'slug');

    insert into public.houses (
      slug, name, destination_id, capacity, day_capacity, bedrooms, bathrooms,
      weekday_price, weekend_price, min_nights,
      description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed,
      check_in_time, check_out_time, address, lat, lng, is_published,
      rules_sr, rules_en, nearby_sr, nearby_en
    ) values (
      h->>'slug', h->>'name', h->>'destination_id',
      (h->>'capacity')::int, nullif(h->>'day_capacity', '')::int,
      (h->>'bedrooms')::int, (h->>'bathrooms')::int,
      (h->>'weekday_price')::numeric, (h->>'weekend_price')::numeric, (h->>'min_nights')::int,
      h->>'description_sr', h->>'description_en',
      (h->>'parties')::boolean, (h->>'pets')::boolean, (h->>'smoking')::boolean,
      '15:00', '11:00', h->>'address', (h->>'lat')::double precision, (h->>'lng')::double precision,
      true,
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
