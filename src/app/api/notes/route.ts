import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const noteData = await request.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: note, error } = await (supabase as any)
      .from('notes')
      .insert(noteData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}
