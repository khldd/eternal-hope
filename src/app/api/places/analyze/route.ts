import { NextRequest, NextResponse } from 'next/server'
import { analyzePlace, refreshPlaceVibe } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const {
      placeName,
      placeTypes,
      reviews,
      existingNotes,
      isRefresh,
      editorialSummary,
    } = await request.json()

    if (!placeName) {
      return NextResponse.json(
        { error: 'Place name is required' },
        { status: 400 }
      )
    }

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      // Return thoughtful defaults
      return NextResponse.json({
        summary: `${placeName} is waiting to become part of your story. Visit together and discover what makes it special.`,
        coupleInsights: 'Every place has potential for a beautiful memory. What will this one hold for you two?',
        vibeTags: ['undiscovered', 'awaiting-you'],
        poeticDescription: 'A canvas for moments yet to be painted.',
        generalDescription: editorialSummary || `${placeName} awaits your discovery. Explore together and create memories.`,
      })
    }

    let analysis

    if (isRefresh && existingNotes?.length > 0) {
      analysis = await refreshPlaceVibe(
        placeName,
        placeTypes || [],
        reviews || [],
        existingNotes,
        editorialSummary
      )
    } else {
      analysis = await analyzePlace(
        placeName,
        placeTypes || [],
        reviews || [],
        editorialSummary
      )
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing place:', error)
    return NextResponse.json(
      { error: 'Failed to analyze place' },
      { status: 500 }
    )
  }
}
