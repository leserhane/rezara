-- Add "Verres" (ophthalmic lenses) as its own supplier category, distinct
-- from 'lentilles' (contact lenses).

alter type supplier_category add value if not exists 'verres' after 'monture_solaire';
