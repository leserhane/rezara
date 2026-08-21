-- What a supplier deals in — a supplier can supply more than one kind of
-- product (e.g. an optical wholesaler selling both frames and sunglasses),
-- so this is an array rather than a single category.

create type supplier_category as enum (
  'monture_optique', 'monture_solaire', 'lentilles', 'accessoires', 'autres'
);

alter table suppliers add column categories supplier_category[] not null default '{}';
