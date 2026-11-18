import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/login/actions'
import {
  Landmark,
  LayoutDashboard,
  Building2,
  Search,
  CalendarCheck,
  CalendarDays,
  FileText,
  Shield,
  LogOut,
  Menu,
  LogIn,
} from 'lucide-react'
import { NotificationBell } from './notification-bell'

export async function Navbar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: string | null = null
  let fullName: string | null = null
  let initials = ''

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()
    role = profile?.role ?? null
    fullName = profile?.full_name ?? null

    if (fullName) {
      initials = fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    } else if (user.email) {
      initials = user.email.substring(0, 2).toUpperCase()
    }
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/venues', label: 'Venues', icon: Building2 },
    { href: '/dashboard/availability', label: 'Availability', icon: Search },
    { href: '/dashboard/book', label: 'Book', icon: CalendarCheck },
    { href: '/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/dashboard/requests', label: 'My Requests', icon: FileText },
  ]

  return (
    <nav className="sticky top-0 z-40 w-full bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 flex-shrink-0">
      <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href={user ? '/dashboard' : '/'}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FF6835] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Landmark className="size-4.5 text-white" />
            </div>
            <span className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
              Venuity
            </span>
          </Link>

          {/* Desktop navigation */}
          {user && (
            <div className="hidden lg:flex items-center gap-1 ml-2">
              {navLinks.map((link) => {
                const IconComponent = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                  >
                    <IconComponent className="size-4 text-outline" />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
              {role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                >
                  <Shield className="size-4 text-outline" />
                  <span>Admin</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-3 mr-2">
                <div className="text-right">
                  <p className="font-label-md text-label-md text-on-surface font-semibold">
                    {fullName}
                  </p>
                  <p className="font-label-sm text-label-sm text-outline capitalize">
                    {role?.toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <NotificationBell userId={user.id} />

                <details className="relative group cursor-pointer list-none">
                  <summary className="list-none outline-none">
                    <div className="w-9 h-9 rounded-full bg-[#FF6835] text-white flex items-center justify-center font-headline-sm text-[13px] font-bold shadow-sm shadow-[#FF6835]/20 hover:scale-105 transition-transform">
                      {initials}
                    </div>
                  </summary>
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-1.5 shadow-lg shadow-black/5 z-50">
                    <form action={logout} className="w-full">
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 font-label-md text-label-md text-error hover:bg-error-container/50 transition-colors cursor-pointer"
                      >
                        <LogOut className="size-4 text-error" />
                        <span>Sign Out</span>
                      </button>
                    </form>
                  </div>
                </details>
              </div>

              {/* Mobile Menu */}
              <details className="relative lg:hidden list-none">
                <summary className="flex cursor-pointer items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container list-none outline-none text-on-surface">
                  <Menu className="size-5 text-on-surface" />
                </summary>
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-2 shadow-xl shadow-black/10 z-50 flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const IconComponent = link.icon
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                      >
                        <IconComponent className="size-4.5 text-outline" />
                        <span>{link.label}</span>
                      </Link>
                    )
                  })}
                  {role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 rounded-xl px-4 py-3 font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                    >
                      <Shield className="size-4.5 text-outline" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                </div>
              </details>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FF6835] text-white font-label-md text-label-md hover:bg-[#C94B24] transition-colors shadow-sm active:scale-95 cursor-pointer"
            >
              <span>Sign In</span>
              <LogIn className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
