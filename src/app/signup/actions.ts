'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(prevState: { error: string | null }, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const fullName = formData.get('fullName') as string
  const departmentId = formData.get('departmentId') as string

  if (!email || !password || !confirmPassword || !fullName || !departmentId) {
    return { error: 'All fields are required' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  const allowedDomains = ['@gmail.com', '@sjbit.edu.in']
  const emailDomain = email.substring(email.lastIndexOf('@')).toLowerCase()
  if (!allowedDomains.includes(emailDomain)) {
    return { error: 'Email domain must be @gmail.com or @sjbit.edu.in' }
  }

  const supabase = await createClient()

  // Validate that the selected department exists and is active
  const { data: dept, error: deptError } = await supabase
    .from('departments')
    .select('id, name')
    .eq('id', departmentId)
    .eq('active', true)
    .maybeSingle()

  if (deptError || !dept) {
    return { error: 'Selected department is invalid or inactive. Please choose an active department from the list.' }
  }

  // Sign up the user (triggers profile creation in DB with strictly 'FACULTY' role)
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        department_id: departmentId,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}
