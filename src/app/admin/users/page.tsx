import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, ArrowLeft } from 'lucide-react'
import { UsersAdminClient, type AdminUser, type DepartmentOption } from './users-admin-client'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Authoritative server-side ADMIN role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  // Fetch all user profiles with their associated department
  const { data: usersData, error: usersError } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      active,
      department_id,
      created_at,
      updated_at,
      departments (
        id,
        name,
        code
      )
    `)
    .order('created_at', { ascending: false })

  if (usersError) {
    console.error('Failed to fetch user profiles for admin:', usersError)
  }

  // Fetch active departments for filters and assignments
  const { data: departmentsData, error: deptError } = await supabase
    .from('departments')
    .select('id, name, code')
    .eq('active', true)
    .order('name')

  if (deptError) {
    console.error('Failed to fetch departments for user management:', deptError)
  }

  const departments: DepartmentOption[] = (departmentsData || []).map((d: { id: string; name: string; code: string }) => ({
    id: d.id,
    name: d.name,
    code: d.code,
  }))

  const users: AdminUser[] = (usersData || []).map((u: {
    id: string
    full_name: string
    email: string
    role: string
    active: boolean
    department_id: string | null
    created_at: string
    updated_at: string
    departments?: { id?: string; name?: string; code?: string } | { id?: string; name?: string; code?: string }[] | null
  }) => {
    const dObj = Array.isArray(u.departments) ? u.departments[0] : u.departments

    return {
      id: u.id,
      fullName: u.full_name || 'Unnamed User',
      email: u.email || '',
      role: u.role || 'FACULTY',
      active: u.active ?? true,
      departmentId: u.department_id || null,
      departmentName: dObj?.name || null,
      departmentCode: dObj?.code || null,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }
  })

  return (
    <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-outline hover:text-on-surface mb-2 font-medium"
          >
            <ArrowLeft className="size-4" />
            Back to Admin Panel
          </Link>
          <div className="flex items-center gap-2">
            <Users className="size-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
              User Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-outline">
            Inspect registered campus users, review department assignments, and audit platform roles.
          </p>
        </div>
      </div>

      {/* Interactive Users Administration Client Component */}
      <UsersAdminClient
        initialUsers={users}
        departments={departments}
        currentAdminId={user.id}
      />
    </div>
  )
}

