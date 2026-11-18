-- Vikendly: 3 real houses from Airbnb whose owners agreed to be listed (18 Nov 2026)
-- Details and photos come from each listing's Airbnb page; photos are in
-- public/images/houses/<house>/. Prices are the Airbnb price for 2 people converted from USD
-- (Gorska Vila: January ski-season price) – confirm them with each owner and correct them in admin.
-- Map pins are Airbnb's approximate location: set the exact pin in admin.
-- Run once in Supabase → SQL Editor. Safe to run twice: a house whose slug exists is skipped.

do $$
declare
  h jsonb;
  v_id uuid;
begin
  for h in select * from jsonb_array_elements($json$[
  {
    "slug": "kod-male-kolibe",
    "name": "Kod male kolibe",
    "destination_id": "divcibare",
    "categories": ["mountain", "family"],
    "capacity": 6, "bedrooms": 2, "bathrooms": 1,
    "weekday_price": 85, "weekend_price": 85, "min_nights": 1,
    "parties": false, "pets": true, "smoking": false,
    "check_in": "14:00", "check_out": "11:00",
    "address": "Ljutice, Požega", "lat": 44.0135, "lng": 20.0354,
    "amenities": ["wifi", "parking", "kitchen", "fireplace", "bbq", "terrace", "tv", "heating"],
    "units": [],
    "photos": "mala-koliba-ljutice",
    "description_sr": "Nova brvnara od punog drveta u mirnom selu Ljutice, okružena livadama i poljima, oko 25 minuta vožnje od Divčibara. Na spratu su dve spavaće sobe sa krevetima 160×200, a u prizemlju dnevna soba sa razvlačnim kaučem i kaminom, potpuno opremljena kuhinja i prostrano kupatilo. Kuća je na ograđenom ravnom placu od jednog hektara sa lepim pogledom: tu su pergola sa roštiljem, kameno ognjište za kuvanje na vatri, baštenski nameštaj i ljuljaške za decu. Put je asfaltiran do same kuće, parking je u dvorištu, a oko kuće su staze za šetnju. Društvene igre i knjige su tu za kišne dane.",
    "description_en": "A new solid-wood cabin in the quiet village of Ljutice, surrounded by meadows and fields, about 25 minutes' drive from Divčibare. Upstairs there are two bedrooms with 160×200 beds; downstairs a living room with a sofa bed and a fireplace, a fully equipped kitchen and a spacious bathroom. The house stands on a flat, fenced one-hectare plot with a lovely view: a pergola with a barbecue, a stone fire pit for cooking, garden furniture and swings for children. The road is paved all the way to the house, parking is in the yard, and there are walking trails all around. Board games and books are there for rainy days.",
    "rules_sr": "Tišina od 23 do 7 h.\nKućni ljubimci dozvoljeni (najviše 1), ali ne na spratu i na kauču.\nZabranjeno pušenje, bez žurki.\nU selu nema prodavnice – namirnice ponesite.",
    "rules_en": "Quiet hours from 11 pm to 7 am.\nPets allowed (1 at most), but not upstairs or on the sofa.\nNo smoking, no parties.\nThere is no shop in the village – bring your groceries."
  },
  {
    "slug": "gorska-vila-kopaonik",
    "name": "Gorska Vila Kopaonik",
    "destination_id": "kopaonik",
    "categories": ["mountain", "family"],
    "capacity": 8, "bedrooms": 3, "bathrooms": 2,
    "weekday_price": 320, "weekend_price": 320, "min_nights": 1,
    "parties": false, "pets": false, "smoking": false,
    "check_in": "14:00", "check_out": "10:00",
    "address": "Kopaonik", "lat": 43.2763, "lng": 20.7791,
    "amenities": ["wifi", "parking", "kitchen", "fireplace", "bbq", "terrace", "tv", "heating"],
    "units": [],
    "photos": "gorska-vila-kopaonik",
    "description_sr": "Nova planinska vila u šumi na Kopaoniku, oko 15 minuta hoda do centra, koja spaja moderan komfor i duh planinske kuće. Ima tri spavaće sobe (dva bračna kreveta i razvlačni kauč), još jedan kauč u dnevnoj sobi i dva kupatila – za ukupno osam osoba. U dnevnoj sobi je kamin na drva i TV sa Netflixom, a kuhinja ima mašinu za sudove, rernu i espresso aparat. U dvorištu je roštilj, a parking je besplatan ispred kuće. Zimi odlična baza za skijanje, leti za šetnje kroz šumu i planinske vidikovce.",
    "description_en": "A new mountain villa in the forest on Kopaonik, about a 15-minute walk from the centre, combining modern comfort with the feel of a mountain house. It has three bedrooms (two double beds and a sofa bed), another sofa bed in the living room and two bathrooms – eight people in total. The living room has a wood-burning fireplace and a TV with Netflix, and the kitchen has a dishwasher, an oven and an espresso machine. There is a barbecue in the garden and free parking in front of the house. In winter a great base for skiing, in summer for forest walks and mountain viewpoints.",
    "rules_sr": "Najviše 8 osoba.\nBez kućnih ljubimaca.\nDolazak od 14 do 21 h.",
    "rules_en": "8 guests at most.\nNo pets.\nArrival between 2 pm and 9 pm."
  },
  {
    "slug": "apartman-meri-kopaonik",
    "name": "Apartman Meri",
    "destination_id": "kopaonik",
    "categories": ["apartment", "mountain", "pool"],
    "capacity": 4, "bedrooms": 1, "bathrooms": 1,
    "weekday_price": 105, "weekend_price": 105, "min_nights": 1,
    "parties": false, "pets": false, "smoking": false,
    "check_in": "15:00", "check_out": "11:00",
    "address": "Kopaonik", "lat": 43.27422, "lng": 20.76724,
    "amenities": ["wifi", "parking", "kitchen", "tv"],
    "units": [],
    "photos": "apartman-meri-kopaonik",
    "description_sr": "Elegantan potkrovni apartman na Kopaoniku, oko 20 minuta hoda do centra, sa pogledom na planinu. Ima spavaću sobu, dnevnu sobu sa udobnom garniturom i TV-om, kuhinju sa trpezarijom i kupatilo – za do četiri osobe. U objektu je bazen, a parking je na licu mesta uz doplatu. Miran i uredan prostor, odličan za par ili malu porodicu, i za skijanje i za letnji odmor.",
    "description_en": "An elegant attic apartment on Kopaonik, about a 20-minute walk from the centre, with a mountain view. It has a bedroom, a living room with a comfortable sofa and a TV, a kitchen with a dining area and a bathroom – for up to four people. The building has a pool, and parking is on site for a fee. A quiet, tidy space, great for a couple or a small family, for skiing or a summer break.",
    "rules_sr": "Najviše 4 osobe.\nParking u objektu uz doplatu.",
    "rules_en": "4 guests at most.\nParking on site for a fee."
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
