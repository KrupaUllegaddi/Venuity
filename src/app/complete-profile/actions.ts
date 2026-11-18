'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function getSafeRedirectUrl(next: string | null, fallback = '/dashboard'): string {
  if (!next) return fallback
  const trimmed = next.trim()

  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback
  }

  try {
    const parsed = new URL(trimmed, 'http://localhost')
    if (
      parsed.pathname === '/auth/callback' ||
      parsed.pathname === '/login' ||
      parsed.pathname === '/signup' ||
      parsed.pathname === '/complete-profile'
    ) {
      return fallback
    }
    return parsed.pathname + parsed.search + parsed.hash
  } catch {
    return fallback
  }
}

export async function completeProfile(
  prevState: { error: string | null },
  formData: FormData
) {
  const departmentId = (formData.get('departmentId') as string)?.trim()
  const rawNext = formData.get('next') as string | null

  if (!departmentId) {
    return { error: 'Please select your department to continue' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Your session has expired. Please log in again.' }
  }

  // Verify the department exists and is active
  const { data: dept, error: deptError } = await supabase
    .from('departments')
    .select('id, name')
    .eq('id', departmentId)
    .eq('active', true)
    .maybeSingle()

  if (deptError || !dept) {
    return { error: 'Selected department is invalid or inactive. Please choose an active department.' }
  }

  // Update profile: ONLY department_id is updated.
  // Role remains strictly 'FACULTY' as assigned by handle_new_user() trigger.
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ department_id: departmentId })
    .eq('id', user.id)

  if (updateError) {
    console.error('[completeProfile] Error updating profile department:', updateError.message)
    return { error: updateError.message }
  }

  const destination = getSafeRedirectUrl(rawNext, '/dashboard')
  redirect(destination)
}
