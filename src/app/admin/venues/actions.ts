'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const venueSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['AUDITORIUM', 'SEMINAR_HALL', 'GALLERY', 'CONFERENCE_ROOM', 'CLASSROOM', 'OTHER']),
  building: z.string().min(1, 'Building is required'),
  floor: z.string().min(1, 'Floor is required'),
  capacity: z.coerce.number().int().positive('Capacity must be positive'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  facilities: z.array(z.string()).optional(), // Array of facility IDs
})

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  return profile?.role === 'ADMIN'
}

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4)
}

export async function createVenue(formData: FormData) {
  if (!(await checkAdmin())) throw new Error('Unauthorized')
  
  const supabase = await createClient()
  
  const facilities = formData.getAll('facilities') as string[]
  
  const data = {
    name: formData.get('name') as string,
    type: formData.get('type') as string,
    building: formData.get('building') as string,
    floor: formData.get('floor') as string,
    capacity: formData.get('capacity'),
    description: formData.get('description') as string,
    imageUrl: (formData.get('image_url') || formData.get('imageUrl') || '') as string,
  }
  
  const parsed = venueSchema.parse({ ...data, facilities })
  
  // Extract custom or raw specifications JSON if provided
  let specsObj = {}
  const rawSpecs = formData.get('specifications') as string | null
  if (rawSpecs) {
    try {
      specsObj = JSON.parse(rawSpecs)
    } catch {
      // Ignore parse failure, keep empty object
    }
  }

  const slug = generateSlug(parsed.name)
  
  const { data: venue, error } = await supabase
    .from('venues')
    .insert({
      name: parsed.name,
      slug,
      type: parsed.type,
      building: parsed.building,
      floor: parsed.floor,
      capacity: parsed.capacity,
      description: parsed.description,
      image_url: parsed.imageUrl || null,
      specifications: specsObj,
      active: true,
    })
    .select()
    .single()
    
  if (error) {
    console.error('Create venue error:', error)
    throw new Error('Failed to create venue')
  }
  
  if (parsed.facilities && parsed.facilities.length > 0) {
    const venueFacilities = parsed.facilities.map(fid => ({
      venue_id: venue.id,
      facility_id: fid
    }))
    
    await supabase.from('venue_facilities').insert(venueFacilities)
  }
  
  revalidatePath('/admin/venues')
  revalidatePath('/venues')
  revalidatePath('/dashboard/availability')
  revalidatePath('/dashboard/book')
  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  redirect('/admin/venues')
}

export async function updateVenue(id: string, formData: FormData) {
  if (!(await checkAdmin())) throw new Error('Unauthorized')
    
  const supabase = await createClient()
  
  const facilities = formData.getAll('facilities') as string[]
  
  const data = {
    name: formData.get('name') as string,
    type: formData.get('type') as string,
    building: formData.get('building') as string,
    floor: formData.get('floor') as string,
    capacity: formData.get('capacity'),
    description: formData.get('description') as string,
    imageUrl: (formData.get('image_url') || formData.get('imageUrl') || '') as string,
  }
  
  const parsed = venueSchema.parse({ ...data, facilities })

  // Extract custom or raw specifications JSON if provided
  let specsObj = undefined
  const rawSpecs = formData.get('specifications') as string | null
  if (rawSpecs) {
    try {
      specsObj = JSON.parse(rawSpecs)
    } catch {
      // Ignore parse failure
    }
  }

  const updatePayload: Record<string, unknown> = {
    name: parsed.name,
    type: parsed.type,
    building: parsed.building,
    floor: parsed.floor,
    capacity: parsed.capacity,
    description: parsed.description,
  }

  if (parsed.imageUrl !== undefined && parsed.imageUrl !== '') {
    updatePayload.image_url = parsed.imageUrl
  }
  if (specsObj !== undefined) {
    updatePayload.specifications = specsObj
  }
  
  const { error } = await supabase
    .from('venues')
    .update(updatePayload)
    .eq('id', id)
    
  if (error) {
    console.error('Update venue error:', error)
    throw new Error('Failed to update venue')
  }
  
  // Update facilities
  await supabase.from('venue_facilities').delete().eq('venue_id', id)
  if (parsed.facilities && parsed.facilities.length > 0) {
    const venueFacilities = parsed.facilities.map(fid => ({
      venue_id: id,
      facility_id: fid
    }))
    await supabase.from('venue_facilities').insert(venueFacilities)
  }
  
  revalidatePath('/admin/venues')
  revalidatePath(`/admin/venues/${id}/edit`)
  revalidatePath('/venues')
  revalidatePath(`/venues/${id}`)
  revalidatePath('/dashboard/availability')
  revalidatePath('/dashboard/book')
  revalidatePath('/dashboard')
  revalidatePath('/calendar')
  redirect('/admin/venues')
}

export async function toggleVenueStatus(id: string, active: boolean) {
  if (!(await checkAdmin())) throw new Error('Unauthorized')
    
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('venues')
    .update({ active })
    .eq('id', id)
    
  if (error) {
    console.error('Toggle status error:', error)
    throw new Error('Failed to update venue status')
  }
  
  revalidatePath('/admin/venues')
  revalidatePath('/venues')
  revalidatePath(`/venues/${id}`)
  revalidatePath('/dashboard/availability')
  revalidatePath('/dashboard/book')
  revalidatePath('/dashboard')
  revalidatePath('/calendar')
}
