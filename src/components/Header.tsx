'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Plus, Search, Leaf, MapPin, Globe, Loader2, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { cn } from '@/lib/utils'
import type { PlaceStatus } from '@/types/database'

const statusFilters: { value: PlaceStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Places' },
  { value: 'planned', label: 'Planned' },
  { value: 'been_there', label: 'Been There' },
  { value: 'favorite', label: 'Favorites' },
  { value: 'dream', label: 'Dreams' },
]

export default function Header() {
  const {
    currentUser,
    setCurrentUser,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    places,
    setSelectedPlaceId,
    setPendingSearchPlace,
    setIsAddingPlace
  } = useAppStore()

  const placesLibrary = useMapsLibrary('places')
  const [isFocused, setIsFocused] = useState(false)
  const [googleResults, setGoogleResults] = useState<google.maps.places.Place[]>([])
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const toggleUser = () => {
    setCurrentUser(currentUser === 'khaled' ? 'amal' : 'khaled')
  }

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Google Search Debounce
  useEffect(() => {
    const query = searchQuery.trim()
    if (!query || !placesLibrary) {
      setGoogleResults([])
      return
    }

    const handler = setTimeout(async () => {
      setIsSearchingGoogle(true)
      try {
        // @ts-ignore - searchByText availability
        const { places } = await placesLibrary.Place.searchByText({
          textQuery: query,
          fields: ['id', 'displayName', 'formattedAddress', 'location', 'photos', 'types'],
          maxResultCount: 5
        })
        setGoogleResults(places || [])
      } catch (e) {
        console.error("Google search failed", e)
      } finally {
        setIsSearchingGoogle(false)
      }
    }, 600)

    return () => clearTimeout(handler)
  }, [searchQuery, placesLibrary])

  // Derive lists
  const localMatches = searchQuery.trim() 
    ? places.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : []
  
  const newDiscoveries = googleResults.filter(
    g => !places.some(p => p.google_place_id === g.id)
  )

  const hasResults = localMatches.length > 0 || newDiscoveries.length > 0
  const showDropdown = isFocused && searchQuery.trim().length > 0

  const handleSelectLocal = (id: string) => {
    setSelectedPlaceId(id)
    setIsFocused(false)
    setSearchQuery('')
  }

  const handleAddDiscovery = (place: google.maps.places.Place) => {
    setPendingSearchPlace(place)
    setIsAddingPlace(true)
    setIsFocused(false)
    setSearchQuery('')
  }

  return (
    <header className="relative z-30 pointer-events-none">
      {/* Background gradient for legibility */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#0a120a] via-[#0a120a]/80 to-transparent pointer-events-none" />

      <div className="relative px-4 py-4 sm:px-6 pointer-events-auto">
        {/* Top row: Logo and actions */}
        <div className="flex items-center justify-between mb-6">
          {/* Logo Card */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-2 pr-4 bg-[#141e14]/40 backdrop-blur-md border border-[#3D5A3D]/30 rounded-2xl shadow-lg ring-1 ring-white/5"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B8E4E] to-[#4A7C59] flex items-center justify-center shadow-lg shadow-[#4A7C59]/20 group overflow-hidden">
              <Leaf className="w-5 h-5 text-white relative z-10" />
              <div className="absolute inset-0 bg-white/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#E8F0E3] tracking-tight leading-tight">
                Eternal Hope
              </h1>
              <p className="text-[10px] text-[#90A955] uppercase tracking-wider font-semibold">
                {places.length} {places.length === 1 ? 'Place' : 'Places'}
              </p>
            </div>
          </motion.div>

          {/* Right actions: Just User Toggle now */}
          <div className="flex items-center gap-3">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleUser}
              className="group relative flex items-center gap-2 px-1.5 py-1.5 bg-[#141e14]/40 backdrop-blur-md border border-[#3D5A3D]/30 rounded-full transition-all shadow-lg ring-1 ring-white/5 cursor-pointer"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentUser}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-inner",
                    currentUser === 'khaled'
                      ? 'bg-gradient-to-br from-[#4A7C59] to-[#3D5A3D] text-white'
                      : 'bg-gradient-to-br from-[#90A955] to-[#6B8E4E] text-white'
                  )}
                >
                  {currentUser === 'khaled' ? 'K' : 'A'}
                </motion.div>
              </AnimatePresence>
              <span className="text-sm font-medium text-[#B8D4A8] capitalize pr-3 hidden sm:inline-block">
                {currentUser}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Bottom row: Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 relative z-50">
          {/* Omnibox Search */}
          <motion.div 
            ref={wrapperRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative flex-1 group"
          >
            <div className="absolute inset-0 bg-[#141e14]/40 backdrop-blur-md rounded-2xl border border-[#3D5A3D]/30 shadow-lg ring-1 ring-white/5 transition-colors group-focus-within:bg-[#141e14]/60 group-focus-within:border-[#90A955]/50" />
            
            <div className="relative flex items-center">
              {isSearchingGoogle ? (
                <Loader2 className="absolute left-3.5 w-4 h-4 text-[#90A955] animate-spin" />
              ) : (
                <Search className="absolute left-3.5 w-4 h-4 text-[#6B8E4E] transition-colors group-focus-within:text-[#90A955]" />
              )}
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search our world or find new places..."
                className="relative w-full pl-10 pr-4 py-3 bg-transparent text-[#E8F0E3] placeholder-[#6B8E4E]/60 focus:outline-none text-sm font-medium rounded-2xl"
              />
            </div>

            {/* Omni-Dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#0d1a0d]/95 backdrop-blur-xl border border-[#ffffff]/10 rounded-2xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto"
                >
                  {/* Local Results */}
                  {localMatches.length > 0 && (
                    <div className="p-2">
                      <h3 className="px-3 py-2 text-[10px] font-bold uppercase text-[#6B8E4E] tracking-wider sticky top-0 bg-[#0d1a0d]/95 backdrop-blur-xl z-10 flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> Our Collection
                      </h3>
                      <div className="space-y-1">
                        {localMatches.map(place => (
                          <button
                            key={place.id}
                            onClick={() => handleSelectLocal(place.id)}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#ffffff]/5 transition-colors group flex items-start gap-3"
                          >
                            <div className="mt-0.5 w-5 h-5 rounded-md bg-[#2d4a2d] flex items-center justify-center text-[#90A955]">
                              {place.status === 'favorite' ? <Sparkles className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-[#E8F0E3] group-hover:text-white transition-colors">
                                {place.name}
                              </div>
                              {place.address && (
                                <div className="text-xs text-[#ffffff]/40 line-clamp-1">{place.address}</div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  {localMatches.length > 0 && newDiscoveries.length > 0 && (
                    <div className="h-px bg-[#ffffff]/10 mx-2 my-1" />
                  )}

                  {/* Google Results */}
                  {newDiscoveries.length > 0 ? (
                    <div className="p-2">
                      <h3 className="px-3 py-2 text-[10px] font-bold uppercase text-[#90A955] tracking-wider sticky top-0 bg-[#0d1a0d]/95 backdrop-blur-xl z-10 flex items-center gap-2">
                        <Globe className="w-3 h-3" /> New Discoveries
                      </h3>
                      <div className="space-y-1">
                        {newDiscoveries.map(place => (
                          <div
                            key={place.id}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#ffffff]/5 transition-colors group"
                          >
                            <div className="flex items-start gap-3 overflow-hidden">
                              <div className="mt-0.5 w-5 h-5 rounded-md bg-[#ffffff]/5 flex items-center justify-center text-[#ffffff]/40">
                                <Globe className="w-3 h-3" />
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-[#E8F0E3] group-hover:text-white transition-colors truncate">
                                  {place.displayName}
                                </div>
                                <div className="text-xs text-[#ffffff]/40 line-clamp-1">
                                  {place.formattedAddress}
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleAddDiscovery(place)}
                              className="ml-2 p-1.5 rounded-lg bg-[#4A7C59] hover:bg-[#5a8c69] text-white shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0"
                              title="Add to Map"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : searchQuery.trim().length > 0 && isSearchingGoogle === false && localMatches.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-sm text-[#ffffff]/30 italic">No places found anywhere...</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Status filter */}
          <motion.div 
            className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide px-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {statusFilters.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={cn(
                  "px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shadow-lg backdrop-blur-sm cursor-pointer",
                  statusFilter === value
                    ? 'bg-[#4A7C59] text-white ring-1 ring-[#90A955]/50 shadow-[#4A7C59]/30 translate-y-[1px]'
                    : 'bg-[#141e14]/40 border border-[#3D5A3D]/30 text-[#90A955] hover:bg-[#3D5A3D]/20 hover:text-[#B8D4A8] ring-1 ring-white/5'
                )}
              >
                {label}
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    </header>
  )
}
