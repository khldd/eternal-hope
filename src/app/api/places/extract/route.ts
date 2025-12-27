import { NextRequest, NextResponse } from 'next/server'
import { parseGoogleMapsUrl, isGoogleMapsUrl, extractSearchQuery } from '@/lib/google-maps-parser'

interface PlaceDetails {
  placeId: string
  name: string
  address: string
  latitude: number
  longitude: number
  rating: number | null
  priceLevel: number | null
  types: string[]
  phone: string | null
  website: string | null
  openingHours: string[] | null
  reviews: { text: string; rating: number; authorName: string }[]
  photoUrls: string[]
  editorialSummary: string | null
}

export async function POST(request: NextRequest) {
  try {
    let { url } = await request.json()

    if (!url || !isGoogleMapsUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid Google Maps URL' },
        { status: 400 }
      )
    }

    // Expand shortened URLs (goo.gl, maps.app.goo.gl, etc.)
    if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
        })
        url = response.url
      } catch (error) {
        console.error('Failed to expand shortened URL:', error)
        // Continue with original URL if expansion fails
      }
    }

    const parsed = parseGoogleMapsUrl(url)
    
    // For development/demo, return mock data if no API key
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(getMockPlaceData(parsed, url))
    }

    // Try to get place details using Place ID or search
    let placeDetails: PlaceDetails | null = null

    if (parsed.placeId) {
      placeDetails = await getPlaceById(parsed.placeId)
    }

    if (!placeDetails && parsed.placeName) {
      placeDetails = await searchPlace(parsed.placeName, parsed.coordinates)
    }

    if (!placeDetails && parsed.coordinates) {
      // Use reverse geocoding as last resort
      placeDetails = await reverseGeocode(parsed.coordinates)
    }

    if (!placeDetails) {
      return NextResponse.json(
        { error: 'Could not find place details' },
        { status: 404 }
      )
    }

    return NextResponse.json(placeDetails)
  } catch (error) {
    console.error('Error extracting place:', error)
    return NextResponse.json(
      { error: 'Failed to extract place data' },
      { status: 500 }
    )
  }
}

async function getPlaceById(placeId: string): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY!

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry,rating,price_level,types,formatted_phone_number,website,opening_hours,reviews,photos,editorial_summary&key=${apiKey}`
    )

    const data = await response.json()

    if (data.status !== 'OK' || !data.result) {
      return null
    }

    const place = data.result
    
    // Generate photo URLs from photo references
    const photoUrls: string[] = []
    if (place.photos && place.photos.length > 0) {
      // Get up to 6 photos
      const photosToFetch = place.photos.slice(0, 6)
      for (const photo of photosToFetch) {
        if (photo.photo_reference) {
          photoUrls.push(
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`
          )
        }
      }
    }

    return {
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      rating: place.rating || null,
      priceLevel: place.price_level || null,
      types: place.types || [],
      phone: place.formatted_phone_number || null,
      website: place.website || null,
      openingHours: place.opening_hours?.weekday_text || null,
      reviews: (place.reviews || []).map((r: { text: string; rating: number; author_name: string }) => ({
        text: r.text,
        rating: r.rating,
        authorName: r.author_name,
      })),
      photoUrls,
      editorialSummary: place.editorial_summary?.overview || null,
    }
  } catch (error) {
    console.error('Error fetching place by ID:', error)
    return null
  }
}

async function searchPlace(
  query: string,
  coordinates: { lat: number; lng: number } | null
): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY!

  try {
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`

    if (coordinates) {
      url += `&location=${coordinates.lat},${coordinates.lng}&radius=1000`
    }

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK' || !data.results?.length) {
      return null
    }

    // Get full details for the first result
    return getPlaceById(data.results[0].place_id)
  } catch (error) {
    console.error('Error searching place:', error)
    return null
  }
}

async function reverseGeocode(
  coordinates: { lat: number; lng: number }
): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY!

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&key=${apiKey}`
    )

    const data = await response.json()

    if (data.status !== 'OK' || !data.results?.length) {
      return null
    }

    const result = data.results[0]

    return {
      placeId: result.place_id,
      name: result.formatted_address.split(',')[0],
      address: result.formatted_address,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      rating: null,
      priceLevel: null,
      types: result.types || [],
      phone: null,
      website: null,
      openingHours: null,
      reviews: [],
      photoUrls: [],
      editorialSummary: null,
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    return null
  }
}

// Mock data for development without API key
function getMockPlaceData(
  parsed: ReturnType<typeof parseGoogleMapsUrl>,
  originalUrl: string
): PlaceDetails {
  const mockPlaces = [
    {
      name: 'Byblos Old Souk',
      address: 'Byblos, Lebanon',
      latitude: 34.1205,
      longitude: 35.6481,
      types: ['tourist_attraction', 'point_of_interest'],
      photoUrls: [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
        'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      ],
    },
    {
      name: 'Jeita Grotto',
      address: 'Jeita, Lebanon',
      latitude: 33.9425,
      longitude: 35.6381,
      types: ['natural_feature', 'tourist_attraction'],
      photoUrls: [
        'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
      ],
    },
    {
      name: 'Raouche Rocks',
      address: 'Beirut, Lebanon',
      latitude: 33.8869,
      longitude: 35.4697,
      types: ['natural_feature', 'tourist_attraction'],
      photoUrls: [
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
        'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
      ],
    },
  ]

  const randomPlace = mockPlaces[Math.floor(Math.random() * mockPlaces.length)]

  return {
    placeId: `mock_${Date.now()}`,
    name: parsed.placeName || randomPlace.name,
    address: randomPlace.address,
    latitude: parsed.coordinates?.lat || randomPlace.latitude,
    longitude: parsed.coordinates?.lng || randomPlace.longitude,
    rating: 4.5,
    priceLevel: 2,
    types: randomPlace.types,
    phone: null,
    website: null,
    openingHours: ['Monday: 9:00 AM – 6:00 PM', 'Tuesday: 9:00 AM – 6:00 PM'],
    reviews: [
      {
        text: 'Beautiful place with amazing views. Perfect for a quiet afternoon together.',
        rating: 5,
        authorName: 'Traveler',
      },
      {
        text: 'Such a romantic spot! We loved watching the sunset here.',
        rating: 5,
        authorName: 'Couple Explorer',
      },
    ],
    photoUrls: randomPlace.photoUrls,
    editorialSummary: 'A stunning destination that captures the essence of natural beauty and cultural heritage.',
  }
}
