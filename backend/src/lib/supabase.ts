import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

export const supabaseAuth = createClient(
  config.supabaseUrl,
  config.supabasePublishableKey,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
)

export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseSecretKey,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
)
