import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlaceWithRelations, PlaceStatus, Author } from '@/types/database'

interface AppState {
  // Current user (simple toggle for this private app)
  currentUser: Author
  setCurrentUser: (user: Author) => void

  // Places
  places: PlaceWithRelations[]
  setPlaces: (places: PlaceWithRelations[]) => void
  addPlace: (place: PlaceWithRelations) => void
  updatePlace: (id: string, updates: Partial<PlaceWithRelations>) => void
  removePlace: (id: string) => void

  // Selected place for detail panel
  selectedPlaceId: string | null
  setSelectedPlaceId: (id: string | null) => void

  // Filters
  statusFilter: PlaceStatus | 'all'
  setStatusFilter: (status: PlaceStatus | 'all') => void
  tagFilter: string[]
  setTagFilter: (tags: string[]) => void
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Map state
  mapCenter: [number, number]
  setMapCenter: (center: [number, number]) => void
  mapZoom: number
  setMapZoom: (zoom: number) => void

  // UI state
  isPanelOpen: boolean
  setIsPanelOpen: (open: boolean) => void
  isAddingPlace: boolean
  setIsAddingPlace: (adding: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Current user defaults to Khaled
      currentUser: 'khaled',
      setCurrentUser: (user) => set({ currentUser: user }),

      // Places
      places: [],
      setPlaces: (places) => set({ places }),
      addPlace: (place) => set((state) => ({ places: [...state.places, place] })),
      updatePlace: (id, updates) =>
        set((state) => ({
          places: state.places.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      removePlace: (id) =>
        set((state) => ({
          places: state.places.filter((p) => p.id !== id),
          selectedPlaceId: state.selectedPlaceId === id ? null : state.selectedPlaceId,
        })),

      // Selected place
      selectedPlaceId: null,
      setSelectedPlaceId: (id) => set({ selectedPlaceId: id, isPanelOpen: id !== null }),

      // Filters
      statusFilter: 'all',
      setStatusFilter: (status) => set({ statusFilter: status }),
      tagFilter: [],
      setTagFilter: (tags) => set({ tagFilter: tags }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Map state - default to somewhere beautiful
      mapCenter: [35.5, 33.9], // Lebanon
      setMapCenter: (center) => set({ mapCenter: center }),
      mapZoom: 8,
      setMapZoom: (zoom) => set({ mapZoom: zoom }),

      // UI state
      isPanelOpen: false,
      setIsPanelOpen: (open) => set({ isPanelOpen: open }),
      isAddingPlace: false,
      setIsAddingPlace: (adding) => set({ isAddingPlace: adding }),
    }),
    {
      name: 'eternal-hope-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        mapCenter: state.mapCenter,
        mapZoom: state.mapZoom,
      }),
    }
  )
)

// Selector helpers
export const useSelectedPlace = () => {
  const { places, selectedPlaceId } = useAppStore()
  return places.find((p) => p.id === selectedPlaceId) || null
}

export const useFilteredPlaces = () => {
  const { places, statusFilter, tagFilter, searchQuery } = useAppStore()

  return places.filter((place) => {
    // Status filter
    if (statusFilter !== 'all' && place.status !== statusFilter) {
      return false
    }

    // Tag filter
    if (tagFilter.length > 0) {
      const placeTags = place.tags?.map((t) => t.id) || []
      if (!tagFilter.some((t) => placeTags.includes(t))) {
        return false
      }
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = place.name.toLowerCase().includes(query)
      const matchesAddress = place.address?.toLowerCase().includes(query)
      const matchesTags = place.tags?.some((t) =>
        t.name.toLowerCase().includes(query)
      )
      const matchesVibeTags = place.ai_vibe_tags?.some((t) =>
        t.toLowerCase().includes(query)
      )
      if (!matchesName && !matchesAddress && !matchesTags && !matchesVibeTags) {
        return false
      }
    }

    return true
  })
}
