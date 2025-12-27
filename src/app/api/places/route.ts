import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: places, error } = await (supabase as any)
      .from('places')
      .select(`
        *,
        notes (*),
        place_tags (
          tag:tags (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform the data to match our expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedPlaces = places?.map((place: any) => ({
      ...place,
      tags: place.place_tags?.map((pt: { tag: unknown }) => pt.tag) || [],
    }))

    return NextResponse.json(transformedPlaces || [])
  } catch (error) {
    console.error('Error fetching places:', error)
    return NextResponse.json(
      { error: 'Failed to fetch places' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const placeData = await request.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: place, error } = await (supabase as any)
      .from('places')
      .insert(placeData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(place)
  } catch (error) {
    console.error('Error creating place:', error)
    return NextResponse.json(
      { error: 'Failed to create place' },
      { status: 500 }
    )
  }
}
