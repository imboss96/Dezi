import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

export const supabaseAuth = config.supabaseUrl && config.supabasePublishableKey
  ? createClient(config.supabaseUrl, config.supabasePublishableKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null

export const supabaseAdmin = config.supabaseUrl && config.supabaseSecretKey
  ? createClient(config.supabaseUrl, config.supabaseSecretKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null
