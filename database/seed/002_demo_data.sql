-- Demo / fictional data for local testing and product demos.
-- No real personal data is used — all names are placeholders.
--
-- PREREQUISITES:
--   1. seed/001_base_seed.sql has been run.
--   2. Two Supabase Auth users already exist (create them via
--      Authentication -> Add User in the Supabase dashboard, or
--      supabase.auth.signUp from a script):
--        - an admin    (e.g. admin@optimumoptic.com)
--        - an opticien (e.g. opticien@optimumoptic.com)
--   3. Before running this file, replace the two placeholder UUIDs below
--      (\set admin_id / \set opticien_id) with those two users' real
--      auth.users.id.
--
-- This creates their profiles, a fictional catalog (~130 products), 30
-- customers, prescriptions, a handful of expenses, and ~18 real sales
-- created through the create_sale()/record_payment() RPCs (impersonating
-- the opticien via request.jwt.claims) so stock, cash movements, margins
-- and invoices are all produced by the real business logic.

\set admin_id '00000000-0000-0000-0000-0000000000a1'
\set opticien_id '00000000-0000-0000-0000-0000000000a2'
\set store_id '00000000-0000-0000-0000-000000000001'

insert into profiles (id, store_id, role_id, first_name, last_name, max_discount_percent)
select :'admin_id'::uuid, :'store_id'::uuid, r.id, 'Yassine', 'Alaoui', 100
from roles r where r.key = 'admin'
on conflict (id) do nothing;

insert into profiles (id, store_id, role_id, first_name, last_name, max_discount_percent)
select :'opticien_id'::uuid, :'store_id'::uuid, r.id, 'Sara', 'Bennani', 10
from roles r where r.key = 'opticien'
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- Brands & suppliers
-- ------------------------------------------------------------------
insert into brands (name) values
  ('Ray-Ban'), ('Persol'), ('Oakley'), ('Carrera'), ('Vogue'), ('Essilor'), ('Zeiss'), ('Acuvue')
on conflict (name) do nothing;

insert into suppliers (name, contact_name, phone, email)
select 'Optic Distribution Maroc', 'Karim Idrissi', '+212 522 000 001', 'contact@opticdist.ma'
where not exists (select 1 from suppliers where name = 'Optic Distribution Maroc');

-- ------------------------------------------------------------------
-- Catalog: 50 montures, 30 verres, 20 lentilles, 30 accessoires
-- ------------------------------------------------------------------
do $$
declare
  v_store_id uuid := '00000000-0000-0000-0000-000000000001';
  v_supplier_id uuid;
  v_brand_ids uuid[];
  v_category_ids uuid[];
  v_product_id uuid;
  v_colors text[] := array['Noir', 'Havane', 'Écaille', 'Bleu marine', 'Bordeaux', 'Doré', 'Argenté', 'Transparent'];
  v_shapes text[] := array['Rectangulaire', 'Ronde', 'Aviateur', 'Papillon', 'Ovale', 'Carrée'];
  v_materials_frame text[] := array['Acétate', 'Métal', 'Titane', 'TR90'];
  v_genders gender_type[] := array['homme', 'femme', 'autre']::gender_type[];
  v_treatments text[] := array['Anti-reflet', 'Anti-rayure', 'Filtre lumière bleue', 'Photochromique', 'Polarisé'];
  v_lens_materials text[] := array['CR39', 'Polycarbonate', 'Trivex'];
  v_wear_types text[] := array['journaliere', 'mensuelle', 'trimestrielle', 'annuelle'];
  v_lens_kinds text[] := array['standard', 'torique', 'multifocale', 'cosmetique'];
  v_accessory_names text[] := array['Étui rigide', 'Étui souple', 'Chiffon microfibre', 'Spray nettoyant', 'Cordon lunettes', 'Pince-nez de rechange', 'Kit de vis', 'Loupe de poche'];
  i int;
begin
  select array_agg(id) into v_brand_ids from brands;
  select array_agg(id) into v_category_ids from product_categories;
  select id into v_supplier_id from suppliers limit 1;

  -- Montures
  for i in 1..50 loop
    insert into products (store_id, type, sku, name, brand_id, category_id, supplier_id, purchase_price_ht, sale_price_ht, tax_rate, quantity, stock_min)
    values (
      v_store_id, 'monture', 'MNT-' || lpad(i::text, 4, '0'),
      'Monture ' || v_shapes[1 + (i % array_length(v_shapes, 1))] || ' #' || i,
      v_brand_ids[1 + (i % array_length(v_brand_ids, 1))],
      v_category_ids[1 + (i % array_length(v_category_ids, 1))],
      v_supplier_id,
      round((300 + random() * 900)::numeric, 2),
      round((700 + random() * 2000)::numeric, 2),
      20.00,
      floor(random() * 20)::int,
      2
    ) returning id into v_product_id;

    insert into frame_details (product_id, collection, color, size, shape, gender, material)
    values (
      v_product_id, 'Collection ' || (2024 + (i % 3)),
      v_colors[1 + (i % array_length(v_colors, 1))],
      (50 + (i % 10))::text,
      v_shapes[1 + (i % array_length(v_shapes, 1))],
      v_genders[1 + (i % array_length(v_genders, 1))],
      v_materials_frame[1 + (i % array_length(v_materials_frame, 1))]
    );
  end loop;

  -- Verres
  for i in 1..30 loop
    insert into products (store_id, type, sku, name, brand_id, supplier_id, purchase_price_ht, sale_price_ht, tax_rate, quantity, stock_min)
    values (
      v_store_id, 'verre', 'VER-' || lpad(i::text, 4, '0'),
      'Verre organique indice ' || (1.5 + (i % 3) * 0.1)::numeric(3,1) || ' #' || i,
      v_brand_ids[1 + (i % array_length(v_brand_ids, 1))],
      v_supplier_id,
      round((150 + random() * 600)::numeric, 2),
      round((400 + random() * 1500)::numeric, 2),
      20.00,
      floor(random() * 40)::int,
      4
    ) returning id into v_product_id;

    insert into lens_details (product_id, lens_type, material, refractive_index, treatment)
    values (
      v_product_id, 'Unifocal',
      v_lens_materials[1 + (i % array_length(v_lens_materials, 1))],
      (1.5 + (i % 3) * 0.1)::numeric(4,2),
      v_treatments[1 + (i % array_length(v_treatments, 1))]
    );
  end loop;

  -- Lentilles
  for i in 1..20 loop
    insert into products (store_id, type, sku, name, brand_id, supplier_id, purchase_price_ht, sale_price_ht, tax_rate, quantity, stock_min)
    values (
      v_store_id, 'lentille', 'LEN-' || lpad(i::text, 4, '0'),
      'Lentilles ' || v_wear_types[1 + (i % array_length(v_wear_types, 1))] || ' #' || i,
      v_brand_ids[1 + (i % array_length(v_brand_ids, 1))],
      v_supplier_id,
      round((80 + random() * 200)::numeric, 2),
      round((180 + random() * 400)::numeric, 2),
      20.00,
      floor(random() * 60)::int,
      6
    ) returning id into v_product_id;

    insert into contact_lens_details (product_id, wear_type, lens_kind, material)
    values (
      v_product_id,
      v_wear_types[1 + (i % array_length(v_wear_types, 1))],
      v_lens_kinds[1 + (i % array_length(v_lens_kinds, 1))],
      'Hydrogel de silicone'
    );
  end loop;

  -- Accessoires
  for i in 1..30 loop
    insert into products (store_id, type, sku, name, supplier_id, purchase_price_ht, sale_price_ht, tax_rate, quantity, stock_min)
    values (
      v_store_id, 'accessoire', 'ACC-' || lpad(i::text, 4, '0'),
      v_accessory_names[1 + (i % array_length(v_accessory_names, 1))] || ' #' || i,
      v_supplier_id,
      round((10 + random() * 60)::numeric, 2),
      round((30 + random() * 150)::numeric, 2),
      20.00,
      floor(random() * 50)::int,
      5
    );
  end loop;
end $$;

-- ------------------------------------------------------------------
-- 30 fictional customers + prescriptions for half of them
-- ------------------------------------------------------------------
do $$
declare
  v_store_id uuid := '00000000-0000-0000-0000-000000000001';
  v_opticien_id uuid := '00000000-0000-0000-0000-0000000000a2';
  v_first_names text[] := array['Ahmed', 'Fatima', 'Youssef', 'Khadija', 'Omar', 'Salma', 'Hamza', 'Imane', 'Rachid', 'Nadia', 'Karim', 'Layla', 'Mehdi', 'Zineb', 'Anas', 'Hafsa', 'Bilal', 'Meryem', 'Yassine', 'Ghita', 'Adil', 'Asmae', 'Reda', 'Houda', 'Simo', 'Ilham', 'Othmane', 'Sanaa', 'Walid', 'Amal'];
  v_last_names text[] := array['Benali', 'El Amrani', 'Idrissi', 'Fassi', 'Tazi', 'Alaoui', 'Bennani', 'Cherkaoui', 'Berrada', 'Lahlou', 'Ziani', 'Kabbaj', 'Squalli', 'Sefrioui', 'Belhaj'];
  v_customer_id uuid;
  i int;
begin
  for i in 1..30 loop
    insert into customers (store_id, first_name, last_name, phone, birth_date, gender, assigned_optician_id, created_by)
    values (
      v_store_id,
      v_first_names[1 + (i % array_length(v_first_names, 1))],
      v_last_names[1 + (i % array_length(v_last_names, 1))],
      '+2126' || lpad((10000000 + i * 137)::text, 8, '0'),
      (date '1965-01-01' + (i * 311 || ' days')::interval)::date,
      (case when i % 2 = 0 then 'homme' else 'femme' end)::gender_type,
      v_opticien_id, v_opticien_id
    ) returning id into v_customer_id;

    if i % 2 = 0 then
      insert into prescriptions (customer_id, od_sphere, od_cylinder, od_axis, og_sphere, og_cylinder, og_axis, doctor_name, created_by)
      values (
        v_customer_id,
        round((-3 + random() * 6)::numeric, 2), round((-1 + random() * 2)::numeric, 2), (floor(random() * 180))::int,
        round((-3 + random() * 6)::numeric, 2), round((-1 + random() * 2)::numeric, 2), (floor(random() * 180))::int,
        'Dr. Fassi', v_opticien_id
      );
    end if;
  end loop;
end $$;

-- ------------------------------------------------------------------
-- Expenses
-- ------------------------------------------------------------------
insert into expenses (store_id, category_id, expense_date, amount_ht, tax_amount, payment_method_id, user_id, comment)
select '00000000-0000-0000-0000-000000000001', c.id, current_date - (n || ' days')::interval,
  amt, round(amt * 0.20, 2),
  (select id from payment_methods where code = 'virement'),
  '00000000-0000-0000-0000-0000000000a1', label
from (values
  ('Loyer', 8000::numeric, 5, 'Loyer du mois'),
  ('Électricité', 650, 12, 'Facture électricité'),
  ('Internet', 400, 20, 'Abonnement internet'),
  ('Marketing', 1200, 8, 'Campagne réseaux sociaux'),
  ('Fournisseurs', 15000, 3, 'Réapprovisionnement montures')
) as e(cat_name, amt, n, label)
join expense_categories c on c.name = e.cat_name;

-- ------------------------------------------------------------------
-- ~18 real sales via create_sale()/record_payment(), impersonating the
-- opticien so the RLS + business rules run exactly as they would from
-- the app. request.jwt.claims is session-scoped (is_local = false) so it
-- persists across the statements below.
-- ------------------------------------------------------------------
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-0000000000a2')::text, false);

do $$
declare
  v_customer_ids uuid[];
  v_frame_ids uuid[];
  v_lens_ids uuid[];
  v_accessory_ids uuid[];
  v_payment_method_id uuid;
  v_sale record;
  v_customer_id uuid;
  v_items jsonb;
  v_deposit numeric;
  i int;
begin
  select array_agg(id) into v_customer_ids from customers;
  select array_agg(id) into v_frame_ids from products where type = 'monture' and quantity > 3;
  select array_agg(id) into v_lens_ids from products where type = 'verre' and quantity > 3;
  select array_agg(id) into v_accessory_ids from products where type = 'accessoire' and quantity > 3;
  select id into v_payment_method_id from payment_methods where code = 'especes';

  for i in 1..18 loop
    v_customer_id := v_customer_ids[1 + (i * 7 % array_length(v_customer_ids, 1))];
    v_items := jsonb_build_array(
      jsonb_build_object('product_id', v_frame_ids[1 + (i * 3 % array_length(v_frame_ids, 1))], 'item_role', 'monture', 'quantity', 1),
      jsonb_build_object('product_id', v_lens_ids[1 + (i * 5 % array_length(v_lens_ids, 1))], 'item_role', 'verre', 'quantity', 1)
    );
    if i % 3 = 0 then
      v_items := v_items || jsonb_build_array(
        jsonb_build_object('product_id', v_accessory_ids[1 + (i % array_length(v_accessory_ids, 1))], 'item_role', 'accessoire', 'quantity', 1)
      );
    end if;

    select * into v_sale from create_sale(
      p_customer_id := v_customer_id,
      p_items := v_items,
      p_cart_discount_amount := case when i % 4 = 0 then 100 else 0 end,
      p_deposit_amount := 0
    );

    -- Vary payment completeness: some unpaid, some deposit, some fully paid.
    if i % 3 = 1 then
      v_deposit := round(v_sale.total_ttc * 0.4, 2);
      perform record_payment(v_sale.id, v_deposit, 'acompte', v_payment_method_id);
    elsif i % 3 = 2 then
      perform record_payment(v_sale.id, v_sale.total_ttc, 'paiement_total', v_payment_method_id);
    end if;
    -- i % 3 = 0 -> left unpaid, to populate "créances clients"
  end loop;
end $$;

-- Reset impersonation.
select set_config('request.jwt.claims', '', false);
