import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Same Supabase project as the web app → the same user account / user_id.
 * NOTE: Expo only inlines EXPO_PUBLIC_* vars when referenced with dot notation.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabase] missing EXPO_PUBLIC_SUPABASE_URL / ANON_KEY')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // No URL-based session detection on native (we handle deep links manually).
    detectSessionInUrl: false,
  },
})

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
