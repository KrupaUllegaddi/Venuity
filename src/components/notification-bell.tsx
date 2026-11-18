'use client'

import { useState, useEffect } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  created_at: string
  read_at: string | null
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    // Initial fetch
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        setNotifications(data as NotificationItem[])
      }
    }

    fetchNotifications()

    // Realtime subscription for instant alerts
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  const unreadCount = notifications.filter((n) => !n.read_at).length

  const markAllRead = async () => {
    if (unreadCount === 0) return
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id)
    if (unreadIds.length === 0) return

    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds)

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen && unreadCount > 0) {
            markAllRead()
          }
        }}
        aria-label="Notifications"
        className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-all cursor-pointer relative"
      >
        <Bell className="size-4.5 text-outline" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between px-2 py-1.5 mb-2 border-b border-surface-container">
              <span className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-1.5">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-surface-container/50">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl transition-colors ${
                      !n.read_at ? 'bg-primary/5 border border-primary/10' : 'hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-label-md text-xs font-bold text-on-surface">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-outline shrink-0">
                        {new Date(n.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="font-body-sm text-xs text-outline mt-0.5 leading-snug">
                      {n.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-outline text-xs">
                  No notifications yet.
                </div>
              )}
            </div>

            <div className="pt-2 mt-2 border-t border-surface-container text-center">
              <Link
                href="/dashboard/requests"
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                View all requests & updates →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
