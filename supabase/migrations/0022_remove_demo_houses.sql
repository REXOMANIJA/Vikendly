-- Vikendly: remove the 10 demo houses from 0018 and 0019 (not real places)
-- Run once in Supabase → SQL Editor. Safe to run twice (the second time deletes nothing).
-- Their photos, categories, amenities, prices, units and holiday-offer ticks are deleted with
-- them; booking requests keep the house name. This cannot be undone.

delete from public.houses
where slug in (
  'brvnara-jelova-kosa', 'apartman-suncani-vrh', 'kuca-medju-vinogradima',
  'vila-sa-bazenom-ripanj', 'brvnara-na-obali-drine',
  'a-frame-maljen', 'kuca-na-vlasinskom-jezeru', 'planinska-vila-jahorina',
  'seoska-kuca-sargan', 'brvnara-pod-durmitorom'
);
