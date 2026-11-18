import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — this is the primary purpose of the proxy
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected routes — require authentication
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/bookings') ||
    pathname.startsWith('/calendar') ||
    pathname === '/complete-profile'

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (pathname !== '/dashboard') {
      url.searchParams.set('next', pathname + request.nextUrl.search)
    }
    return NextResponse.redirect(url)
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, department_id')
      .eq('id', user.id)
      .maybeSingle()

    const isAdmin = profile?.role === 'ADMIN'
    const hasDepartment = Boolean(profile?.department_id)

    // Role-based protection: Only ADMIN accounts may access /admin
    if (pathname.startsWith('/admin') && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }

    // First-time OAuth or unassigned non-admin users must complete onboarding
    if (!isAdmin && !hasDepartment) {
      // If visiting any protected route other than /complete-profile, force onboarding
      if (isProtectedRoute && pathname !== '/complete-profile') {
        const url = request.nextUrl.clone()
        url.pathname = '/complete-profile'
        return NextResponse.redirect(url)
      }
      // If visiting /login or /signup while incomplete, route to /complete-profile
      if (pathname === '/login' || pathname === '/signup') {
        const url = request.nextUrl.clone()
        url.pathname = '/complete-profile'
        return NextResponse.redirect(url)
      }
    } else {
      // User is fully set up (or is ADMIN):
      // Redirect away from onboarding, login, signup, and landing
      if (
        pathname === '/complete-profile' ||
        pathname === '/login' ||
        pathname === '/signup' ||
        pathname === '/'
      ) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
