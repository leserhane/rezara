-- Lens technical order sheet ("fiche technique verres") — filled by the
-- optician when a sale includes lenses to be fabricated/ordered from a
-- lens supplier. One sheet per sale; the frame is not duplicated here —
-- it's read from the sale's own monture line item (sale_items) by the
-- frontend, matching "frame: retrieved from the frame selected via the
-- file number" (the file = the sale).

create type lens_sheet_category as enum ('homme_adulte', 'femme_adulte', 'homme_enfant', 'femme_enfant');
create type lens_sheet_type as enum ('standard', 'aminci', 'super_aminci', 'extra_aminci');
create type lens_sheet_material as enum ('organique', 'mineral', 'polycarbonate');
create type lens_sheet_finish as enum ('clair', 'anti_reflet', 'lumiere_bleue', 'photochromique', 'transitions', 'teinte');
create type lens_sheet_vision as enum ('loin', 'pres', 'intermediaire', 'progressif');

create table lens_order_sheets (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null unique references sales(id) on delete cascade,
  file_number text not null,
  order_date date not null default current_date,
  estimated_delivery_date date,

  category lens_sheet_category,
  lens_type lens_sheet_type,
  material lens_sheet_material,

  finish lens_sheet_finish,
  tint_category text, -- a, b, c, d, td — only meaningful when finish = 'teinte'
  tint_color text,    -- bleu, vert, gris, tsm — only meaningful when finish = 'teinte'

  lens_index text,       -- '1.50', '1.56', '1.60', '1.67', '1.74', 'autre'
  lens_index_other text, -- free text when lens_index = 'autre'
  diameter text,         -- '50'..'90', 'autre'
  diameter_other text,   -- free text when diameter = 'autre'

  vision_type lens_sheet_vision,

  od_sphere numeric(5,2), od_cylinder numeric(5,2), od_axis integer, od_addition numeric(5,2),
  od_prism numeric(5,2), od_base text, od_pd numeric(5,2), od_height numeric(5,2),

  og_sphere numeric(5,2), og_cylinder numeric(5,2), og_axis integer, og_addition numeric(5,2),
  og_prism numeric(5,2), og_base text, og_pd numeric(5,2), og_height numeric(5,2),

  supplier_id uuid references suppliers(id) on delete set null,
  notes text,

  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_lens_order_sheets_supplier on lens_order_sheets(supplier_id);

alter table lens_order_sheets enable row level security;

create policy lens_order_sheets_read on lens_order_sheets for select using (auth.uid() is not null);
create policy lens_order_sheets_insert on lens_order_sheets for insert with check (auth.uid() is not null);
create policy lens_order_sheets_update on lens_order_sheets for update using (auth.uid() is not null) with check (auth.uid() is not null);
create policy lens_order_sheets_delete on lens_order_sheets for delete using (is_admin());

create trigger trg_lens_order_sheets_updated_at before update on lens_order_sheets
  for each row execute function set_updated_at();
