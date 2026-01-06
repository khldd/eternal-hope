import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Author } from '@/types/database'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const place_id = formData.get('place_id') as string
    const caption = formData.get('caption') as string
    const author = formData.get('author') as Author

    if (!file || !place_id || !author) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate author
    if (author !== 'khaled' && author !== 'amal') {
      return NextResponse.json(
        { error: 'Invalid author' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${place_id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // 2. Insert record into photos table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: photoRecord, error: dbError } = await (supabase as any)
      .from('photos')
      .insert({
        place_id,
        storage_path: filePath,
        caption: caption || null,
        uploaded_by: author,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error inserting photo record:', dbError)
      // Attempt to clean up the uploaded file if DB insert fails
      await supabase.storage.from('photos').remove([filePath])
      
      return NextResponse.json(
        { error: 'Failed to save photo record' },
        { status: 500 }
      )
    }

    return NextResponse.json(photoRecord)

  } catch (error) {
    console.error('Error processing photo upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
