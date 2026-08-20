import { useEffect, useRef, useState } from 'react'
import { Bell, EyeOff, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDateTime } from '@/lib/format'
import type { Notification } from '@/types/database'

// Every notification in this app is a store-wide broadcast (user_id is
// null) — see create_sale / trg_low_stock_notify. A single shared is_read
// flag can't represent "read" per-viewer for a broadcast row without
// hiding it from colleagues who haven't seen it yet, so instead each
// profile remembers its own notifications_last_seen_at: a notification is
// unread for a given user simply if it was created after that timestamp.
export function NotificationBell() {
  const { profile, refreshProfile } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [hideRead, setHideRead] = useState(false)
  // The persisted threshold (from the profile row) drives the badge count.
  // sessionSeenAt is a snapshot of that value taken the moment the bell is
  // opened, and is what the in-list unread dots / "hide read" filter use —
  // otherwise, since opening immediately pushes the persisted threshold
  // forward to clear the badge, every item would instantly look "read"
  // the moment the dropdown appears.
  const persistedSeenAt = useRef<string | null>(profile?.notifications_last_seen_at ?? null)
  const [sessionSeenAt, setSessionSeenAt] = useState<string | null>(persistedSeenAt.current)
  const [, forceRender] = useState(0)

  useEffect(() => {
    persistedSeenAt.current = profile?.notifications_last_seen_at ?? null
  }, [profile?.notifications_last_seen_at])

  useEffect(() => {
    if (!profile) return

    const load = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${profile.id},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(20)
      setItems(data ?? [])
    }
    load()

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => setItems((prev) => [payload.new as Notification, ...prev].slice(0, 20))
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile])

  const isUnread = (n: Notification) => !persistedSeenAt.current || n.created_at > persistedSeenAt.current
  const unreadCount = items.filter(isUnread).length
  const isUnreadThisSession = (n: Notification) => !sessionSeenAt || n.created_at > sessionSeenAt
  const visibleItems = hideRead ? items.filter(isUnreadThisSession) : items

  const toggleOpen = async () => {
    const next = !open
    setOpen(next)
    if (next && profile) {
      // Freeze the current threshold for this session's unread markers,
      // then push the real "seen" timestamp forward so the badge clears
      // immediately and stays clear next time the bell is opened.
      setSessionSeenAt(persistedSeenAt.current)
      const now = new Date().toISOString()
      await supabase.from('profiles').update({ notifications_last_seen_at: now }).eq('id', profile.id)
      persistedSeenAt.current = now
      forceRender((x) => x + 1)
      refreshProfile()
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative text-slate-500 hover:text-slate-700 dark:text-slate-400"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] rounded-lg border border-sand-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-sand-100 px-4 py-2 dark:border-slate-700">
            <span className="text-sm font-semibold">Notifications</span>
            <button
              onClick={() => setHideRead((h) => !h)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-brand-700 dark:hover:text-brand-400"
            >
              {hideRead ? <Eye size={13} /> : <EyeOff size={13} />}
              {hideRead ? 'Tout afficher' : 'Masquer les lues'}
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {visibleItems.length === 0 && (
              <p className="p-4 text-sm text-slate-400">
                {hideRead ? 'Aucune notification non lue.' : 'Aucune notification.'}
              </p>
            )}
            {visibleItems.map((n) => (
              <div key={n.id} className="flex gap-2 border-b border-sand-100 px-4 py-3 last:border-0 dark:border-slate-700/50">
                {isUnreadThisSession(n) ? (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-700" />
                ) : (
                  <span className="mt-1.5 h-2 w-2 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{n.message}</div>
                  <div className="mt-1 text-[11px] text-slate-400">{formatDateTime(n.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
