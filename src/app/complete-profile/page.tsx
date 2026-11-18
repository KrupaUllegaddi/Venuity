import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CompleteProfileForm } from './form'

interface CompleteProfilePageProps {
  searchParams?: Promise<{ next?: string }>
}

export default async function CompleteProfilePage(props: CompleteProfilePageProps) {
  const resolvedSearchParams = (await props.searchParams) || {}
  const next = resolvedSearchParams.next || ''

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's profile to check role & if department_id is already assigned
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, department_id, email')
    .eq('id', user.id)
    .maybeSingle()

  // ADMIN accounts are campus-wide and do not require department assignment
  if (profile?.role === 'ADMIN') {
    redirect(next || '/dashboard')
  }

  // If user already has department assigned, forward to destination
  if (profile?.department_id) {
    redirect(next || '/dashboard')
  }

  // Query real active departments from Supabase
  let departments: { id: string; name: string }[] = []
  let dbError: string | null = null

  try {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .eq('active', true)
      .order('name')

    if (error) {
      console.error('[CompleteProfilePage] Supabase departments error:', error.message)
      dbError = error.message
    } else if (data) {
      departments = data
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database connection failed'
    console.error('[CompleteProfilePage] Failed to fetch departments:', msg)
    dbError = msg
  }

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Campus Member'
  const displayEmail = profile?.email || user.email || ''

  return (
    <CompleteProfileForm
      userName={displayName}
      userEmail={displayEmail}
      departments={departments}
      dbError={dbError}
      next={next}
    />
  )
}
