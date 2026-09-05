-- Brands were left writable by any authenticated user (an oversight from
-- the same class of gap fixed for suppliers in 027) — bring them in line
-- with products/categories/suppliers, which are all admin-only writes.
-- The frontend already only exposes brand creation to admins (the product
-- form's quick-add, itself only reachable from the admin-only "Nouveau
-- produit" button), so this closes the matching server-side hole.

drop policy if exists brands_write on brands;
create policy brands_write on brands for all using (is_admin()) with check (is_admin());
