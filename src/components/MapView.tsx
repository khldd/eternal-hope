'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { APIProvider } from '@vis.gl/react-google-maps'
import Map from '@/components/Map'
import Header from '@/components/Header'
import PlacePanel from '@/components/PlacePanel'
import AddPlaceModal from '@/components/AddPlaceModal'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export default function MapView() {
  const { setPlaces } = useAppStore()

  // Fetch places on mount
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await fetch('/api/places')
        if (response.ok) {
          const places = await response.json()
          setPlaces(places)
        }
      } catch (error) {
        console.error('Failed to fetch places:', error)
      }
    }

    fetchPlaces()
  }, [setPlaces])

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a120a] text-[#E8F0E3]">
        <div className="text-center p-8 bg-[#1a2818]/60 border border-[#4A7C59]/30 rounded-2xl">
          <h2 className="text-xl font-bold mb-2">Configuration Error</h2>
          <p className="text-[#90A955]">Google Maps API Key is missing.</p>
        </div>
      </div>
    )
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places', 'marker']}>
      <div className="relative h-screen w-full overflow-hidden bg-[#0a120a]">
        {/* Map layer */}
        <Map />

        {/* UI overlay */}
        <div className="absolute inset-x-0 top-0 z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <Header />
          </div>
        </div>

        {/* Place detail panel */}
        <PlacePanel />

        {/* Add place modal */}
        <AddPlaceModal />
      </div>
    </APIProvider>
  )
}
