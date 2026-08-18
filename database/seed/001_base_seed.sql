-- Base seed: roles, permissions, one store, payment methods, expense
-- categories, product categories. Required before any real usage
-- (including the demo dataset in seed/002_demo_data.sql).

insert into roles (key, name, description) values
  ('admin', 'Administrateur', 'Accès complet à l''application'),
  ('opticien', 'Opticien', 'Accès opérationnel quotidien')
on conflict (key) do nothing;

insert into permissions (key, description) values
  ('settings.accounting.edit', 'Modifier les paramètres comptables critiques'),
  ('products.cost.edit', 'Modifier les coûts d''achat'),
  ('reports.financial.view', 'Consulter les données financières réservées'),
  ('users.manage', 'Gérer les utilisateurs'),
  ('backups.manage', 'Gérer les sauvegardes')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r, permissions p where r.key = 'admin'
on conflict do nothing;

insert into stores (id, name, address, phone, email, ice, currency, default_tax_rate)
values ('00000000-0000-0000-0000-000000000001', 'Optimum Optic', 'Rabat, Maroc', '+212 5 00 00 00 00', 'contact@optimumoptic.com', '000000000000000', 'MAD', 20.00)
on conflict (id) do nothing;

insert into payment_methods (code, name) values
  ('especes', 'Espèces'),
  ('carte', 'Carte bancaire'),
  ('virement', 'Virement'),
  ('cheque', 'Chèque'),
  ('mobile', 'Paiement mobile'),
  ('autre', 'Autre')
on conflict (code) do nothing;

insert into expense_categories (name) values
  ('Loyer'), ('Salaires'), ('Fournisseurs'), ('Électricité'), ('Eau'),
  ('Internet'), ('Marketing'), ('Transport'), ('Entretien'), ('Matériel'),
  ('Taxes'), ('Autres')
on conflict (name) do nothing;

insert into product_categories (name, group_key) values
  ('Optique Homme', 'optique_homme'),
  ('Optique Femme', 'optique_femme'),
  ('Optique Enfant', 'optique_enfant'),
  ('Solaire Homme', 'solaire_homme'),
  ('Solaire Femme', 'solaire_femme'),
  ('Solaire Enfant', 'solaire_enfant'),
  ('Sport', 'sport'),
  ('Premium', 'premium'),
  ('Autres', 'autres')
on conflict do nothing;
