import type { DocumentRecord, Notification, Opportunity, VerificationDocument } from '../../shared/types'
import { getAccessToken } from './api'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function get<T>(path: string): Promise<T> {
  const token = await getAccessToken()
  if (!token) throw new Error('Authentication required')
  let response: Response
  try {
    response = await fetch(`${apiUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    throw new Error('The account service is unavailable. Start the backend API on port 3000 and try again.')
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error ?? `Unable to load account data (${response.status})`)
  }
  return response.json() as Promise<T>
}

export const getDocuments = () => get<{ documents: DocumentRecord[] }>('/v1/documents')
export async function getProviders() {
  const response = await fetch(`${apiUrl}/v1/providers`)
  if (!response.ok) throw new Error(`Unable to load providers (${response.status})`)
  return response.json() as Promise<{ providers: { id: string; name: string; email: string | null; role: string; location: string; bio: string | null; experienceYears: number | null; rateAmount: number | null; ratePeriod: 'hour' | 'day' | 'month' | null; image: string | null; verified: boolean }[] }>
}
export const getVerificationDocuments = (status?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED') => get<{ documents: VerificationDocument[] }>(`/v1/verifications/documents${status ? `?status=${status}` : ''}`)
export async function verifyDocument(documentId: string, status: 'APPROVED' | 'REJECTED', reviewerNotes?: string) {
  const token = await getAccessToken()
  if (!token) throw new Error('Authentication required')
  const response = await fetch(`${apiUrl}/v1/verifications/documents/${documentId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reviewerNotes }),
  })
  if (!response.ok) throw new Error('Unable to verify document')
  return response.json() as Promise<DocumentRecord>
}
export async function replaceDocument(documentId: string, storagePath: string, fileName: string) {
  return updateDocument('/v1/documents/' + documentId, { storagePath, fileName })
}
export async function deleteDocument(documentId: string) {
  const token = await getAccessToken()
  if (!token) throw new Error('Authentication required')
  let response: Response
  try {
    response = await fetch(`${apiUrl}/v1/documents/${documentId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  } catch {
    throw new Error('The account service is unavailable. Start the backend API on port 3000 and try again.')
  }
  if (!response.ok) throw new Error('Unable to delete document')
}
async function updateDocument(path: string, body: { storagePath: string; fileName: string }) {
  const token = await getAccessToken()
  if (!token) throw new Error('Authentication required')
  let response: Response
  try {
    response = await fetch(`${apiUrl}${path}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch {
    throw new Error('The account service is unavailable. Start the backend API on port 3000 and try again.')
  }
  if (!response.ok) throw new Error('Unable to update document')
  return response.json() as Promise<DocumentRecord>
}
export const getOpportunities = () => get<{ opportunities: Opportunity[] }>('/v1/opportunities')
export const getInterviews = () => get<{ interviews: unknown[] }>('/v1/interviews')
export const getNotifications = () => get<{ notifications: Notification[] }>('/v1/notifications')