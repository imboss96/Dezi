import type { ProfileInput, ProfileRecord } from '../../shared/types'
import { supabase } from './supabase'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const body = await response.json() as T & { error?: string }
  if (!response.ok) throw new Error(body.error ?? 'Request failed')
  return body
}

export async function getAccessToken() {
  const session = await supabase?.auth.getSession()
  return session?.data.session?.access_token
}

export function getCurrentUserProfile() {
  return request<{ user: { id: string; email?: string }; profile: ProfileRecord | null }>('/v1/me')
}

export function saveCurrentUserProfile(profile: ProfileInput) {
  return request<ProfileRecord>('/v1/profiles', {
    method: 'POST',
    body: JSON.stringify(profile),
  })
}

export async function updateProfilePhoto(storagePath?: string) {
  return request<{ avatarUrl: string | null }>('/v1/me/photo', {
    method: 'PATCH',
    body: JSON.stringify({ storagePath: storagePath ?? null }),
  })
}
