import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          display_order: number
          total_rooms: number
          created_at: string
        }
      }
      rooms: {
        Row: {
          id: string
          title: string
          url: string
          category_id: string
          display_order: number
          created_at: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          room_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          room_id: string
          completed?: boolean
          completed_at?: string | null
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
        }
      }
    }
  }
}
