'use client'

import { useState, useRef, useEffect } from 'react'
import { useAppStore, useSelectedPlace } from '@/lib/store'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { cn } from '@/lib/utils'
import {
  X,
  MapPin,
  Star,
  Globe,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Send,
  Loader2,
  Heart,
  Map as MapIcon,
  Compass,
  Cloud,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react'
import type { PlaceStatus, Author, Note } from '@/types/database'

const statusConfig: Record<PlaceStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  planned: { label: 'Planned', icon: <Compass className="w-4 h-4" />, color: '#B8D4A8', bg: 'bg-[#6B8E4E]' },
  been_there: { label: 'Been There', icon: <MapIcon className="w-4 h-4" />, color: '#90A955', bg: 'bg-[#3D5A3D]' },
  favorite: { label: 'Favorite', icon: <Heart className="w-4 h-4 fill-current" />, color: '#E8F0E3', bg: 'bg-[#90A955]' },
  dream: { label: 'Dream', icon: <Cloud className="w-4 h-4" />, color: '#90A955', bg: 'bg-[#4A7C59]' },
}

const authorColors: Record<Author, { bg: string; border: string; text: string }> = {
  khaled: { bg: 'bg-[#2d4a2d]/30', border: 'border-[#4A7C59]/30', text: 'text-[#90A955]' },
  amal: { bg: 'bg-[#3d5a3d]/30', border: 'border-[#6B8E4E]/30', text: 'text-[#B8D4A8]' },
}

export default function PlacePanel() {
  const place = useSelectedPlace()
  const { isPanelOpen, setIsPanelOpen, setSelectedPlaceId, updatePlace, currentUser, removePlace } = useAppStore()

  const [newNote, setNewNote] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const notesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom of notes when added
  useEffect(() => {
    if (place?.notes?.length) {
      notesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [place?.notes?.length])

  // Reset image index when place changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [place?.id])

  // Close panel handler
  const handleClose = () => {
    setIsPanelOpen(false)
    setSelectedPlaceId(null)
  }

  const statusInfo = place ? statusConfig[place.status] : statusConfig['planned']
  const photos = place?.photo_urls || []
  const hasPhotos = photos.length > 0

  const handleStatusChange = async (newStatus: PlaceStatus) => {
    if (!place) return
    setIsStatusOpen(false)

    // Requirement: Must upload photo for 'been_there'
    if (newStatus === 'been_there' && place.status !== 'been_there') {
      toast('Upload a photo to mark as visited!', { icon: '📸' })
      fileInputRef.current?.click()
      return
    }

    const oldStatus = place.status
    // Optimistic update
    updatePlace(place.id, { status: newStatus })
    
    try {
      const response = await fetch(`/api/places/${place.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        toast.success(`Marked as ${statusConfig[newStatus].label}`)
        if (newStatus === 'favorite' || newStatus === 'been_there') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4A7C59', '#90A955', '#E8F0E3']
          })
        }
      } else {
        throw new Error('Failed')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      updatePlace(place.id, { status: oldStatus })
      toast.error('Failed to update status')
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !place) return

    const toastId = toast.loading('Uploading photo...')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('place_id', place.id)
    formData.append('author', currentUser)
    formData.append('caption', `At ${place.name}`)

    try {
      // 1. Upload
      const uploadRes = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      })
      
      if (!uploadRes.ok) throw new Error('Upload failed')
      
      const photoRecord = await uploadRes.json()
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${photoRecord.storage_path}`
      
      // 2. Update Place (Status + Photo URL)
      const newPhotoUrls = [publicUrl, ...(place.photo_urls || [])]
      
      // Optimistic
      updatePlace(place.id, { 
        status: 'been_there',
        photo_urls: newPhotoUrls
      })

      // Backend Patch
      const patchRes = await fetch(`/api/places/${place.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'been_there',
          photo_urls: newPhotoUrls
        }),
      })

      if (!patchRes.ok) throw new Error('Failed to update place')

      toast.success('Photo added & status updated!', { id: toastId })
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#4A7C59', '#90A955', '#E8F0E3']
      })

    } catch (error) {
      console.error('Photo upload error:', error)
      toast.error('Failed to upload photo', { id: toastId })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRefreshVibe = async () => {
    if (!place) return
    setIsRefreshing(true)
    const toastId = toast.loading('Reading the vibe...')
    try {
      const response = await fetch('/api/places/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeName: place.name,
          placeTypes: place.types,
          reviews: place.raw_reviews,
          existingNotes: place.notes?.map((n) => ({ author: n.author, content: n.content })),
          isRefresh: true,
        }),
      })

      if (response.ok) {
        const analysis = await response.json()
        const updateResponse = await fetch(`/api/places/${place.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ai_summary: analysis.summary,
            ai_couple_insights: analysis.coupleInsights,
            ai_vibe_tags: analysis.vibeTags,
            ai_poetic_description: analysis.poeticDescription,
            ai_general_description: analysis.generalDescription,
            ai_processed_at: new Date().toISOString(),
          }),
        })

        if (updateResponse.ok) {
          updatePlace(place.id, {
            ai_summary: analysis.summary,
            ai_couple_insights: analysis.coupleInsights,
            ai_vibe_tags: analysis.vibeTags,
            ai_poetic_description: analysis.poeticDescription,
            ai_general_description: analysis.generalDescription,
            ai_processed_at: new Date().toISOString(),
          })
          toast.success('Vibe refreshed!', { id: toastId })
        }
      }
    } catch (error) {
      console.error('Failed to refresh vibe:', error)
      toast.error('Could not read the vibe', { id: toastId })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleAddNote = async () => {
    if (!place || !newNote.trim()) return

    setIsSavingNote(true)
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: place.id,
          author: currentUser,
          content: newNote.trim(),
        }),
      })

      if (response.ok) {
        const savedNote = await response.json()
        updatePlace(place.id, {
          notes: [...(place.notes || []), savedNote],
        })
        setNewNote('')
        toast.success('Note added')
      }
    } catch (error) {
      console.error('Failed to add note:', error)
      toast.error('Failed to add note')
    } finally {
      setIsSavingNote(false)
    }
  }

  const handleDelete = async () => {
    if (!place || !confirm(`Delete "${place.name}"? This cannot be undone.`)) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/places/${place.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        removePlace(place.id)
        handleClose()
        toast.success('Place deleted')
      }
    } catch (error) {
      console.error('Failed to delete place:', error)
      toast.error('Failed to delete place')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AnimatePresence>
      {isPanelOpen && place && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={handleClose}
          />

          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-[480px] z-50 flex flex-col bg-[#0a120a]/80 backdrop-blur-2xl border-l border-[#ffffff]/5 shadow-2xl"
          >
        {/* Grain texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4A7C59]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#90A955]/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Photo Gallery - Cinematic */}
        <div className="relative h-72 group shrink-0 bg-black overflow-hidden">
          <AnimatePresence mode="wait">
            {hasPhotos ? (
              <motion.img
                key={currentImageIndex}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 0.9, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                src={photos[currentImageIndex]}
                alt={`${place.name} - Photo ${currentImageIndex + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#141e14] text-[#4A7C59]">
                <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium opacity-40">No photos yet</p>
              </div>
            )}
          </AnimatePresence>
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a120a] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent opacity-60" />

          {/* Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-md rounded-full text-white/90 hover:bg-black/50 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentImageIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 backdrop-blur-md rounded-full text-white/90 hover:bg-black/50 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {photos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "transition-all duration-300 rounded-full",
                      idx === currentImageIndex
                        ? 'w-6 h-1.5 bg-white'
                        : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {/* Close button - always visible on top of image */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2.5 bg-black/20 backdrop-blur-md rounded-full text-white/90 hover:bg-white hover:text-black transition-all z-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="p-6 md:p-8 space-y-8">

            {/* Header Info */}
            <div className="relative">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h2 className="text-3xl font-bold text-[#E8F0E3] leading-tight font-display tracking-tight break-words">
                  {place.name}
                </h2>
                {place.rating && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F5C518]/10 border border-[#F5C518]/20 rounded-full shrink-0">
                    <Star className="w-3.5 h-3.5 fill-[#F5C518] text-[#F5C518]" />
                    <span className="text-sm font-bold text-[#F5C518]">{place.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {place.address && (
                <p className="text-[#90A955] flex items-center gap-2 text-sm font-medium opacity-90 break-words">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="line-clamp-2">{place.address}</span>
                </p>
              )}

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap gap-2 mt-6">
                {/* Status Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 transition-all outline-none ring-offset-2 ring-offset-[#0d1a0d] focus:ring-2 focus:ring-[#90A955]/50 hover:bg-opacity-30",
                      statusInfo.bg, 
                      "bg-opacity-20"
                    )}
                    style={{ color: statusInfo.color }}
                  >
                    {statusInfo.icon}
                    <span className="text-sm font-bold tracking-wide">{statusInfo.label}</span>
                    <motion.div
                      animate={{ rotate: isStatusOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isStatusOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-[#141e14] border border-[#ffffff]/10 rounded-xl shadow-2xl overflow-hidden z-20"
                      >
                        {(Object.entries(statusConfig) as [PlaceStatus, typeof statusInfo][]).map(([key, config]) => (
                          <button
                            key={key}
                            onClick={() => handleStatusChange(key)}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 hover:bg-[#ffffff]/5 transition-colors",
                              place.status === key ? 'bg-[#ffffff]/5 text-white' : 'text-[#B8D4A8]'
                            )}
                          >
                            <div style={{ color: config.color }}>{config.icon}</div>
                            <span className="text-sm font-medium">{config.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {place.website && (
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#ffffff]/5 border border-[#ffffff]/5 rounded-xl text-[#E8F0E3] hover:bg-[#ffffff]/10 transition-all text-sm font-medium hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Globe className="w-4 h-4 text-[#90A955]" />
                    Website
                  </a>
                )}

                <a
                  href={place.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#ffffff]/5 border border-[#ffffff]/5 rounded-xl text-[#E8F0E3] hover:bg-[#ffffff]/10 transition-all text-sm font-medium hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ExternalLink className="w-4 h-4 text-[#90A955]" />
                  Maps
                </a>
              </div>
            </div>

            <hr className="border-[#ffffff]/5" />

            {/* AI Insights Section */}
            {(place.ai_summary || place.ai_couple_insights || place.ai_poetic_description || place.ai_general_description) && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B8E4E] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Our Vibe
                  </h3>
                  <button
                    onClick={handleRefreshVibe}
                    disabled={isRefreshing}
                    className="p-2 text-[#6B8E4E] hover:text-[#E8F0E3] hover:bg-[#ffffff]/5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                  </button>
                </div>

                {/* Poetic Quote */}
                {place.ai_poetic_description && (
                  <motion.blockquote 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative p-6 bg-[#1a2818]/40 border border-[#4A7C59]/20 rounded-2xl"
                  >
                    <div className="absolute top-4 left-4 text-[#4A7C59]/20 text-4xl font-serif">"</div>
                    <p className="relative z-10 text-[#CEDFBC] font-serif text-lg leading-relaxed italic text-center">
                      {place.ai_poetic_description}
                    </p>
                    <div className="absolute bottom-4 right-4 text-[#4A7C59]/20 text-4xl font-serif rotate-180">"</div>
                  </motion.blockquote>
                )}

                {/* Couple Insights */}
                {place.ai_couple_insights && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-5 bg-gradient-to-br from-[#4A7C59]/10 to-[#1a2818]/40 border border-[#4A7C59]/20 rounded-2xl flex gap-4"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-full bg-[#4A7C59]/20 flex items-center justify-center text-xl">
                      💚
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-[#90A955]">Why It's Perfect For Us</h4>
                      <p className="text-sm text-[#E8F0E3]/90 leading-relaxed">
                        {place.ai_couple_insights}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Tags */}
                {place.ai_vibe_tags && place.ai_vibe_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {place.ai_vibe_tags.map((tag, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 + (i * 0.05) }}
                        className="px-3 py-1.5 bg-[#ffffff]/5 border border-[#ffffff]/5 rounded-lg text-xs font-medium text-[#B8D4A8] hover:bg-[#ffffff]/10 hover:text-white transition-colors cursor-default"
                      >
                        #{tag}
                      </motion.span>
                    ))}
                  </div>
                )}

                {/* General Info */}
                {place.ai_general_description && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="prose prose-invert prose-sm max-w-none text-[#A0B896] bg-[#0d1a0d]/50 p-5 rounded-2xl border border-[#ffffff]/5"
                  >
                    {place.ai_general_description}
                  </motion.div>
                )}
              </div>
            )}

            {/* Notes Section */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B8E4E] flex items-center gap-2">
                  <span>Our Notes</span>
                  <span className="px-1.5 py-0.5 bg-[#ffffff]/5 rounded text-[10px] text-[#90A955]">
                    {place.notes?.length || 0}
                  </span>
                </h3>
              </div>

              {/* Note List */}
              <div className="space-y-3">
                <AnimatePresence>
                  {place.notes && place.notes.length > 0 ? (
                    place.notes.map((note: Note) => {
                      const colors = authorColors[note.author]
                      return (
                        <motion.div
                          key={note.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "group relative p-5 rounded-2xl border transition-all hover:scale-[1.01]",
                            colors.bg,
                            colors.border
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold uppercase",
                                note.author === 'khaled' ? 'bg-[#4A7C59] text-white' : 'bg-[#90A955] text-[#0d1a0d]'
                              )}>
                                {note.author[0]}
                              </div>
                              <span className={cn("text-xs font-bold uppercase tracking-wide", colors.text)}>
                                {note.author}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#ffffff]/30 font-medium">
                              {format(new Date(note.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <p className="text-sm text-[#E8F0E3] leading-relaxed whitespace-pre-wrap font-serif">
                            {note.content}
                          </p>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 border border-dashed border-[#ffffff]/10 rounded-2xl">
                      <p className="text-sm text-[#ffffff]/30 font-medium italic">No notes added yet...</p>
                    </div>
                  )}
                </AnimatePresence>
                <div ref={notesEndRef} />
              </div>

              {/* Add Note Input */}
              <div className="relative mt-4 group">
                <div className="absolute inset-0 bg-[#ffffff]/5 rounded-2xl blur-sm group-focus-within:bg-[#ffffff]/10 transition-colors" />
                <div className="relative">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder={`Write a note as ${currentUser}...`}
                    rows={1}
                    style={{ minHeight: '52px' }}
                    className="w-full pl-5 pr-14 py-4 bg-[#0d1a0d]/80 border border-[#ffffff]/10 rounded-2xl text-[#E8F0E3] placeholder-[#6B8E4E]/40 focus:outline-none focus:border-[#90A955]/50 focus:ring-1 focus:ring-[#90A955]/50 resize-y transition-all text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAddNote()
                      }
                    }}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || isSavingNote}
                    className="absolute bottom-2.5 right-2.5 p-2 bg-[#4A7C59] hover:bg-[#5a8c69] rounded-xl text-white transition-all disabled:opacity-0 disabled:translate-y-2 shadow-lg hover:shadow-[#4A7C59]/30 hover:-translate-y-0.5 cursor-pointer"
                  >
                    {isSavingNote ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-6 mt-8 border-t border-[#ffffff]/5">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-900/10 border border-red-500/10 rounded-xl text-red-400/80 hover:bg-red-900/20 hover:text-red-400 hover:border-red-500/20 transition-all text-sm font-medium disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Place
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      </>
      )}
    </AnimatePresence>
  )
}
