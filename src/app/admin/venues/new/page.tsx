import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createVenue } from '../actions'

export default async function NewVenuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') redirect('/unauthorized')

  const { data: facilities } = await supabase.from('facilities').select('*').order('name')

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/admin/venues" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 size-4" />
          Back to Venues
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Add New Venue
        </h1>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <form action={createVenue} className="space-y-6">
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Venue Name</Label>
              <Input id="name" name="name" required placeholder="e.g. Main Auditorium" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Venue Type</Label>
              <select 
                id="type"
                name="type" 
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
              <Input id="building" name="building" required placeholder="e.g. Block A" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input id="floor" name="floor" required placeholder="e.g. Ground" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" name="capacity" type="number" min="1" required placeholder="e.g. 150" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              name="image_url"
              placeholder="/images/venues/auditorium/front-view.jpeg or https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea 
              id="description" 
              name="description" 
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Additional details about the venue..."
            />
          </div>

          <div className="space-y-3">
            <Label>Facilities</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {facilities?.map((facility) => (
                <label key={facility.id} className="flex items-center space-x-2 bg-muted/30 p-2 rounded border border-transparent hover:border-border cursor-pointer transition-colors">
                  <input type="checkbox" name="facilities" value={facility.id} className="rounded border-input text-primary focus:ring-primary" />
                  <span className="text-sm font-medium">{facility.name}</span>
                </label>
              ))}
              {facilities?.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-3">No facilities available. You can add them later.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Link href="/admin/venues" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
            <Button type="submit">Create Venue</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
