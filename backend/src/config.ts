import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT ?? 3000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL,
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
}

export const supabaseConfigured = Boolean(config.supabaseUrl && config.supabasePublishableKey && config.supabaseSecretKey)
