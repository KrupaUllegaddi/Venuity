'use client'

import { useActionState, useState } from 'react'
import { completeProfile } from './actions'
import { createClient } from '@/lib/supabase/client'
import {
  Building2,
  ChevronDown,
  Landmark,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

const initialState = {
  error: null as string | null,
}

interface CompleteProfileFormProps {
  userName: string
  userEmail: string
  departments: { id: string; name: string }[]
  dbError?: string | null
  next?: string
}

export function CompleteProfileForm({
  userName,
  userEmail,
  departments: initialDepartments,
  dbError: initialDbError,
  next = '',
}: CompleteProfileFormProps) {
  const [state, formAction, isPending] = useActionState(completeProfile, initialState)
  const [deptList, setDeptList] = useState(initialDepartments || [])
  const [currentDbError, setCurrentDbError] = useState(initialDbError || null)
  const [isRetrying, setIsRetrying] = useState(false)

  const hasDepartments = deptList && deptList.length > 0

  const handleRetryDepartments = async () => {
    setIsRetrying(true)
    setCurrentDbError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('active', true)
        .order('name')

      if (error) {
        setCurrentDbError(error.message)
      } else if (data && data.length > 0) {
        setDeptList(data)
        setCurrentDbError(null)
      } else {
        setDeptList([])
        setCurrentDbError('No active campus departments found.')
      }
    } catch (err: unknown) {
      setCurrentDbError(
        err instanceof Error ? err.message : 'Database connection failed'
      )
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="bg-[#FFF7ED] text-on-surface antialiased min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans">
      <main className="w-full max-w-lg bg-surface-container-lowest flex flex-col overflow-hidden shadow-2xl rounded-2xl md:rounded-3xl border border-outline-variant/40 p-5 sm:p-8 md:p-10 my-auto">
        {/* Header Branding */}
        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#FF6835] text-white flex items-center justify-center shadow-lg shadow-[#FF6835]/30 shrink-0">
            <Landmark className="size-5 sm:size-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight leading-snug">
              Complete Your Profile
            </h1>
            <p className="text-xs sm:text-sm text-outline">
              Venuity Campus Venue Management
            </p>
          </div>
        </div>

        {/* User context card */}
        <div className="rounded-xl bg-[#FFF0E8] border border-[#FF6835]/20 p-3.5 sm:p-4 mb-5 sm:mb-6">
          <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-[#855300] mb-1">
            Signed in as
          </p>
          <p className="text-sm sm:text-base font-bold text-on-surface truncate">{userName}</p>
          <p className="text-xs text-outline truncate">{userEmail}</p>
          <div className="mt-2.5 pt-2.5 border-t border-[#FF6835]/15 flex items-center gap-1.5 text-xs text-[#5A413A]">
            <ShieldCheck className="size-4 text-[#FF6835] shrink-0" />
            <span>Assigned role: <strong>Faculty</strong></span>
          </div>
        </div>

        {/* Explanation */}
        <div className="mb-5 sm:mb-6">
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            To reserve university spaces, coordinate events, and check live availability, please select your academic or administrative department below.
          </p>
        </div>

        {/* Error Banners */}
        {currentDbError && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-300 p-3 text-xs sm:text-sm text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="size-4 text-amber-700 shrink-0 mt-0.5" />
              <span>{currentDbError}</span>
            </div>
            <button
              type="button"
              onClick={handleRetryDepartments}
              disabled={isRetrying}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`size-3 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Loading...' : 'Retry'}</span>
            </button>
          </div>
        )}

        {!currentDbError && !hasDepartments && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs sm:text-sm text-amber-800 flex items-center justify-between gap-2">
            <span>No active departments found.</span>
            <button
              type="button"
              onClick={handleRetryDepartments}
              disabled={isRetrying}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`size-3 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Loading...' : 'Retry'}</span>
            </button>
          </div>
        )}

        {state?.error && (
          <div className="mb-4 rounded-xl bg-error-container p-3 text-xs sm:text-sm text-on-error-container border border-error/25 font-medium">
            {state.error}
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-4 sm:space-y-5">
          {next && <input type="hidden" name="next" value={next} />}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="departmentId"
                className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
              >
                Select Your Department <span className="text-[#FF6835]">*</span>
              </label>
              {!hasDepartments && (
                <button
                  type="button"
                  onClick={handleRetryDepartments}
                  disabled={isRetrying}
                  className="text-[11px] font-semibold text-[#FF6835] hover:text-[#C94B24] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`size-3 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>{isRetrying ? 'Loading...' : 'Refresh list'}</span>
                </button>
              )}
            </div>
            <div className="relative flex items-center">
              <Building2 className="absolute left-3.5 size-4.5 text-outline pointer-events-none" />
              <select
                id="departmentId"
                name="departmentId"
                required
                defaultValue=""
                disabled={!hasDepartments || isRetrying}
                className="w-full h-11 sm:h-12 pl-10 pr-10 bg-surface-container-low border border-outline-variant/70 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-[#FF6835]/40 focus:border-[#FF6835] transition-all appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {hasDepartments ? (
                  <>
                    <option value="" disabled>
                      Select department from database
                    </option>
                    {deptList.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </>
                ) : isRetrying ? (
                  <option value="" disabled>
                    Connecting to database...
                  </option>
                ) : currentDbError ? (
                  <option value="" disabled>
                    ⚠️ Database unavailable: unable to load departments
                  </option>
                ) : (
                  <option value="" disabled>
                    No active departments available
                  </option>
                )}
              </select>
              <ChevronDown className="absolute right-3.5 size-4.5 text-outline pointer-events-none" />
            </div>
            <p className="text-[11px] text-outline">
              This affiliation determines your booking priorities and approval routing.
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending || !hasDepartments}
            className="w-full h-11 sm:h-12 bg-[#FF6835] hover:bg-[#C94B24] active:scale-[0.99] disabled:opacity-70 text-white font-semibold text-sm rounded-xl shadow-md shadow-[#FF6835]/25 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
          >
            <span>{isPending ? 'Saving Affiliation...' : 'Continue to Dashboard'}</span>
            <ArrowRight className="size-4.5" />
          </button>
        </form>
      </main>
    </div>
  )
}
