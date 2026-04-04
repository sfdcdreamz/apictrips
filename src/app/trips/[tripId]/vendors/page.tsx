import { notFound } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import AddVendorForm from '@/components/vendors/AddVendorForm'
import DeleteVendorButton from '@/components/vendors/DeleteVendorButton'
import type { VendorContact } from '@/types'

const ROLE_COLORS: Record<string, string> = {
  Driver: 'bg-blue-100 text-blue-700',
  Hotel: 'bg-purple-100 text-purple-700',
  Restaurant: 'bg-orange-100 text-orange-700',
  Guide: 'bg-emerald-100 text-emerald-700',
  Emergency: 'bg-red-100 text-red-600',
  Other: 'bg-gray-100 text-gray-600',
}

async function getVendorData(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceSupabase = createServiceRoleClient()

  const [{ data: trip }, { data: vendors }] = await Promise.all([
    supabase.from('trips').select('id, organiser_id').eq('id', tripId).single(),
    serviceSupabase.from('vendor_contacts').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
  ])

  if (!trip) return null

  return {
    isOrganiser: trip.organiser_id === user.id,
    vendors: (vendors || []) as VendorContact[],
  }
}

export default async function VendorsPage({
  params,
}: {
  params: Promise<{ tripId: string }>
}) {
  const { tripId } = await params
  const data = await getVendorData(tripId)
  if (!data) notFound()

  const { isOrganiser, vendors } = data

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Vendor Contacts</h1>
        <p className="text-emerald-100 text-sm mt-1">
          Drivers, hotels, guides and more — tap a number to call.
        </p>
      </div>

      {isOrganiser && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Add contact</h2>
          <AddVendorForm tripId={tripId} />
        </div>
      )}

      {vendors.length > 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Contacts ({vendors.length})</h2>
          <div className="space-y-3">
            {vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
              >
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${
                  ROLE_COLORS[vendor.role] || ROLE_COLORS.Other
                }`}>
                  {vendor.role}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{vendor.name}</p>
                  {vendor.phone && (
                    <a
                      href={`tel:${vendor.phone}`}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      {vendor.phone}
                    </a>
                  )}
                  {vendor.notes && (
                    <p className="text-xs text-gray-400 mt-0.5">{vendor.notes}</p>
                  )}
                </div>
                {isOrganiser && (
                  <DeleteVendorButton tripId={tripId} vendorId={vendor.id} />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center">
          <div className="text-3xl mb-3">📞</div>
          <p className="text-gray-500 text-sm">No contacts yet.</p>
          {isOrganiser && (
            <p className="text-gray-400 text-xs mt-1">Add your driver, hotel, or guide above.</p>
          )}
        </div>
      )}
    </div>
  )
}
