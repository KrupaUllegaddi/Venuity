'use client'

import { useActionState, useState, Suspense } from 'react'
import { login } from './actions'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  GraduationCap,
  Landmark,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
} from 'lucide-react'

const initialState = {
  error: null as string | null,
}

function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'azure' | null>(null)
  const [oauthError, setOauthError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const urlError = searchParams?.get('error')
  const activeError = oauthError || (urlError ? decodeURIComponent(urlError) : null)

  const handleOAuthSignIn = async (provider: 'google' | 'azure') => {
    setOauthLoading(provider)
    setOauthError(null)

    try {
      const supabase = createClient()
      const nextParam = searchParams?.get('next')
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      if (nextParam) {
        callbackUrl.searchParams.set('next', nextParam)
      }
      const redirectTo = callbackUrl.toString()

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          scopes:
            provider === 'azure'
              ? 'email openid profile User.Read'
              : 'openid profile email',
          queryParams:
            provider === 'google'
              ? { access_type: 'offline', prompt: 'consent' }
              : undefined,
        },
      })

      if (error) {
        console.error(`[OAuth] ${provider} error:`, error)
        setOauthError(
          `Unable to sign in with ${
            provider === 'google' ? 'Google' : 'Microsoft'
          }: ${error.message}. Please verify the ${
            provider === 'google' ? 'Google' : 'Azure (Microsoft)'
          } provider is enabled in your Supabase project settings.`
        )
        setOauthLoading(null)
      } else if (data?.url) {
        window.location.assign(data.url)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initialize OAuth sign-in'
      setOauthError(message)
      setOauthLoading(null)
    }
  }

  return (
    <div className="bg-[#FFF7ED] text-on-surface antialiased min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans">
      <main className="w-full max-w-md md:max-w-4xl bg-surface flex flex-col md:flex-row overflow-hidden shadow-2xl rounded-2xl md:rounded-3xl border border-outline-variant/40 my-auto">
        {/* Hero Section: Architectural Campus Imagery & Venuity Branding */}
        <div className="relative h-36 sm:h-44 md:h-auto md:w-5/12 overflow-hidden flex flex-col justify-between p-5 sm:p-6 md:p-8 shrink-0">
          <img
            alt="Campus Architecture"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGB8qRMB7RlYhwitL4roVecxyU1W4JpyDkmvKfCIvvlKQrj1_kIS9xpmd0wbh_uVM_nAUKyuiTIhOlkqiBkM0PDvdpWEoTgCBwWfTebmN68hIWxATC3IYiGjUkzr24OzWPzwJhaixOvKYC4HjD0eldqkxpBoa1ux4MOkBhrCZtMn-fw3409uUxToc8j30P8bakovgYm9CeaqLIiLR7V0e5Pu8_mzg9d3aO1yctpzHnR2vN8C4A9GA8xg"
            className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-b from-stone-900/90 via-stone-900/60 to-stone-900/40"></div>
          <div className="absolute inset-0 bg-[#FF6835]/20 mix-blend-multiply"></div>

          <div className="relative z-10 self-start">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white/95 text-[11px] font-semibold tracking-wider uppercase">
              <GraduationCap className="size-3.5 text-[#FFDBD0]" />
              <span>Campus Portal</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left justify-center pb-1 pt-2 md:pt-8 my-auto">
            <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-13 md:h-13 rounded-2xl bg-[#FF6835] text-white flex items-center justify-center shadow-lg shadow-[#FF6835]/40 mb-2 md:mb-3">
              <Landmark className="size-5 sm:size-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-sm">
              Venuity
            </h1>
            <p className="text-[11px] sm:text-xs text-[#FFDBD0] tracking-[0.2em] uppercase font-semibold mt-0.5 sm:mt-1 mb-1 md:mb-2">
              PLAN • BOOK • COLLABORATE
            </p>
            <p className="hidden md:block text-xs md:text-sm text-white/80 leading-relaxed max-w-xs">
              Smart Venue Management for a Connected Campus. Sign in to view and reserve university spaces.
            </p>
          </div>
        </div>

        {/* Form Canvas Section */}
        <div className="relative z-20 flex-1 bg-surface-container-lowest p-5 sm:p-7 md:p-10 flex flex-col justify-between">
          <div>
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-on-surface tracking-tight mb-0.5">
                Welcome back!
              </h2>
              <p className="text-xs sm:text-sm text-outline">
                Sign in to continue to your account
              </p>
            </div>

            {/* OAuth or URL Error Banner */}
            {activeError && (
              <div className="mb-4 rounded-xl bg-amber-50 border border-amber-300 p-3 text-xs sm:text-sm text-amber-900 flex items-start gap-2">
                <span className="font-semibold text-amber-700">Notice:</span>
                <span>{activeError}</span>
              </div>
            )}

            <form action={formAction} className="space-y-3 sm:space-y-3.5 md:space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Campus Email or ID
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 size-4.5 text-outline pointer-events-none" />
                  <input
                    id="email"
                    name="email"
                    type="text"
                    required
                    placeholder="name@venuity.local or Placement@sjbit.edu.in"
                    className="w-full h-11 pl-10 pr-4 bg-surface-container-low border border-outline-variant/70 rounded-xl text-sm text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-[#FF6835]/40 focus:border-[#FF6835] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 size-4.5 text-outline pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    className="w-full h-11 pl-10 pr-10 bg-surface-container-low border border-outline-variant/70 rounded-xl text-sm text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-[#FF6835]/40 focus:border-[#FF6835] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 text-outline hover:text-on-surface p-1 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                  </button>
                </div>
              </div>

              {state?.error && (
                <div className="rounded-xl bg-error-container p-3 text-sm text-on-error-container border border-error/25 font-medium">
                  {state.error}
                </div>
              )}

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-[#FF6835] focus:ring-[#FF6835]/30 border-outline-variant cursor-pointer accent-[#FF6835]"
                  />
                  <span className="text-xs sm:text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-xs sm:text-sm font-semibold text-[#FF6835] hover:text-[#C94B24] transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={isPending || oauthLoading !== null}
                className="w-full h-11 sm:h-12 bg-[#FF6835] hover:bg-[#C94B24] active:scale-[0.99] disabled:opacity-70 text-white font-semibold text-sm rounded-xl shadow-md shadow-[#FF6835]/25 flex items-center justify-center gap-2 transition-all duration-150 mt-1 cursor-pointer"
              >
                <span>{isPending ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="size-4.5" />
              </button>
            </form>

            <div className="relative my-4 sm:my-5 flex items-center justify-center">
              <div className="w-full border-t border-outline-variant/50"></div>
              <span className="absolute bg-surface-container-lowest px-3 text-xs text-outline font-medium">
                Or continue with
              </span>
            </div>

            {/* Real OAuth Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {/* Google OAuth Button */}
              <button
                type="button"
                onClick={() => handleOAuthSignIn('google')}
                disabled={isPending || oauthLoading !== null}
                className="h-11 px-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 rounded-xl flex items-center justify-center gap-2.5 active:scale-95 transition-all text-on-surface cursor-pointer disabled:opacity-60"
              >
                {oauthLoading === 'google' ? (
                  <Loader2 className="size-4 animate-spin text-[#FF6835]" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span className="text-xs sm:text-sm font-semibold text-on-surface">
                  {oauthLoading === 'google' ? 'Connecting...' : 'Google'}
                </span>
              </button>

              {/* Microsoft Azure OAuth Button */}
              <button
                type="button"
                onClick={() => handleOAuthSignIn('azure')}
                disabled={isPending || oauthLoading !== null}
                className="h-11 px-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 rounded-xl flex items-center justify-center gap-2.5 active:scale-95 transition-all text-on-surface cursor-pointer disabled:opacity-60"
              >
                {oauthLoading === 'azure' ? (
                  <Loader2 className="size-4 animate-spin text-[#FF6835]" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
                    <rect fill="#f25022" height="9" width="9" x="1" y="1" />
                    <rect fill="#7fba00" height="9" width="9" x="11" y="1" />
                    <rect fill="#00a4ef" height="9" width="9" x="11" y="11" />
                    <rect fill="#ffb900" height="9" width="9" x="11" y="11" />
                  </svg>
                )}
                <span className="text-xs sm:text-sm font-semibold text-on-surface">
                  {oauthLoading === 'azure' ? 'Connecting...' : 'Microsoft'}
                </span>
              </button>
            </div>
          </div>

          <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-outline-variant/30 text-center">
            <p className="text-xs sm:text-sm text-outline">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-[#FF6835] hover:text-[#C94B24] transition-colors ml-1"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
