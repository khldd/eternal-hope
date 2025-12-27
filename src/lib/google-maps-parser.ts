// Google Maps URL Parser
// Extracts place ID and coordinates from various Google Maps URL formats

export interface ParsedGoogleMapsUrl {
  placeId: string | null
  coordinates: { lat: number; lng: number } | null
  placeName: string | null
}

export function parseGoogleMapsUrl(url: string): ParsedGoogleMapsUrl {
  const result: ParsedGoogleMapsUrl = {
    placeId: null,
    coordinates: null,
    placeName: null,
  }

  try {
    // Clean up the URL
    const cleanUrl = url.trim()

    // Pattern 1: Place ID in URL (most reliable)
    // https://www.google.com/maps/place/.../@lat,lng,.../data=...!1s0x...!...
    const placeIdMatch = cleanUrl.match(/!1s(0x[a-f0-9]+:[a-f0-9x]+)/i)
    if (placeIdMatch) {
      result.placeId = placeIdMatch[1]
    }

    // Pattern 2: Place ID in query parameter
    // https://maps.google.com/?cid=...
    const cidMatch = cleanUrl.match(/[?&]cid=(\d+)/)
    if (cidMatch && !result.placeId) {
      result.placeId = cidMatch[1]
    }

    // Pattern 3: Place ID from ftid parameter
    const ftidMatch = cleanUrl.match(/ftid=(0x[a-f0-9]+:[a-f0-9x]+)/i)
    if (ftidMatch && !result.placeId) {
      result.placeId = ftidMatch[1]
    }

    // Extract coordinates from URL
    // Pattern: @lat,lng,zoom
    const coordMatch = cleanUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),?(\d+)?z?/)
    if (coordMatch) {
      result.coordinates = {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2]),
      }
    }

    // Alternative coordinate pattern in query string
    if (!result.coordinates) {
      const queryCoordMatch = cleanUrl.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)
      if (queryCoordMatch) {
        result.coordinates = {
          lat: parseFloat(queryCoordMatch[1]),
          lng: parseFloat(queryCoordMatch[2]),
        }
      }
    }

    // Extract place name from URL path
    // https://www.google.com/maps/place/Place+Name+Here/@...
    const placeNameMatch = cleanUrl.match(/\/place\/([^/@]+)/)
    if (placeNameMatch) {
      result.placeName = decodeURIComponent(placeNameMatch[1].replace(/\+/g, ' '))
    }

    // Short URL pattern: goo.gl/maps/... or maps.app.goo.gl/...
    // These need to be resolved server-side

  } catch (error) {
    console.error('Error parsing Google Maps URL:', error)
  }

  return result
}

// Validate if a URL is a Google Maps URL
export function isGoogleMapsUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?google\.[a-z.]+\/maps/,
    /^https?:\/\/maps\.google\.[a-z.]+/,
    /^https?:\/\/goo\.gl\/maps/,
    /^https?:\/\/maps\.app\.goo\.gl/,
    /^https?:\/\/goo\.gl\//,  // Include all goo.gl links
  ]

  return patterns.some((pattern) => pattern.test(url.trim()))
}

// Extract a search query from the URL for fallback
export function extractSearchQuery(url: string): string | null {
  try {
    const searchMatch = url.match(/\/search\/([^/]+)/)
    if (searchMatch) {
      return decodeURIComponent(searchMatch[1].replace(/\+/g, ' '))
    }

    const queryMatch = url.match(/[?&]q=([^&]+)/)
    if (queryMatch) {
      const q = decodeURIComponent(queryMatch[1].replace(/\+/g, ' '))
      // Filter out coordinate-only queries
      if (!/^-?\d+\.?\d*,-?\d+\.?\d*$/.test(q)) {
        return q
      }
    }
  } catch {
    return null
  }

  return null
}
