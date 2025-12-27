export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PlaceStatus = 'planned' | 'been_there' | 'favorite' | 'dream'
export type Author = 'khaled' | 'amal'

export interface Database {
  public: {
    Tables: {
      places: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          google_place_id: string
          google_maps_url: string
          name: string
          address: string | null
          latitude: number
          longitude: number
          status: PlaceStatus
          rating: number | null
          price_level: number | null
          types: string[] | null
          phone: string | null
          website: string | null
          opening_hours: Json | null
          raw_reviews: Json | null
          ai_summary: string | null
          ai_couple_insights: string | null
          ai_vibe_tags: string[] | null
          ai_poetic_description: string | null
          ai_general_description: string | null
          ai_processed_at: string | null
          photo_urls: string[] | null
          added_by: Author
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          google_place_id: string
          google_maps_url: string
          name: string
          address?: string | null
          latitude: number
          longitude: number
          status?: PlaceStatus
          rating?: number | null
          price_level?: number | null
          types?: string[] | null
          phone?: string | null
          website?: string | null
          opening_hours?: Json | null
          raw_reviews?: Json | null
          ai_summary?: string | null
          ai_couple_insights?: string | null
          ai_vibe_tags?: string[] | null
          ai_poetic_description?: string | null
          ai_general_description?: string | null
          ai_processed_at?: string | null
          photo_urls?: string[] | null
          added_by: Author
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          google_place_id?: string
          google_maps_url?: string
          name?: string
          address?: string | null
          latitude?: number
          longitude?: number
          status?: PlaceStatus
          rating?: number | null
          price_level?: number | null
          types?: string[] | null
          phone?: string | null
          website?: string | null
          opening_hours?: Json | null
          raw_reviews?: Json | null
          ai_summary?: string | null
          ai_couple_insights?: string | null
          ai_vibe_tags?: string[] | null
          ai_poetic_description?: string | null
          ai_general_description?: string | null
          ai_processed_at?: string | null
          photo_urls?: string[] | null
          added_by?: Author
        }
      }
      notes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          place_id: string
          author: Author
          content: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          place_id: string
          author: Author
          content: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          place_id?: string
          author?: Author
          content?: string
        }
      }
      tags: {
        Row: {
          id: string
          created_at: string
          name: string
          color: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          color?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          color?: string | null
        }
      }
      place_tags: {
        Row: {
          place_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          place_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          place_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          created_at: string
          place_id: string
          storage_path: string
          caption: string | null
          uploaded_by: Author
        }
        Insert: {
          id?: string
          created_at?: string
          place_id: string
          storage_path: string
          caption?: string | null
          uploaded_by: Author
        }
        Update: {
          id?: string
          created_at?: string
          place_id?: string
          storage_path?: string
          caption?: string | null
          uploaded_by?: Author
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      place_status: PlaceStatus
      author: Author
    }
  }
}

// Convenience types
export type Place = Database['public']['Tables']['places']['Row']
export type PlaceInsert = Database['public']['Tables']['places']['Insert']
export type PlaceUpdate = Database['public']['Tables']['places']['Update']

export type Note = Database['public']['Tables']['notes']['Row']
export type NoteInsert = Database['public']['Tables']['notes']['Insert']

export type Tag = Database['public']['Tables']['tags']['Row']
export type TagInsert = Database['public']['Tables']['tags']['Insert']

export type Photo = Database['public']['Tables']['photos']['Row']
export type PhotoInsert = Database['public']['Tables']['photos']['Insert']

// Extended types with relations
export interface PlaceWithRelations extends Place {
  notes?: Note[]
  tags?: Tag[]
  photos?: Photo[]
}
