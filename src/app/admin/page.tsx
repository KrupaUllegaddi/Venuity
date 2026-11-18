import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Users, CalendarDays, Shield, Settings } from 'lucide-react'

export default async function AdminPage() {
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
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  // Fetch admin stats
  const { count: totalVenues } = await supabase
    .from('venues')
    .select('*', { count: 'exact', head: true })

  const { count: totalDepts } = await supabase
    .from('departments')
    .select('*', { count: 'exact', head: true })

  const { count: pendingRequests } = await supabase
    .from('booking_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PENDING')

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const adminSections = [
    {
      title: 'Venue Management',
      description: 'Add, edit, and manage campus venues and their facilities.',
      href: '/admin/venues',
      icon: Building2,
    },
    {
      title: 'User Management',
      description: 'Manage user roles and department assignments.',
      href: '/admin/users',
      icon: Users,
    },
    {
      title: 'Booking Requests',
      description: `Review and approve pending requests. ${pendingRequests ?? 0} pending.`,
      href: '/admin/requests',
      icon: CalendarDays,
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and defaults.',
      href: '/admin/settings',
      icon: Settings,
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 md:pb-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="size-5 text-foreground" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Admin Panel
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          System administration for {profile.full_name}
        </p>
      </div>

      {/* Admin stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4 mb-6 sm:mb-8">
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4">
          <p className="text-xs text-muted-foreground">Total Venues</p>
          <p className="text-xl sm:text-2xl font-semibold text-foreground">{totalVenues ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4">
          <p className="text-xs text-muted-foreground">Departments</p>
          <p className="text-xl sm:text-2xl font-semibold text-foreground">{totalDepts ?? 0}</p>
        </div>
        <div className={`rounded-xl border p-3.5 sm:p-4 ${
          (pendingRequests ?? 0) > 0
            ? 'border-amber-200 bg-amber-50'
            : 'border-border bg-card'
        }`}>
          <p className="text-xs text-muted-foreground">Pending Requests</p>
          <p className="text-xl sm:text-2xl font-semibold text-foreground">{pendingRequests ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4">
          <p className="text-xs text-muted-foreground">Registered Users</p>
          <p className="text-xl sm:text-2xl font-semibold text-foreground">{totalUsers ?? 0}</p>
        </div>
      </div>

      {/* Admin sections */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {adminSections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href} className="block group">
              <div className="rounded-xl border border-border bg-card p-6 transition-colors group-hover:border-foreground/20 group-hover:bg-muted/50">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-muted p-2.5 text-muted-foreground group-hover:bg-foreground/10 group-hover:text-foreground transition-colors">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {section.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
