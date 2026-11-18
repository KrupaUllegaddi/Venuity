'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateRoleSchema = z.object({
  targetUserId: z.string().uuid('Invalid user ID'),
  newRole: z.enum(['FACULTY', 'HOD', 'ADMIN'], {
    message: 'Role must be FACULTY, HOD, or ADMIN',
  }),
  departmentId: z.string().uuid().nullable().optional(),
})

const toggleStatusSchema = z.object({
  targetUserId: z.string().uuid('Invalid user ID'),
  active: z.boolean(),
})

export interface UserActionResult {
  success?: boolean
  error?: string
  dbPolicyRestricted?: boolean
}

/**
 * Server action to update a user's role and department.
 * Enforces server-side ADMIN authentication and prevents self-demotion.
 */
export async function updateUserRoleAction(
  targetUserId: string,
  newRole: 'FACULTY' | 'HOD' | 'ADMIN',
  departmentId?: string | null
): Promise<UserActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized: Please log in to perform this action.' }
    }

    // Verify calling user is an ADMIN
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'ADMIN') {
      return { error: 'Forbidden: Only administrators can update user roles.' }
    }

    // Prevent administrators from demoting their own account to avoid lockout
    if (targetUserId === user.id && newRole !== 'ADMIN') {
      return { error: 'Self-lockout protection: You cannot remove ADMIN privileges from your own account.' }
    }

    const validation = updateRoleSchema.safeParse({
      targetUserId,
      newRole,
      departmentId: departmentId || null,
    })

    if (!validation.success) {
      return { error: validation.error.issues[0]?.message || 'Invalid user data provided.' }
    }

    // Attempt profile update in Supabase
    const updatePayload: { role: 'FACULTY' | 'HOD' | 'ADMIN'; department_id?: string | null } = {
      role: validation.data.newRole,
      department_id: validation.data.departmentId ?? null,
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', targetUserId)

    if (updateError) {
      console.error('Update user role error:', updateError)
      // Check if this failed due to Row Level Security (RLS) policy
      if (
        updateError.message.includes('row-level security') ||
        updateError.code === '42501' ||
        updateError.message.includes('policy')
      ) {
        return {
          dbPolicyRestricted: true,
          error:
            'Database Policy Notice: The existing Supabase RLS policy only permits self-updates on profiles (auth.uid() = id). To allow administrators to update roles for other users, a database policy allowing ADMIN updates is required.',
        }
      }
      return { error: updateError.message || 'Failed to update user role.' }
    }

    // Record in audit log if audit_logs table is available
    try {
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'UPDATE_USER_ROLE',
        entity_type: 'USER',
        entity_id: targetUserId,
        metadata: {
          new_role: validation.data.newRole,
          department_id: validation.data.departmentId,
        },
      })
    } catch {
      // Non-blocking if audit logging encounters an issue
    }

    revalidatePath('/admin/users')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    console.error('updateUserRoleAction exception:', err)
    return { error: err instanceof Error ? err.message : 'An unexpected error occurred.' }
  }
}

/**
 * Server action to activate or deactivate a user account.
 * Enforces server-side ADMIN authentication and prevents self-deactivation.
 */
export async function toggleUserStatusAction(
  targetUserId: string,
  active: boolean
): Promise<UserActionResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Unauthorized: Please log in to perform this action.' }
    }

    // Verify calling user is an ADMIN
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'ADMIN') {
      return { error: 'Forbidden: Only administrators can modify user account status.' }
    }

    // Prevent administrators from deactivating themselves
    if (targetUserId === user.id && !active) {
      return { error: 'Self-lockout protection: You cannot deactivate your own administrative account.' }
    }

    const validation = toggleStatusSchema.safeParse({
      targetUserId,
      active,
    })

    if (!validation.success) {
      return { error: validation.error.issues[0]?.message || 'Invalid status data provided.' }
    }

    // Attempt status update in Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ active: validation.data.active })
      .eq('id', targetUserId)

    if (updateError) {
      console.error('Toggle user status error:', updateError)
      if (
        updateError.message.includes('row-level security') ||
        updateError.code === '42501' ||
        updateError.message.includes('policy')
      ) {
        return {
          dbPolicyRestricted: true,
          error:
            'Database Policy Notice: The existing Supabase RLS policy only permits self-updates on profiles (auth.uid() = id). To allow administrators to activate or deactivate other users, a database policy allowing ADMIN updates is required.',
        }
      }
      return { error: updateError.message || 'Failed to update user status.' }
    }

    // Record in audit log
    try {
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        entity_type: 'USER',
        entity_id: targetUserId,
        metadata: { active },
      })
    } catch {
      // Non-blocking
    }

    revalidatePath('/admin/users')
    revalidatePath('/admin')
    return { success: true }
  } catch (err: unknown) {
    console.error('toggleUserStatusAction exception:', err)
    return { error: err instanceof Error ? err.message : 'An unexpected error occurred.' }
  }
}

