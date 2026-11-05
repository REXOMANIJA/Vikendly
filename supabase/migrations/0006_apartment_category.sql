-- Vikendly: replace the "Romantični vikend" category with "Apartman"
-- Run once in Supabase → SQL Editor, after 0005.
--
-- Only real apartments should be in the new category, so houses tagged "romantic" are NOT all
-- moved: the sample apartment (apartman-za-dvoje-brzece) becomes "apartment", the rest simply
-- lose the romantic tag. Change any house's categories later in the admin panel.

begin;

insert into public.categories (id, slug, sort_order)
values ('apartment', 'apartment', 5)
on conflict (id) do nothing;

update public.house_categories hc
set category_id = 'apartment'
from public.houses h
where hc.house_id = h.id
  and hc.category_id = 'romantic'
  and h.slug = 'apartman-za-dvoje-brzece';

delete from public.house_categories where category_id = 'romantic';
delete from public.categories where id = 'romantic';

commit;
