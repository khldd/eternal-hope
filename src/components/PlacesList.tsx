'use client'

import { useAppStore, useFilteredPlaces } from '@/lib/store'
import { format } from 'date-fns'
import { MapPin, Star, Sparkles, ChevronRight } from 'lucide-react'
import type { PlaceStatus } from '@/types/database'

const statusColors: Record<PlaceStatus, { bg: string; text: string; dot: string }> = {
  planned: { bg: 'bg-[#6B8E4E]/20', text: 'text-[#6B8E4E]', dot: 'bg-[#6B8E4E]' },
  been_there: { bg: 'bg-[#3D5A3D]/20', text: 'text-[#3D5A3D]', dot: 'bg-[#3D5A3D]' },
  favorite: { bg: 'bg-[#90A955]/20', text: 'text-[#90A955]', dot: 'bg-[#90A955]' },
  dream: { bg: 'bg-[#4A7C59]/20', text: 'text-[#4A7C59]', dot: 'bg-[#4A7C59]' },
}

const statusLabels: Record<PlaceStatus, string> = {
  planned: 'Planned',
  been_there: 'Been There',
  favorite: 'Favorite',
  dream: 'Dream',
}

export default function PlacesList() {
  const { setSelectedPlaceId, setMapCenter, setMapZoom } = useAppStore()
  const filteredPlaces = useFilteredPlaces()

  if (filteredPlaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#3D5A3D]/20 flex items-center justify-center mb-4">
          <MapPin className="w-8 h-8 text-[#6B8E4E]" />
        </div>
        <h3 className="text-lg font-medium text-[#E8F0E3] mb-2">No places yet</h3>
        <p className="text-sm text-[#6B8E4E] max-w-xs">
          Add your first place by clicking the "Add Place" button and pasting a Google Maps link.
        </p>
      </div>
    )
  }

  const handlePlaceClick = (placeId: string, lat: number, lng: number) => {
    setSelectedPlaceId(placeId)
    setMapCenter([lng, lat])
    setMapZoom(15)
  }

  return (
    <div className="divide-y divide-[#3D5A3D]/20">
      {filteredPlaces.map((place) => {
        const colors = statusColors[place.status]
        
        return (
          <button
            key={place.id}
            onClick={() => handlePlaceClick(place.id, place.latitude, place.longitude)}
            className="w-full p-4 text-left hover:bg-[#3D5A3D]/10 transition-colors group"
          >
            <div className="flex items-start gap-3">
              {/* Status dot */}
              <div className={`w-3 h-3 rounded-full mt-1.5 ${colors.dot} flex-shrink-0`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-[#E8F0E3] truncate group-hover:text-[#B8D4A8] transition-colors">
                    {place.name}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-[#6B8E4E] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>

                {place.address && (
                  <p className="text-sm text-[#6B8E4E] truncate mt-0.5">
                    {place.address}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {/* Status badge */}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${colors.bg} ${colors.text}`}>
                    {statusLabels[place.status]}
                  </span>

                  {/* Rating */}
                  {place.rating && (
                    <span className="flex items-center gap-1 text-xs text-[#B8D4A8]">
                      <Star className="w-3 h-3 fill-[#90A955] text-[#90A955]" />
                      {place.rating.toFixed(1)}
                    </span>
                  )}

                  {/* Notes count */}
                  {place.notes && place.notes.length > 0 && (
                    <span className="text-xs text-[#6B8E4E]">
                      {place.notes.length} note{place.notes.length !== 1 ? 's' : ''}
                    </span>
                  )}

                  {/* Added date */}
                  <span className="text-xs text-[#4A7C59]">
                    {format(new Date(place.created_at), 'MMM d')}
                  </span>
                </div>

                {/* Vibe tags */}
                {place.ai_vibe_tags && place.ai_vibe_tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 overflow-hidden">
                    <Sparkles className="w-3 h-3 text-[#90A955] flex-shrink-0" />
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                      {place.ai_vibe_tags.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-[#4A7C59]/10 rounded text-xs text-[#90A955] whitespace-nowrap"
                        >
                          {tag}
                        </span>
                      ))}
                      {place.ai_vibe_tags.length > 3 && (
                        <span className="text-xs text-[#6B8E4E]">
                          +{place.ai_vibe_tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
