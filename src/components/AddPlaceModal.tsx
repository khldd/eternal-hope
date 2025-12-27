'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { MapPin, Loader2, Sparkles, Search } from 'lucide-react'
import type { PlaceInsert } from '@/types/database'

export default function AddPlaceModal() {
  const { isAddingPlace, setIsAddingPlace, addPlace, currentUser, setSelectedPlaceId } = useAppStore()
  const placesLibrary = useMapsLibrary('places')
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'input' | 'processing' | 'analyzing' | 'done'>('input')

  // Logic to process a google place result (New API Place object)
  const processPlace = async (place: google.maps.places.Place) => {
    setStep('processing')

    try {
      // Fetch details using the new API
      // Note: We must explicitly ask for fields not returned by search
      await place.fetchFields({
        fields: [
          'displayName',
          'formattedAddress',
          'location',
          'photos',
          'rating',
          'priceLevel',
          'types',
          'internationalPhoneNumber',
          'regularOpeningHours',
          'reviews',
          'editorialSummary',
          'googleMapsURI',
          'id'
        ]
      })

      const photoUrls = place.photos?.map(p => p.getURI({ maxWidth: 800 })) || []

      const refinedReviews = place.reviews?.map(r => ({
        text: r.text || '',
        rating: r.rating || 0,
        authorName: r.authorAttribution?.displayName || 'Anonymous'
      })) || []

      // 2. Analyze Vibe
      setStep('analyzing')
      const analyzeResponse = await fetch('/api/places/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeName: place.displayName,
          placeTypes: place.types,
          reviews: refinedReviews,
          editorialSummary: place.editorialSummary,
          isRefresh: false,
        }),
      })

      const aiAnalysis = analyzeResponse.ok ? await analyzeResponse.json() : null

      // 3. Create Place
      const newPlace: PlaceInsert = {
        google_place_id: place.id,
        google_maps_url: place.googleMapsURI || `https://www.google.com/maps/place/?q=place_id:${place.id}`,
        name: place.displayName || 'Unknown Place',
        address: place.formattedAddress || '',
        latitude: place.location?.lat() || 0,
        longitude: place.location?.lng() || 0,
        status: 'planned',
        rating: place.rating || null,
        price_level: place.priceLevel ? parseInt(place.priceLevel as any) : null,
        types: place.types || [],
        phone: place.internationalPhoneNumber || null,
        website: null, // Explicitly null as requested
        opening_hours: place.regularOpeningHours?.weekdayDescriptions || null,
        raw_reviews: refinedReviews,
        photo_urls: photoUrls,
        ai_summary: aiAnalysis?.summary || null,
        ai_couple_insights: aiAnalysis?.coupleInsights || null,
        ai_vibe_tags: aiAnalysis?.vibeTags || null,
        ai_poetic_description: aiAnalysis?.poeticDescription || null,
        ai_general_description: aiAnalysis?.generalDescription || null,
        ai_processed_at: aiAnalysis ? new Date().toISOString() : null,
        added_by: currentUser,
      }

      // 4. Save
      const createResponse = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlace),
      })

      if (!createResponse.ok) throw new Error('Failed to save')

      const savedPlace = await createResponse.json()
      setStep('done')
      addPlace(savedPlace)

      setTimeout(() => {
        setSelectedPlaceId(savedPlace.id)
        handleClose()
      }, 800)
    } catch (e: any) {
      console.error("Place Details Error:", e)
      setError(e.message || 'Something went wrong')
      setIsLoading(false)
      setStep('input')
    }
  }

  // Search handler using New Places API
  const handleSearch = async () => {
    if (!inputValue.trim() || !placesLibrary) return

    setIsLoading(true)
    setError(null)

    try {
      // @ts-ignore - Types for Place.searchByText might be missing in older Definitions
      const { places } = await placesLibrary.Place.searchByText({
        textQuery: inputValue,
        fields: ['id', 'displayName', 'formattedAddress', 'location'],
        maxResultCount: 1
      })

      if (places && places.length > 0) {
        await processPlace(places[0])
      } else {
        setError('No place found. Try a specific name or location.')
        setIsLoading(false)
      }

    } catch (err) {
      console.error("Search Error:", err)
      // Fallback message
      setError('Search failed. Ensure "Places API (New)" is enabled in Google Cloud Console.')
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setInputValue('')
    setError(null)
    setStep('input')
    setIsAddingPlace(false)
  }

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  if (!isAddingPlace) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-md bg-[#0d1a0d]/90 backdrop-blur-2xl rounded-3xl border border-[#ffffff]/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Organic Gradient Backgrounds */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B8E4E]/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#90A955]/20 rounded-full blur-[80px]" />

        <div className="relative p-8">
          {/* Header */}
          <div className="flex flex-col items-center justify-center mb-8 text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${step === 'done'
              ? 'bg-[#4A7C59] shadow-[0_0_30px_rgba(74,124,89,0.4)]'
              : 'bg-gradient-to-br from-[#1a2818] to-[#0a120a] border border-[#ffffff]/5 shadow-inner'
              }`}>
              {step === 'processing' ? (
                <Loader2 className="w-6 h-6 text-[#6B8E4E] animate-spin" />
              ) : step === 'analyzing' ? (
                <Sparkles className="w-6 h-6 text-[#90A955] animate-pulse" />
              ) : step === 'done' ? (
                <MapPin className="w-6 h-6 text-white animate-bounce" />
              ) : (
                <Search className="w-6 h-6 text-[#6B8E4E]" />
              )}
            </div>

            <h2 className="text-xl font-bold text-[#E8F0E3] mb-1">
              {step === 'done' ? "Added to Map!" : "Find a Place"}
            </h2>
            <p className="text-sm text-[#90A955]/80 max-w-[240px]">
              {step === 'done' ? "Creating your personalized card" : "Search by name using the New Places API."}
            </p>
          </div>

          {/* Input Container */}
          <div className="space-y-6">
            <div className={`relative group transition-all duration-300 ${isLoading ? 'opacity-50 pointer-events-none blur-[0.5px]' : ''}`}>
              <div className="absolute inset-0 bg-[#ffffff]/5 rounded-2xl blur-sm group-focus-within:bg-[#ffffff]/10 transition-colors" />
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-[#6B8E4E]" />
                </div>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search places..."
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 bg-[#0d1a0d]/80 border border-[#ffffff]/10 rounded-2xl text-[#E8F0E3] placeholder-[#6B8E4E]/40 focus:outline-none focus:border-[#90A955]/50 focus:ring-1 focus:ring-[#90A955]/50 transition-all font-medium text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-900/10 border border-red-500/20 rounded-xl text-red-300 text-sm text-center animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            {!isLoading && (
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3.5 border border-[#ffffff]/10 rounded-xl text-[#90A955] hover:bg-[#ffffff]/5 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSearch}
                  disabled={!inputValue.trim()}
                  className="flex-[2] px-4 py-3.5 bg-gradient-to-r from-[#6B8E4E] to-[#4A7C59] rounded-xl text-white font-bold hover:shadow-[0_0_20px_rgba(107,142,78,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Search
                </button>
              </div>
            )}

            {/* Progress Bar */}
            {isLoading && (
              <div className="w-full h-1.5 bg-[#ffffff]/10 rounded-full overflow-hidden mt-2">
                <div className={`h-full bg-[#90A955] rounded-full transition-all duration-1000 ${step === 'processing' ? 'w-1/3' :
                  step === 'analyzing' ? 'w-2/3' : 'w-full'
                  }`} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
