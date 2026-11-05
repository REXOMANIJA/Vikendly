-- Vikendly sample data (generated from data/*.ts). Safe to run once after 0001_init.sql.
begin;

insert into public.destinations (id, slug, name, country, tourist_tax_per_person_per_night, sort_order) values
  ('zlatibor', 'zlatibor', 'Zlatibor', 'SR', 1.5, 0),
  ('kopaonik', 'kopaonik', 'Kopaonik', 'SR', 1.5, 1),
  ('tara', 'tara', 'Tara', 'SR', 1.5, 2),
  ('divcibare', 'divcibare', 'Divčibare', 'SR', 1.5, 3),
  ('fruska-gora', 'fruska-gora', 'Fruška Gora', 'SR', 1.5, 4),
  ('drina', 'drina', 'Drina', 'SR', 1.5, 5),
  ('vlasina', 'vlasina', 'Vlasina', 'SR', 1.5, 6),
  ('durmitor', 'durmitor', 'Durmitor', 'ME', 1.5, 7),
  ('jahorina', 'jahorina', 'Jahorina', 'BA', 1.5, 8);

insert into public.categories (id, slug, sort_order) values
  ('mountain', 'mountain', 0),
  ('party', 'party', 1),
  ('lake', 'lake', 2),
  ('pool', 'pool', 3),
  ('family', 'family', 4),
  ('romantic', 'romantic', 5);

insert into public.amenities (id, sort_order) values
  ('wifi', 0),
  ('parking', 1),
  ('kitchen', 2),
  ('fireplace', 3),
  ('bbq', 4),
  ('terrace', 5),
  ('tv', 6),
  ('ac', 7),
  ('heating', 8),
  ('washer', 9);

-- Vila Ribnica
insert into public.houses (slug, name, destination_id, capacity, bedrooms, bathrooms, weekday_price, weekend_price, cleaning_fee, min_nights, description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time, address, contact_viber, contact_whatsapp, contact_phone, is_published, featured_rank) values (
  'vila-ribnica', 'Vila Ribnica', 'zlatibor', 8, 4, 2, 80, 120, 50, 2, 'Prostrana planinska vila na par minuta hoda od Ribničkog jezera. Velika terasa gleda na borovu šumu, a kamin u dnevnoj sobi okuplja celu ekipu uveče. Idealna za porodice i grupe prijatelja koji žele miran vikend.', 'Spacious mountain villa a few minutes walk from Ribnica lake. The large terrace overlooks the pine forest, and the fireplace in the living room brings everyone together in the evening. Ideal for families and groups of friends who want a quiet weekend.', false, true, false, '15:00', '11:00', 'Ribničko jezero 12, Zlatibor', '+381641234567', '+381641234567', null, true, 1
);
insert into public.house_categories (house_id, category_id) values ((select id from public.houses where slug = 'vila-ribnica'), 'mountain'), ((select id from public.houses where slug = 'vila-ribnica'), 'family');
insert into public.house_amenities (house_id, amenity_id) values ((select id from public.houses where slug = 'vila-ribnica'), 'wifi'), ((select id from public.houses where slug = 'vila-ribnica'), 'parking'), ((select id from public.houses where slug = 'vila-ribnica'), 'kitchen'), ((select id from public.houses where slug = 'vila-ribnica'), 'fireplace'), ((select id from public.houses where slug = 'vila-ribnica'), 'terrace'), ((select id from public.houses where slug = 'vila-ribnica'), 'tv'), ((select id from public.houses where slug = 'vila-ribnica'), 'heating');
insert into public.house_photos (house_id, url, sort_order) values ((select id from public.houses where slug = 'vila-ribnica'), '/images/house-01.svg', 0);

-- Planinska kuća Pančić
insert into public.houses (slug, name, destination_id, capacity, bedrooms, bathrooms, weekday_price, weekend_price, cleaning_fee, min_nights, description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time, address, contact_viber, contact_whatsapp, contact_phone, is_published, featured_rank) values (
  'planinska-kuca-pancic', 'Planinska kuća Pančić', 'kopaonik', 10, 5, 3, 150, 200, 80, 3, 'Moderna planinska kuća blizu staza na Kopaoniku. Pet spavaćih soba, tri kupatila i roštilj na terasi, sve što treba većoj ekipi za skijaški vikend.', 'Modern mountain house close to the Kopaonik slopes. Five bedrooms, three bathrooms and a barbecue on the terrace: everything a bigger group needs for a ski weekend.', true, false, false, '14:00', '10:00', 'Pančićev vrh 5, Kopaonik', '+381639876543', null, '+381639876543', true, 2
);
insert into public.house_categories (house_id, category_id) values ((select id from public.houses where slug = 'planinska-kuca-pancic'), 'mountain'), ((select id from public.houses where slug = 'planinska-kuca-pancic'), 'family');
insert into public.house_amenities (house_id, amenity_id) values ((select id from public.houses where slug = 'planinska-kuca-pancic'), 'wifi'), ((select id from public.houses where slug = 'planinska-kuca-pancic'), 'parking'), ((select id from public.houses where slug = 'planinska-kuca-pancic'), 'kitchen'), ((select id from public.houses where slug = 'planinska-kuca-pancic'), 'fireplace'), ((select id from public.houses where slug = 'planinska-kuca-pancic'), 'terrace'), ((select id from public.houses where slug = 'planinska-kuca-pancic'), 'tv'), ((select id from public.houses where slug = 'planinska-kuca-pancic'), 'heating'), ((select id from public.houses where slug = 'planinska-kuca-pancic'), 'bbq');
insert into public.house_photos (house_id, url, sort_order) values ((select id from public.houses where slug = 'planinska-kuca-pancic'), '/images/house-02.svg', 0);

-- Brvnara na Drini
insert into public.houses (slug, name, destination_id, capacity, bedrooms, bathrooms, weekday_price, weekend_price, cleaning_fee, min_nights, description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time, address, contact_viber, contact_whatsapp, contact_phone, is_published, featured_rank) values (
  'brvnara-na-drini', 'Brvnara na Drini', 'tara', 4, 2, 1, 70, 100, 40, 2, 'Mala brvnara tik uz Drinu, u podnožju Tare. Jutarnja kafa na terasi uz šum reke i potpuna tišina. Savršena za par ili malu porodicu.', 'A small log cabin right on the Drina, at the foot of Tara. Morning coffee on the terrace with the sound of the river and complete quiet. Perfect for a couple or a small family.', false, true, false, '15:00', '11:00', 'Bajina Bašta, Tara', null, '+381651112223', null, true, 3
);
insert into public.house_categories (house_id, category_id) values ((select id from public.houses where slug = 'brvnara-na-drini'), 'lake'), ((select id from public.houses where slug = 'brvnara-na-drini'), 'romantic');
insert into public.house_amenities (house_id, amenity_id) values ((select id from public.houses where slug = 'brvnara-na-drini'), 'wifi'), ((select id from public.houses where slug = 'brvnara-na-drini'), 'parking'), ((select id from public.houses where slug = 'brvnara-na-drini'), 'kitchen'), ((select id from public.houses where slug = 'brvnara-na-drini'), 'terrace'), ((select id from public.houses where slug = 'brvnara-na-drini'), 'heating');
insert into public.house_photos (house_id, url, sort_order) values ((select id from public.houses where slug = 'brvnara-na-drini'), '/images/house-03.svg', 0);

-- Kuća na Maljenu
insert into public.houses (slug, name, destination_id, capacity, bedrooms, bathrooms, weekday_price, weekend_price, cleaning_fee, min_nights, description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time, address, contact_viber, contact_whatsapp, contact_phone, is_published, featured_rank) values (
  'kuca-na-maljenu', 'Kuća na Maljenu', 'divcibare', 6, 3, 2, 90, 130, 50, 2, 'Tradicionalna drvena kuća na Divčibarama, uređena sa modernim detaljima. Kamin, terasa sa pogledom na Maljen i livade za šetnju odmah ispred vrata.', 'A traditional wooden house in Divčibare with modern touches. Fireplace, a terrace overlooking Maljen and meadows for walks right outside the door.', false, true, false, '14:00', '11:00', 'Divčibare 45, Maljen', '+381633334445', null, null, true, 4
);
insert into public.house_categories (house_id, category_id) values ((select id from public.houses where slug = 'kuca-na-maljenu'), 'mountain'), ((select id from public.houses where slug = 'kuca-na-maljenu'), 'romantic');
insert into public.house_amenities (house_id, amenity_id) values ((select id from public.houses where slug = 'kuca-na-maljenu'), 'wifi'), ((select id from public.houses where slug = 'kuca-na-maljenu'), 'parking'), ((select id from public.houses where slug = 'kuca-na-maljenu'), 'kitchen'), ((select id from public.houses where slug = 'kuca-na-maljenu'), 'fireplace'), ((select id from public.houses where slug = 'kuca-na-maljenu'), 'terrace'), ((select id from public.houses where slug = 'kuca-na-maljenu'), 'tv'), ((select id from public.houses where slug = 'kuca-na-maljenu'), 'heating');
insert into public.house_photos (house_id, url, sort_order) values ((select id from public.houses where slug = 'kuca-na-maljenu'), '/images/house-04.svg', 0);

-- Vila Vinogradi
insert into public.houses (slug, name, destination_id, capacity, bedrooms, bathrooms, weekday_price, weekend_price, cleaning_fee, min_nights, description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time, address, contact_viber, contact_whatsapp, contact_phone, is_published, featured_rank) values (
  'vila-vinogradi', 'Vila Vinogradi', 'fruska-gora', 12, 6, 4, 200, 280, 100, 2, 'Velika vila sa bazenom među vinogradima Fruške gore, blizu Sremskih Karlovaca. Napravljena za proslave i duža druženja: šest soba, roštilj i klima u celoj kući.', 'A large villa with a pool among the Fruška Gora vineyards, near Sremski Karlovci. Built for celebrations and long get-togethers: six bedrooms, a barbecue and air conditioning throughout.', true, false, true, '15:00', '11:00', 'Sremski Karlovci 23, Fruška Gora', null, '+381645556667', '+381645556667', true, 5
);
insert into public.house_categories (house_id, category_id) values ((select id from public.houses where slug = 'vila-vinogradi'), 'family'), ((select id from public.houses where slug = 'vila-vinogradi'), 'pool');
insert into public.house_amenities (house_id, amenity_id) values ((select id from public.houses where slug = 'vila-vinogradi'), 'wifi'), ((select id from public.houses where slug = 'vila-vinogradi'), 'parking'), ((select id from public.houses where slug = 'vila-vinogradi'), 'kitchen'), ((select id from public.houses where slug = 'vila-vinogradi'), 'terrace'), ((select id from public.houses where slug = 'vila-vinogradi'), 'tv'), ((select id from public.houses where slug = 'vila-vinogradi'), 'ac'), ((select id from public.houses where slug = 'vila-vinogradi'), 'heating'), ((select id from public.houses where slug = 'vila-vinogradi'), 'washer'), ((select id from public.houses where slug = 'vila-vinogradi'), 'bbq');
insert into public.house_photos (house_id, url, sort_order) values ((select id from public.houses where slug = 'vila-vinogradi'), '/images/house-05.svg', 0);

-- Kuća za ekipu Perućac
insert into public.houses (slug, name, destination_id, capacity, bedrooms, bathrooms, weekday_price, weekend_price, cleaning_fee, min_nights, description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time, address, contact_viber, contact_whatsapp, contact_phone, is_published, featured_rank) values (
  'kuca-za-ekipu-perucac', 'Kuća za ekipu Perućac', 'drina', 15, 7, 4, 250, 350, 120, 2, 'Kuća za velike ekipe sa pogledom na Drinu u Perućcu. Žurke su dozvoljene, a najbliži komšije su dovoljno daleko. Sedam soba i velika terasa za roštilj.', 'A house for big groups with a view of the Drina in Perućac. Parties are allowed, and the nearest neighbours are far enough away. Seven bedrooms and a large terrace for barbecues.', true, false, true, '14:00', '12:00', 'Perućac 8, Drina river', '+381627778889', null, null, true, 6
);
insert into public.house_categories (house_id, category_id) values ((select id from public.houses where slug = 'kuca-za-ekipu-perucac'), 'party'), ((select id from public.houses where slug = 'kuca-za-ekipu-perucac'), 'lake');
insert into public.house_amenities (house_id, amenity_id) values ((select id from public.houses where slug = 'kuca-za-ekipu-perucac'), 'wifi'), ((select id from public.houses where slug = 'kuca-za-ekipu-perucac'), 'parking'), ((select id from public.houses where slug = 'kuca-za-ekipu-perucac'), 'kitchen'), ((select id from public.houses where slug = 'kuca-za-ekipu-perucac'), 'terrace'), ((select id from public.houses where slug = 'kuca-za-ekipu-perucac'), 'tv'), ((select id from public.houses where slug = 'kuca-za-ekipu-perucac'), 'ac'), ((select id from public.houses where slug = 'kuca-za-ekipu-perucac'), 'heating'), ((select id from public.houses where slug = 'kuca-za-ekipu-perucac'), 'bbq');
insert into public.house_photos (house_id, url, sort_order) values ((select id from public.houses where slug = 'kuca-za-ekipu-perucac'), '/images/house-06.svg', 0);

-- Kuća kod Vlasinskog jezera
insert into public.houses (slug, name, destination_id, capacity, bedrooms, bathrooms, weekday_price, weekend_price, cleaning_fee, min_nights, description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time, address, contact_viber, contact_whatsapp, contact_phone, is_published, featured_rank) values (
  'kuca-kod-vlasinskog-jezera', 'Kuća kod Vlasinskog jezera', 'vlasina', 5, 2, 2, 85, 120, 45, 2, 'Mirna kuća na obali Vlasinskog jezera, daleko od gužve. Za ljubitelje prirode, pecanja i dugih šetnji oko jezera.', 'A quiet house on the shore of Vlasina lake, far from the crowds. For lovers of nature, fishing and long walks around the lake.', false, true, false, '15:00', '11:00', 'Vlasina 34, Surdulica', null, '+381619990001', null, true, null
);
insert into public.house_categories (house_id, category_id) values ((select id from public.houses where slug = 'kuca-kod-vlasinskog-jezera'), 'lake'), ((select id from public.houses where slug = 'kuca-kod-vlasinskog-jezera'), 'romantic');
insert into public.house_amenities (house_id, amenity_id) values ((select id from public.houses where slug = 'kuca-kod-vlasinskog-jezera'), 'wifi'), ((select id from public.houses where slug = 'kuca-kod-vlasinskog-jezera'), 'parking'), ((select id from public.houses where slug = 'kuca-kod-vlasinskog-jezera'), 'kitchen'), ((select id from public.houses where slug = 'kuca-kod-vlasinskog-jezera'), 'terrace'), ((select id from public.houses where slug = 'kuca-kod-vlasinskog-jezera'), 'tv'), ((select id from public.houses where slug = 'kuca-kod-vlasinskog-jezera'), 'heating');
insert into public.house_photos (house_id, url, sort_order) values ((select id from public.houses where slug = 'kuca-kod-vlasinskog-jezera'), '/images/house-07.svg', 0);

-- Kuća pod Durmitorom
insert into public.houses (slug, name, destination_id, capacity, bedrooms, bathrooms, weekday_price, weekend_price, cleaning_fee, min_nights, description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time, address, contact_viber, contact_whatsapp, contact_phone, is_published, featured_rank) values (
  'kuca-pod-durmitorom', 'Kuća pod Durmitorom', 'durmitor', 8, 4, 2, 100, 150, 60, 2, 'Autentična planinska kuća u Žabljaku, na ulazu u nacionalni park Durmitor. Odlična baza za planinarenje, Crno jezero i rafting na Tari.', 'An authentic mountain house in Žabljak, at the entrance to Durmitor National Park. A great base for hiking, Black Lake and rafting on the Tara.', false, true, false, '14:00', '11:00', 'Žabljak 15, Durmitor', '+382691112223', null, null, true, null
);
insert into public.house_categories (house_id, category_id) values ((select id from public.houses where slug = 'kuca-pod-durmitorom'), 'mountain'), ((select id from public.houses where slug = 'kuca-pod-durmitorom'), 'family');
insert into public.house_amenities (house_id, amenity_id) values ((select id from public.houses where slug = 'kuca-pod-durmitorom'), 'wifi'), ((select id from public.houses where slug = 'kuca-pod-durmitorom'), 'parking'), ((select id from public.houses where slug = 'kuca-pod-durmitorom'), 'kitchen'), ((select id from public.houses where slug = 'kuca-pod-durmitorom'), 'fireplace'), ((select id from public.houses where slug = 'kuca-pod-durmitorom'), 'terrace'), ((select id from public.houses where slug = 'kuca-pod-durmitorom'), 'tv'), ((select id from public.houses where slug = 'kuca-pod-durmitorom'), 'heating');
insert into public.house_photos (house_id, url, sort_order) values ((select id from public.houses where slug = 'kuca-pod-durmitorom'), '/images/house-08.svg', 0);

-- Šale Jahorina
insert into public.houses (slug, name, destination_id, capacity, bedrooms, bathrooms, weekday_price, weekend_price, cleaning_fee, min_nights, description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time, address, contact_viber, contact_whatsapp, contact_phone, is_published, featured_rank) values (
  'sale-jahorina', 'Šale Jahorina', 'jahorina', 14, 6, 4, 180, 250, 90, 3, 'Veliki šale blizu ski centra Jahorina. Šest soba, kamin i prostor za celu ekipu posle dana na stazi.', 'A large chalet close to the Jahorina ski resort. Six bedrooms, a fireplace and room for the whole group after a day on the slopes.', true, false, false, '14:00', '10:00', 'Jahorina 7, Pale', null, '+387613334445', '+387613334445', true, null
);
insert into public.house_categories (house_id, category_id) values ((select id from public.houses where slug = 'sale-jahorina'), 'mountain'), ((select id from public.houses where slug = 'sale-jahorina'), 'party');
insert into public.house_amenities (house_id, amenity_id) values ((select id from public.houses where slug = 'sale-jahorina'), 'wifi'), ((select id from public.houses where slug = 'sale-jahorina'), 'parking'), ((select id from public.houses where slug = 'sale-jahorina'), 'kitchen'), ((select id from public.houses where slug = 'sale-jahorina'), 'fireplace'), ((select id from public.houses where slug = 'sale-jahorina'), 'terrace'), ((select id from public.houses where slug = 'sale-jahorina'), 'tv'), ((select id from public.houses where slug = 'sale-jahorina'), 'heating'), ((select id from public.houses where slug = 'sale-jahorina'), 'bbq');
insert into public.house_photos (house_id, url, sort_order) values ((select id from public.houses where slug = 'sale-jahorina'), '/images/house-09.svg', 0);

-- Porodična kuća Kraljeva Voda
insert into public.houses (slug, name, destination_id, capacity, bedrooms, bathrooms, weekday_price, weekend_price, cleaning_fee, min_nights, description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time, address, contact_viber, contact_whatsapp, contact_phone, is_published, featured_rank) values (
  'porodicna-kuca-kraljeva-voda', 'Porodična kuća Kraljeva Voda', 'zlatibor', 6, 3, 2, 75, 110, 45, 2, 'Udobna porodična kuća na Kraljevoj Vodi, sa ograđenim dvorištem i ljuljaškama za decu. Mirno okruženje, a centar Zlatibora je blizu.', 'A comfortable family house in Kraljeva Voda, with a fenced yard and swings for the kids. Quiet surroundings, with the centre of Zlatibor close by.', false, true, false, '15:00', '11:00', 'Kraljeva Voda 8, Zlatibor', '+381645556668', null, null, true, null
);
insert into public.house_categories (house_id, category_id) values ((select id from public.houses where slug = 'porodicna-kuca-kraljeva-voda'), 'family'), ((select id from public.houses where slug = 'porodicna-kuca-kraljeva-voda'), 'mountain');
insert into public.house_amenities (house_id, amenity_id) values ((select id from public.houses where slug = 'porodicna-kuca-kraljeva-voda'), 'wifi'), ((select id from public.houses where slug = 'porodicna-kuca-kraljeva-voda'), 'parking'), ((select id from public.houses where slug = 'porodicna-kuca-kraljeva-voda'), 'kitchen'), ((select id from public.houses where slug = 'porodicna-kuca-kraljeva-voda'), 'fireplace'), ((select id from public.houses where slug = 'porodicna-kuca-kraljeva-voda'), 'terrace'), ((select id from public.houses where slug = 'porodicna-kuca-kraljeva-voda'), 'tv'), ((select id from public.houses where slug = 'porodicna-kuca-kraljeva-voda'), 'heating');
insert into public.house_photos (house_id, url, sort_order) values ((select id from public.houses where slug = 'porodicna-kuca-kraljeva-voda'), '/images/house-10.svg', 0);

-- Apartman za dvoje Brzeće
insert into public.houses (slug, name, destination_id, capacity, bedrooms, bathrooms, weekday_price, weekend_price, cleaning_fee, min_nights, description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time, address, contact_viber, contact_whatsapp, contact_phone, is_published, featured_rank) values (
  'apartman-za-dvoje-brzece', 'Apartman za dvoje Brzeće', 'kopaonik', 2, 1, 1, 60, 90, 30, 2, 'Apartman za dvoje u Brzeću sa đakuzijem i pogledom na planinu. Kamin, tišina i ništa što vas ometa.', 'A two-person apartment in Brzeće with a jacuzzi and mountain views. A fireplace, peace and quiet, and nothing to distract you.', false, false, false, '15:00', '11:00', 'Kopaonik 3, Brzeće', null, '+381627778890', null, true, null
);
insert into public.house_categories (house_id, category_id) values ((select id from public.houses where slug = 'apartman-za-dvoje-brzece'), 'romantic'), ((select id from public.houses where slug = 'apartman-za-dvoje-brzece'), 'mountain');
insert into public.house_amenities (house_id, amenity_id) values ((select id from public.houses where slug = 'apartman-za-dvoje-brzece'), 'wifi'), ((select id from public.houses where slug = 'apartman-za-dvoje-brzece'), 'parking'), ((select id from public.houses where slug = 'apartman-za-dvoje-brzece'), 'kitchen'), ((select id from public.houses where slug = 'apartman-za-dvoje-brzece'), 'fireplace'), ((select id from public.houses where slug = 'apartman-za-dvoje-brzece'), 'tv'), ((select id from public.houses where slug = 'apartman-za-dvoje-brzece'), 'heating');
insert into public.house_photos (house_id, url, sort_order) values ((select id from public.houses where slug = 'apartman-za-dvoje-brzece'), '/images/house-11.svg', 0);

-- Kuća Mitrovac
insert into public.houses (slug, name, destination_id, capacity, bedrooms, bathrooms, weekday_price, weekend_price, cleaning_fee, min_nights, description_sr, description_en, parties_allowed, pets_allowed, smoking_allowed, check_in_time, check_out_time, address, contact_viber, contact_whatsapp, contact_phone, is_published, featured_rank) values (
  'kuca-mitrovac', 'Kuća Mitrovac', 'tara', 10, 5, 3, 120, 170, 70, 2, 'Velika kuća na Mitrovcu, usred Nacionalnog parka Tara. Blizu planinarskih staza, vidikovaca i reke, idealna za aktivne grupe.', 'A large house in Mitrovac, in the middle of Tara National Park. Close to hiking trails, viewpoints and the river, ideal for active groups.', false, true, false, '14:00', '11:00', 'Mitrovac 22, Tara', '+381619990002', null, '+381619990002', true, null
);
insert into public.house_categories (house_id, category_id) values ((select id from public.houses where slug = 'kuca-mitrovac'), 'mountain'), ((select id from public.houses where slug = 'kuca-mitrovac'), 'family');
insert into public.house_amenities (house_id, amenity_id) values ((select id from public.houses where slug = 'kuca-mitrovac'), 'wifi'), ((select id from public.houses where slug = 'kuca-mitrovac'), 'parking'), ((select id from public.houses where slug = 'kuca-mitrovac'), 'kitchen'), ((select id from public.houses where slug = 'kuca-mitrovac'), 'fireplace'), ((select id from public.houses where slug = 'kuca-mitrovac'), 'terrace'), ((select id from public.houses where slug = 'kuca-mitrovac'), 'tv'), ((select id from public.houses where slug = 'kuca-mitrovac'), 'heating'), ((select id from public.houses where slug = 'kuca-mitrovac'), 'bbq');
insert into public.house_photos (house_id, url, sort_order) values ((select id from public.houses where slug = 'kuca-mitrovac'), '/images/house-12.svg', 0);

commit;
