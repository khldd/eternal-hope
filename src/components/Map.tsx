'use client'

import { useCallback, useState } from 'react'
import { Map as GoogleMap, Marker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { useAppStore, useFilteredPlaces } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import type { PlaceStatus } from '@/types/database'

// Dark organic map style
const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0d1a0d" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1a0d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6B8E4E" }] },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#B8D4A8" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1f331f" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0d1a0d" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4A7C59" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2d4a2d" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0d1a0d" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#90A955" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0a120a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3D5A3D" }],
  },
]

const statusColors: Record<PlaceStatus, string> = {
  planned: '#B8D4A8', // Sage
  been_there: '#6B8E4E', // Olive
  favorite: '#E8F0E3', // Mist
  dream: '#90A955', // Fern
}

export default function Map() {
  const { mapCenter, mapZoom, setMapCenter, setMapZoom, setSelectedPlaceId, setIsPanelOpen } = useAppStore()
  const filteredPlaces = useFilteredPlaces()
  const map = useMap()
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null)

  const handleMarkerClick = useCallback((placeId: string, lat: number, lng: number) => {
    setSelectedPlaceId(placeId)
    setIsPanelOpen(true)
    setMapCenter([lng, lat])
    map?.panTo({ lat, lng })
  }, [setSelectedPlaceId, setIsPanelOpen, setMapCenter, map])

  // Get the place object that is currently hovered to show its InfoWindow
  const hoveredPlace = filteredPlaces.find(p => p.id === hoveredPlaceId)

  return (
    <div className="absolute inset-0 bg-[#0a120a]">
      <GoogleMap
        // mapId is removed to revert to Raster Map which supports JSON styling fully
        defaultCenter={{ lat: mapCenter[1], lng: mapCenter[0] }}
        defaultZoom={mapZoom}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        styles={mapStyle}
        onCameraChanged={(ev) => {
          setMapCenter([ev.detail.center.lng, ev.detail.center.lat])
          setMapZoom(ev.detail.zoom)
        }}
        className="w-full h-full focus:outline-none"
      >
        {filteredPlaces.map((place) => (
          <Marker
            key={place.id}
            position={{ lat: place.latitude, lng: place.longitude }}
            onClick={() => handleMarkerClick(place.id, place.latitude, place.longitude)}
            onMouseOver={() => setHoveredPlaceId(place.id)}
            onMouseOut={() => setHoveredPlaceId(null)}
            icon={{
              path: "M16 2C10 2 4 8 4 16c0 8 12 14 12 14s12-6 12-14c0-8-6-14-12-14z",
              fillColor: statusColors[place.status],
              fillOpacity: 1,
              strokeColor: 'rgba(255,255,255,0.4)',
              strokeWeight: 1.5,
              scale: 1.2,
              anchor: new google.maps.Point(16, 32),
              labelOrigin: new google.maps.Point(16, 14)
            }}
          />
        ))}

        {/* InfoWindow for Hover Effect */}
        {hoveredPlace && (
          <InfoWindow
            position={{ lat: hoveredPlace.latitude, lng: hoveredPlace.longitude }}
            pixelOffset={[0, -36]}
            disableAutoPan={true}
            headerContent={null}
          >
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#141e14] text-[#E8F0E3] rounded-lg overflow-hidden shadow-2xl border border-[#ffffff]/10"
                style={{ minWidth: (hoveredPlace.photo_urls?.length ?? 0) > 0 ? '160px' : 'auto' }}
              >
                {/* Photo Preview */}
                {(hoveredPlace.photo_urls?.length ?? 0) > 0 && (
                  <div className="flex h-20 w-full border-b border-[#ffffff]/10">
                    {hoveredPlace.photo_urls!.slice(0, 2).map((url, i) => (
                      <div key={i} className="flex-1 relative overflow-hidden bg-black/50 first:border-r border-[#ffffff]/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Name Label */}
                <div className="px-4 py-2 text-center whitespace-nowrap bg-[#141e14]">
                  <span className="text-xs font-bold block text-[#E8F0E3] tracking-wide">
                    {hoveredPlace.name}
                  </span>
                  <span className="text-[10px] text-[#90A955] uppercase tracking-wider font-semibold">
                    {placeStatusLabel(hoveredPlace.status)}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}

function placeStatusLabel(status: PlaceStatus): string {
  switch (status) {
    case 'planned': return 'Planned'
    case 'been_there': return 'Been There'
    case 'favorite': return 'Favorite'
    case 'dream': return 'Dream'
    default: return ''
  }
}
