-- Per-user "last seen" marker for notifications.
--
-- Every notification currently inserted (nouvelle_vente, stock_faible, ...)
-- is a store-wide broadcast (notifications.user_id is null), and the
-- existing notifications.is_read column is a single shared flag — flipping
-- it when one optician opens the bell would hide the notification for
-- every other optician in the store too, which is wrong. Instead each
-- profile independently remembers when they last opened the bell; a
-- notification is "unread" for a given user simply if it was created after
-- their own last-seen timestamp. This needs no RPC: profiles_self_update
-- already lets a user update their own non-role_id columns.

alter table profiles add column notifications_last_seen_at timestamptz;
