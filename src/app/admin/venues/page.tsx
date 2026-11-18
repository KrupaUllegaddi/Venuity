import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Building, Search, Edit2, Power, PowerOff } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toggleVenueStatus } from './actions'
import { getVenueImageUrl } from '@/lib/venue-utils'

interface AdminVenuesPageProps {
  searchParams?: Promise<{ q?: string; type?: string; status?: string }>
}

export default async function VenuesPage(props: AdminVenuesPageProps) {
  const resolvedSearchParams = (await props.searchParams) || {}
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') redirect('/unauthorized')

  const query = resolvedSearchParams.q || ''
  const type = resolvedSearchParams.type || ''
  const status = resolvedSearchParams.status || ''

  let sbQuery = supabase.from('venues').select('*, venue_facilities(facilities(name))')

  if (query) {
    sbQuery = sbQuery.ilike('name', `%${query}%`)
  }
  if (type) {
    sbQuery = sbQuery.eq('type', type)
  }
  if (status) {
    sbQuery = sbQuery.eq('active', status === 'active')
  }

  const { data: venues } = await sbQuery.order('name')

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building className="size-6" />
            Venue Management
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A list of all venues on campus including their details, capacity, and current status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/admin/venues/new" className={buttonVariants()}>
            <Plus className="size-4 mr-2" />
            Add Venue
          </Link>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm mb-6 sm:mb-8 p-3.5 sm:p-4">
        <form className="flex flex-col md:flex-row gap-2.5 sm:gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              name="q" 
              defaultValue={query} 
              placeholder="Search venues..." 
              className="pl-9 h-10"
            />
          </div>
          <div className="grid grid-cols-2 md:flex gap-2.5 sm:gap-3">
            <select 
              name="type" 
              defaultValue={type}
              className="flex h-10 w-full md:w-auto items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All Types</option>
              <option value="AUDITORIUM">Auditorium</option>
              <option value="SEMINAR_HALL">Seminar Hall</option>
              <option value="GALLERY">Gallery</option>
            </select>
            <select 
              name="status" 
              defaultValue={status}
              className="flex h-10 w-full md:w-auto items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="secondary" className="flex-1 md:flex-none h-10">Filter</Button>
            <Link href="/admin/venues" className={buttonVariants({ variant: "outline", className: "flex-1 md:flex-none h-10 text-center" })}>Clear</Link>
          </div>
        </form>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Capacity</th>
                <th className="px-6 py-4 font-semibold">Facilities</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {venues?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No venues found.
                  </td>
                </tr>
              ) : (
                venues?.map((venue) => (
                  <tr key={venue.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted border border-border">
                          <Image
                            src={getVenueImageUrl(venue)}
                            alt={venue.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <span className="truncate">{venue.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                        {venue.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {venue.building}, {venue.floor}
                    </td>
                    <td className="px-6 py-4">
                      {venue.capacity}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {venue.venue_facilities?.map((vf: { facilities: { name: string } }) => (
                          <span key={vf.facilities.name} className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                            {vf.facilities.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {venue.active ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/venues/${venue.id}/edit`} className={buttonVariants({ variant: "outline", size: "icon-sm" })}>
                          <Edit2 className="size-4" />
                        </Link>
                        <form action={async () => {
                          'use server'
                          await toggleVenueStatus(venue.id, !venue.active)
                        }}>
                          <Button variant={venue.active ? "destructive" : "default"} size="sm" type="submit" title={venue.active ? "Deactivate" : "Activate"}>
                            {venue.active ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
