-- Reporting views: CRM stats, revenue journal, VIP tiers.

create view v_customer_stats with (security_invoker = true) as
select
  c.id as customer_id,
  c.store_id,
  count(s.id) filter (where s.status <> 'annule') as purchase_count,
  coalesce(sum(s.total_ttc) filter (where s.status <> 'annule'), 0) as lifetime_value,
  coalesce(avg(s.total_ttc) filter (where s.status <> 'annule'), 0) as average_basket,
  max(s.created_at) as last_purchase_at,
  coalesce(sum(s.amount_due) filter (where s.status not in ('annule', 'paye')), 0) as balance_due,
  case
    when coalesce(sum(s.total_ttc) filter (where s.status <> 'annule'), 0) >= (select vip_platinum_threshold from store_settings where store_id = c.store_id) then 'vip'
    when coalesce(sum(s.total_ttc) filter (where s.status <> 'annule'), 0) >= (select vip_gold_threshold from store_settings where store_id = c.store_id) then 'gold'
    when coalesce(sum(s.total_ttc) filter (where s.status <> 'annule'), 0) >= (select vip_silver_threshold from store_settings where store_id = c.store_id) then 'silver'
    else 'bronze'
  end as vip_tier
from customers c
left join sales s on s.customer_id = c.id
group by c.id, c.store_id;

create view v_revenue_journal with (security_invoker = true) as
select
  p.id, p.sale_id, 'vente'::text as source, p.payment_type, p.amount,
  p.payment_method_id, p.customer_id, p.user_id, p.created_at
from payments p
union all
select
  r.id, null::uuid as sale_id, 'autre'::text as source, null::payment_type as payment_type,
  r.amount, null::uuid as payment_method_id, null::uuid as customer_id, r.user_id, r.created_at
from revenues r;

create view v_low_stock_products with (security_invoker = true) as
select * from v_products where quantity <= stock_min and is_active = true;
