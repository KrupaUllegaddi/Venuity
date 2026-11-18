'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Building2,
  CalendarCheck,
  CalendarDays,
  FileText,
} from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  // Hide on splash, login, signup, complete-profile, and venue details
  const isVenueDetails = pathname.startsWith('/venues/')
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/complete-profile' ||
    isVenueDetails
  ) {
    return null
  }

  const isHome = pathname === '/dashboard'
  const isVenues = pathname.startsWith('/venues') || pathname === '/dashboard/availability'
  const isBookings = pathname.startsWith('/dashboard/book')
  const isCalendar = pathname.startsWith('/calendar')
  const isRequests = pathname.startsWith('/dashboard/requests')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden justify-around items-center px-2 py-2 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/60 shadow-[0_-4px_20px_0_rgba(41,37,36,0.06)] pb-safe">
      {/* Home */}
      <Link
        href="/dashboard"
        className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl active:scale-95 transition-transform duration-150 ${
          isHome ? 'text-[#FF6835] font-semibold' : 'text-outline hover:text-[#FF6835]'
        }`}
      >
        <Home className={`size-5 ${isHome ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[11px] font-medium leading-none">Home</span>
      </Link>

      {/* Venues */}
      <Link
        href="/venues"
        className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl active:scale-95 transition-transform duration-150 ${
          isVenues ? 'text-[#FF6835] font-semibold' : 'text-outline hover:text-[#FF6835]'
        }`}
      >
        <Building2 className={`size-5 ${isVenues ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[11px] font-medium leading-none">Venues</span>
      </Link>

      {/* Bookings */}
      <Link
        href="/dashboard/book"
        className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl active:scale-95 transition-transform duration-150 ${
          isBookings ? 'text-[#FF6835] font-semibold' : 'text-outline hover:text-[#FF6835]'
        }`}
      >
        <CalendarCheck className={`size-5 ${isBookings ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[11px] font-medium leading-none">Book</span>
      </Link>

      {/* Calendar */}
      <Link
        href="/calendar"
        className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl active:scale-95 transition-transform duration-150 ${
          isCalendar ? 'text-[#FF6835] font-semibold' : 'text-outline hover:text-[#FF6835]'
        }`}
      >
        <CalendarDays className={`size-5 ${isCalendar ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[11px] font-medium leading-none">Calendar</span>
      </Link>

      {/* Requests */}
      <Link
        href="/dashboard/requests"
        className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl active:scale-95 transition-transform duration-150 ${
          isRequests ? 'text-[#FF6835] font-semibold' : 'text-outline hover:text-[#FF6835]'
        }`}
      >
        <FileText className={`size-5 ${isRequests ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[11px] font-medium leading-none">Requests</span>
      </Link>
    </nav>
  )
}
