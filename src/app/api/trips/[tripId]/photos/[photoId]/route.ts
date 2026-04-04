import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string; photoId: string }> }
) {
  const { photoId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()
  const { data: photo } = await serviceSupabase
    .from('trip_photos')
    .select('storage_path')
    .eq('id', photoId)
    .single()

  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: signed, error } = await serviceSupabase.storage
    .from('photos')
    .createSignedUrl(photo.storage_path, 3600)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ signedUrl: signed.signedUrl })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tripId: string; photoId: string }> }
) {
  const { tripId, photoId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()
  const { data: photo } = await serviceSupabase
    .from('trip_photos')
    .select('uploaded_by, storage_path')
    .eq('id', photoId)
    .single()

  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only uploader or organiser can delete
  const { data: trip } = await serviceSupabase
    .from('trips')
    .select('organiser_id')
    .eq('id', tripId)
    .single()

  const canDelete = photo.uploaded_by === user.email || trip?.organiser_id === user.id
  if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await Promise.all([
    serviceSupabase.storage.from('photos').remove([photo.storage_path]),
    serviceSupabase.from('trip_photos').delete().eq('id', photoId),
  ])

  return new NextResponse(null, { status: 204 })
}
