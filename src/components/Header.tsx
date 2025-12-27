'use client'

import { useAppStore, useFilteredPlaces } from '@/lib/store'
import { Plus, Search, User, Leaf } from 'lucide-react'
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
    setIsAddingPlace,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
  } = useAppStore()

  const filteredPlaces = useFilteredPlaces()

  const toggleUser = () => {
    setCurrentUser(currentUser === 'khaled' ? 'amal' : 'khaled')
  }

  return (
    <header className="relative z-30 pointer-events-none">
      {/* Background gradient for legibility */}
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#0a120a] via-[#0a120a]/80 to-transparent pointer-events-none" />

      <div className="relative px-4 py-4 sm:px-6 pointer-events-auto">
        {/* Top row: Logo and actions */}
        <div className="flex items-center justify-between mb-6">
          {/* Logo Card */}
          <div className="flex items-center gap-3 p-2 pr-4 bg-[#141e14]/40 backdrop-blur-md border border-[#3D5A3D]/30 rounded-2xl shadow-lg ring-1 ring-white/5">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B8E4E] to-[#4A7C59] flex items-center justify-center shadow-lg shadow-[#4A7C59]/20 group overflow-hidden">
              <Leaf className="w-5 h-5 text-white relative z-10" />
              <div className="absolute inset-0 bg-white/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#E8F0E3] tracking-tight leading-tight">
                Eternal Hope
              </h1>
              <p className="text-[10px] text-[#90A955] uppercase tracking-wider font-semibold">
                {filteredPlaces.length} {filteredPlaces.length === 1 ? 'Place' : 'Places'}
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* User toggle */}
            <button
              onClick={toggleUser}
              className="group relative flex items-center gap-2 px-1.5 py-1.5 bg-[#141e14]/40 backdrop-blur-md border border-[#3D5A3D]/30 rounded-full hover:bg-[#3D5A3D]/20 transition-all hover:scale-105 active:scale-95 shadow-lg ring-1 ring-white/5"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-inner transition-colors ${currentUser === 'khaled'
                  ? 'bg-gradient-to-br from-[#4A7C59] to-[#3D5A3D] text-white'
                  : 'bg-gradient-to-br from-[#90A955] to-[#6B8E4E] text-white'
                }`}>
                {currentUser === 'khaled' ? 'K' : 'A'}
              </div>
              <span className="text-sm font-medium text-[#B8D4A8] capitalize pr-3 hidden sm:inline-block">
                {currentUser}
              </span>
            </button>

            {/* Add place button */}
            <button
              onClick={() => setIsAddingPlace(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#E8F0E3] text-[#141e14] rounded-full font-bold hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(232,240,227,0.2)]"
            >
              <Plus className="w-4 h-4" strokeWidth={3} />
              <span className="hidden sm:inline">Add Place</span>
            </button>
          </div>
        </div>

        {/* Bottom row: Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-[#141e14]/40 backdrop-blur-md rounded-2xl border border-[#3D5A3D]/30 shadow-lg ring-1 ring-white/5 transition-colors group-focus-within:bg-[#141e14]/60 group-focus-within:border-[#90A955]/50" />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8E4E] transition-colors group-focus-within:text-[#90A955]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search places..."
              className="relative w-full pl-10 pr-4 py-3 bg-transparent text-[#E8F0E3] placeholder-[#6B8E4E]/60 focus:outline-none text-sm font-medium"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide px-1">
            {statusFilters.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shadow-lg backdrop-blur-sm ${statusFilter === value
                    ? 'bg-[#4A7C59] text-white ring-1 ring-[#90A955]/50 shadow-[#4A7C59]/30 translate-y-[1px]'
                    : 'bg-[#141e14]/40 border border-[#3D5A3D]/30 text-[#90A955] hover:bg-[#3D5A3D]/20 hover:text-[#B8D4A8] ring-1 ring-white/5'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
