-- SAMPLE DATA ONLY: placeholder names and prices for development.
-- Delete with the cleanup block at the bottom once the real menu is entered.

insert into public.menu_categories (club_id, name, kind, sort_order)
select c.id, v.name, v.kind::public.menu_kind, v.sort_order
from public.clubs c,
     (values ('Sample Drinks', 'drink', 1),
             ('Sample Food',   'food',  2)) as v(name, kind, sort_order)
where c.slug = 'druids-lounge';

insert into public.menu_items (club_id, category_id, name, description, price_kes, is_featured, sort_order)
select c.id, cat.id, v.name, v.descr, v.price, v.featured, v.sort_order
from public.clubs c
join public.menu_categories cat on cat.club_id = c.id
join (values
  ('Sample Drinks', 'Sample Cocktail',       'Placeholder description', 800.00,  true,  1),
  ('Sample Drinks', 'Sample Beer',           'Placeholder description', 350.50,  false, 2),
  ('Sample Drinks', 'Sample Bottle Service', 'Placeholder description', 8000.00, true,  3),
  ('Sample Food',   'Sample Platter',        'Placeholder description', 1500.00, true,  1),
  ('Sample Food',   'Sample Snack',          'Placeholder description', 450.75,  false, 2)
) as v(cat_name, name, descr, price, featured, sort_order) on v.cat_name = cat.name
where c.slug = 'druids-lounge';

-- ---------- CLEANUP (run later, not now) ----------
-- delete from public.menu_items      where name like 'Sample%';
-- delete from public.menu_categories where name like 'Sample%';