import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Validates a user-supplied redirect destination to prevent open redirects and redirect loops.
 * Only internal, relative paths starting with a single '/' are permitted.
 */
function getSafeRedirectUrl(next: string | null, fallback = '/dashboard'): string {
  if (!next) return fallback
  const trimmed = next.trim()

  // Disallow protocol-relative URLs (e.g., "//evil.com") and backslash evasions (e.g., "/\evil.com")
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback
  }

  try {
    const parsed = new URL(trimmed, 'http://localhost')
    // Prevent redirect loops to authentication or callback handlers
    if (
      parsed.pathname === '/auth/callback' ||
      parsed.pathname === '/login' ||
      parsed.pathname === '/signup'
    ) {
      return fallback
    }

    return parsed.pathname + parsed.search + parsed.hash
  } catch {
    return fallback
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next')
  const safeNext = getSafeRedirectUrl(rawNext, '/dashboard')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth provider error states and user cancellations
  if (errorParam || errorDescription) {
    let errorMsg = errorDescription || errorParam || 'Authentication failed'
    if (errorParam === 'access_denied') {
      errorMsg = 'Sign in was cancelled. Please try again or use your campus credentials.'
    }
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Query user profile to verify department assignment and authoritative role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, department_id')
        .eq('id', data.user.id)
        .maybeSingle()

      const isAdmin = profile?.role === 'ADMIN'

      // First-time OAuth users or users without an assigned department must complete profile onboarding
      // (ADMIN accounts are campus-wide and do not require department assignment)
      if (!isAdmin && (!profile || !profile.department_id)) {
        const nextQuery = safeNext !== '/dashboard' ? `?next=${encodeURIComponent(safeNext)}` : ''
        return NextResponse.redirect(`${origin}/complete-profile${nextQuery}`)
      }

      return NextResponse.redirect(`${origin}${safeNext}`)
    }

    if (error) {
      console.error('[OAuth callback] Code exchange error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Missing+authentication+code`)
}
