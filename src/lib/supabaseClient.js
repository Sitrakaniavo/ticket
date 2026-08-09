// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrlClient = import.meta.env.VITE_SUPABASE_URL_DIATSARA_CLIENT
const supabaseKeyClient = import.meta.env.VITE_SUPABASE_ANON_KEY_DIATSARA_CLIENT

export const supabaseClient = createClient(supabaseUrlClient, supabaseKeyClient)


const supabaseUrlMadarail = import.meta.env.VITE_SUPABASE_URL_DIATSARA_MADARAIL
const supabaseKeyMadarail = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY_DIATSARA_MADARAIL

export const supabaseMadarail = createClient(supabaseUrlMadarail, supabaseKeyMadarail)

