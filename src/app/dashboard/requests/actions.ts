'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const rejectSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().min(3, 'Rejection reason must be at least 3 characters'),
})

export async function approveRequestAction(requestId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized: Please log in' }
    }

    // Call secure RPC: Reviewer identity is derived server-side via auth.uid()
    const { data, error } = await supabase.rpc('approve_booking_request', {
      p_request_id: requestId,
    })

    if (error) {
      console.error('approve_booking_request error:', error)
      return { error: error.message || 'Failed to approve booking request' }
    }

    const result = data as { success: boolean; error?: string; booking_id?: string }
    if (!result.success) {
      return { error: result.error || 'Failed to approve booking request' }
    }

    revalidatePath('/dashboard/requests')
    revalidatePath('/admin/requests')
    revalidatePath('/calendar')
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/availability')

    return { success: true }
  } catch (err: unknown) {
    console.error('Approve action exception:', err)
    return { error: err instanceof Error ? err.message : 'An unexpected error occurred' }
  }
}

export async function rejectRequestAction(prevState: unknown, formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Unauthorized: Please log in' }
    }

    const rawData = {
      requestId: formData.get('requestId'),
      reason: formData.get('reason'),
    }

    const parsed = rejectSchema.safeParse(rawData)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid input' }
    }

    // Call secure RPC: Reviewer identity is derived server-side via auth.uid()
    const { data, error } = await supabase.rpc('reject_booking_request', {
      p_request_id: parsed.data.requestId,
      p_reason: parsed.data.reason,
    })

    if (error) {
      console.error('reject_booking_request error:', error)
      return { error: error.message || 'Failed to reject booking request' }
    }

    const result = data as { success: boolean; error?: string }
    if (!result.success) {
      return { error: result.error || 'Failed to reject booking request' }
    }

    revalidatePath('/dashboard/requests')
    revalidatePath('/admin/requests')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (err: unknown) {
    console.error('Reject action exception:', err)
    return { error: err instanceof Error ? err.message : 'An unexpected error occurred' }
  }
}
