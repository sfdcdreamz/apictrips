import { NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()

  const [{ data: trip }, { data: member }] = await Promise.all([
    serviceSupabase.from('trips').select('organiser_id').eq('id', tripId).single(),
    serviceSupabase.from('members').select('email').eq('trip_id', tripId).eq('email', user.email!).single(),
  ])

  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (trip.organiser_id !== user.id && !member) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: photos } = await serviceSupabase
    .from('trip_photos')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ photos: photos || [] })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceSupabase = createServiceRoleClient()

  const [{ data: trip }, { data: member }] = await Promise.all([
    serviceSupabase.from('trips').select('organiser_id').eq('id', tripId).single(),
    serviceSupabase.from('members').select('email').eq('trip_id', tripId).eq('email', user.email!).single(),
  ])

  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const allowed = trip.organiser_id === user.id || !!member
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('photo') as File | null
  const caption = formData.get('caption') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP, or HEIC.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const storagePath = `${tripId}/${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await serviceSupabase.storage
    .from('photos')
    .upload(storagePath, buffer, { contentType: file.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: photo, error: dbError } = await serviceSupabase
    .from('trip_photos')
    .insert({
      trip_id: tripId,
      uploaded_by: user.email!,
      storage_path: storagePath,
      caption: caption?.trim() || null,
    })
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ photo }, { status: 201 })
}
