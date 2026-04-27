import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Wir definieren genau, was in der globalen Variable gespeichert wird
// Das verhindert den "Property auth does not exist" Fehler
interface GlobalSupabase {
  supabase: SupabaseClient | undefined
}

const globalForSupabase = globalThis as unknown as GlobalSupabase

export const supabase: SupabaseClient = 
  globalForSupabase.supabase || 
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Verhindert, dass mehrere Tabs/Instanzen sich um den Lock streiten
    storageKey: 'sb-auth-token-lock-fix',
    },
  })

// In der Entwicklung die Instanz global speichern, um Mehrfach-Clients zu verhindern
if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase
}