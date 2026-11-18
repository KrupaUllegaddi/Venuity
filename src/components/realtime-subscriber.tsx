/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'

export function RealtimeSubscriber() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        supabase.from('profiles').select('role').eq('id', user.id).single()
          .then(({ data }) => {
            if (data) setRole(data.role)
          })
      }
    })

    const channel = supabase
      .channel('venuity-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'booking_requests' },
        (payload) => {
          router.refresh()
          
          if (payload.eventType === 'INSERT' && (role === 'ADMIN' || role === 'HOD')) {
            toast.info(`New booking request: ${(payload.new as any).event_name}`)
          } else if (payload.eventType === 'UPDATE' && (payload.new as any).requester_id === userId) {
            toast.success(`Request status updated: ${(payload.new as any).status}`)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          router.refresh()
          if (payload.eventType === 'INSERT') {
            toast.success(`Booking confirmed: ${(payload.new as any).event_name}`)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'venues' },
        (payload) => {
          router.refresh()
          if (payload.eventType === 'UPDATE') {
            toast.info(`Venue status updated: ${(payload.new as any).name}`)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_windows' },
        (payload) => {
          router.refresh()
          if (payload.eventType === 'INSERT') {
            toast.warning(`Venue maintenance scheduled`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, role, userId])

  return null
}
