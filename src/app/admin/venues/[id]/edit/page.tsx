import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateVenue } from '../../actions'

interface EditVenuePageProps {
  params: Promise<{ id: string }>
}

export default async function EditVenuePage({ params }: EditVenuePageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') redirect('/unauthorized')

  const { data: venue } = await supabase
    .from('venues')
    .select('*, venue_facilities(facility_id)')
    .eq('id', id)
    .single()

  if (!venue) redirect('/admin/venues')

  const { data: facilities } = await supabase.from('facilities').select('*').order('name')
  
  const selectedFacilities = venue.venue_facilities?.map((vf: { facility_id: string }) => vf.facility_id) || []

  // Wrap the server action to pass the ID
  const updateVenueWithId = updateVenue.bind(null, venue.id)

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/admin/venues" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 size-4" />
          Back to Venues
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Edit Venue: {venue.name}
        </h1>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <form action={updateVenueWithId} className="space-y-6">
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Venue Name</Label>
              <Input id="name" name="name" defaultValue={venue.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Venue Type</Label>
              <select 
                id="type"
                name="type" 
                defaultValue={venue.type}
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="AUDITORIUM">Auditorium</option>
                <option value="SEMINAR_HALL">Seminar Hall</option>
                <option value="GALLERY">Gallery</option>
                <option value="CONFERENCE_ROOM">Conference Room</option>
                <option value="CLASSROOM">Classroom</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="building">Building</Label>
              <Input id="building" name="building" defaultValue={venue.building} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input id="floor" name="floor" defaultValue={venue.floor} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" name="capacity" type="number" min="1" defaultValue={venue.capacity} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              name="image_url"
              defaultValue={venue.image_url || ''}
              placeholder="/images/venues/auditorium/front-view.jpeg or https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea 
              id="description" 
              name="description" 
              defaultValue={venue.description || ''}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>

          <div className="space-y-3">
            <Label>Facilities</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {facilities?.map((facility) => (
                <label key={facility.id} className="flex items-center space-x-2 bg-muted/30 p-2 rounded border border-transparent hover:border-border cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    name="facilities" 
                    value={facility.id} 
                    defaultChecked={selectedFacilities.includes(facility.id)}
                    className="rounded border-input text-primary focus:ring-primary" 
                  />
                  <span className="text-sm font-medium">{facility.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Link href="/admin/venues" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
