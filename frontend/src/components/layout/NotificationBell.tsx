import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { formatDateTime } from '@/lib/format'
import type { Notification } from '@/types/database'

export function NotificationBell() {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])

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

  const unreadCount = items.filter((i) => !i.is_read).length

  const markAllRead = async () => {
    const unreadIds = items.filter((i) => !i.is_read && i.user_id).map((i) => i.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })))
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o)
          if (!open) markAllRead()
        }}
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
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[90vw] rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-100 px-4 py-2 text-sm font-semibold dark:border-slate-700">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <p className="p-4 text-sm text-slate-400">Aucune notification.</p>}
            {items.map((n) => (
              <div key={n.id} className="border-b border-slate-50 px-4 py-3 last:border-0 dark:border-slate-700/50">
                <div className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{n.message}</div>
                <div className="mt-1 text-[11px] text-slate-400">{formatDateTime(n.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
