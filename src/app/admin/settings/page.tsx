import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Settings, ArrowLeft } from 'lucide-react'
import { SettingsClient } from './settings-client'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Authoritative server-side ADMIN role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  // Safely ping database for connection status without exposing credentials
  const { count: venueCount, error: dbError } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })

  const systemInfo = {
    appVersion: '0.1.0',
    nextVersion: '16.3.5',
    reactVersion: '19.2.8',
    dbStatus: (dbError ? 'Degraded' : 'Connected') as 'Connected' | 'Degraded' | 'Disconnected',
    nodeVersion: process.version || 'v20+',
    venueCount: venueCount ?? 0,
    timezone: 'Asia/Kolkata',
  }

  return (
    <div className="mx-auto max-w-5xl px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-outline hover:text-on-surface mb-2 font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to Admin Panel
        </Link>
        <div className="flex items-center gap-2.5">
          <Settings className="size-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
            System Settings
          </h1>
        </div>
        <p className="mt-1 text-sm text-outline">
          Manage campus venue booking policies, notification preferences, and system defaults.
        </p>
      </div>

      {/* Settings Sections Client Component */}
      <SettingsClient systemInfo={systemInfo} />
    </div>
  )
}

