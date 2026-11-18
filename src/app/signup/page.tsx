import { createClient } from '@/lib/supabase/server'
import { SignupForm } from './form'

export const dynamic = 'force-dynamic'

export default async function SignupPage() {
  let departments: { id: string; name: string }[] = []
  let dbError: string | null = null

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .eq('active', true)
      .order('name')

    if (error) {
      console.error('[SignupPage] Supabase departments query error:', error.message)
      dbError = error.message
    } else if (data) {
      departments = data
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database connection failed'
    console.error('[SignupPage] Failed to connect to Supabase:', message)
    dbError = message
  }

  return <SignupForm departments={departments} dbError={dbError} />
}
