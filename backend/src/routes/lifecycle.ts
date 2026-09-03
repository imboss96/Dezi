import type { FastifyInstance, FastifyRequest } from 'fastify'
import { supabaseAdmin, supabaseAuth } from '../lib/supabase.js'
import { supabaseConfigured } from '../config.js'
import { requireRole } from './profiles.js'

const verificationStatuses = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED'] as const
type VerificationStatus = typeof verificationStatuses[number]

async function currentUser(request: FastifyRequest) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!supabaseAuth || !token) return null
  const { data, error } = await supabaseAuth.auth.getUser(token)
  return error ? null : data.user
}

export async function lifecycleRoutes(app: FastifyInstance) {
  app.get('/v1/providers', async (_request, reply) => {
    const admin = supabaseAdmin
    if (!supabaseConfigured || !admin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const { data: approvedDocuments, error: documentsError } = await admin.from('documents').select('provider_id').eq('status', 'APPROVED')
    if (documentsError) return reply.code(500).send({ error: documentsError.message })
    const providerIds = [...new Set((approvedDocuments ?? []).map((document) => document.provider_id))]
    if (!providerIds.length) return { providers: [] }
    const { data: profiles, error } = await admin.from('profiles').select('id,full_name,email,location,bio,avatar_url,professional_category,experience_years,rate_amount,rate_period').eq('account_type', 'provider').in('id', providerIds).order('created_at', { ascending: false })
    if (error) return reply.code(500).send({ error: error.message })
    const providers = await Promise.all((profiles ?? []).map(async (profile) => {
      const signed = profile.avatar_url ? await admin.storage.from('provider-documents').createSignedUrl(profile.avatar_url, 3600) : null
      return { id: profile.id, name: profile.full_name, email: profile.email, role: profile.professional_category || 'Household professional', location: profile.location || 'Kenya', bio: profile.bio, experienceYears: profile.experience_years, rateAmount: profile.rate_amount, ratePeriod: profile.rate_period, image: signed?.data?.signedUrl ?? null, verified: true }
    }))
    return { providers }
  })

  app.get<{ Querystring: { status?: VerificationStatus } }>('/v1/verifications/documents', async (request, reply) => {
    const admin = supabaseAdmin
    if (!supabaseConfigured || !admin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const access = await requireRole(request, ['assessor', 'administrator'])
    if (access.error) return reply.code(access.error === 'Authentication required' ? 401 : access.error === 'Supabase environment variables are not configured' ? 503 : 403).send({ error: access.error })
    if (request.query.status && !verificationStatuses.includes(request.query.status)) return reply.code(400).send({ error: 'Invalid verification status' })

    let query = admin
      .from('documents')
      .select('id,provider_id,document_type,file_name,storage_path,status,reviewer_notes,expires_at,created_at,updated_at')
      .order('created_at', { ascending: true })
    query = request.query.status ? query.eq('status', request.query.status) : query.in('status', ['PENDING', 'UNDER_REVIEW'])
    const { data, error } = await query
    if (error) return reply.code(500).send({ error: error.message })
    const providerIds = [...new Set((data ?? []).map((document) => document.provider_id))]
    const { data: profiles, error: profilesError } = providerIds.length
      ? await admin.from('profiles').select('id,full_name,email,professional_category').in('id', providerIds)
      : { data: [], error: null }
    if (profilesError) return reply.code(500).send({ error: profilesError.message })
    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
    const documents = await Promise.all((data ?? []).map(async (document) => {
      const signed = await admin.storage.from('provider-documents').createSignedUrl(document.storage_path, 3600)
      return { ...document, profiles: profileById.get(document.provider_id) ?? { full_name: 'Unknown provider', email: null, professional_category: null }, signed_url: signed.data?.signedUrl ?? null }
    }))
    return { documents }
  })

  app.patch<{ Params: { id: string }; Body: { status: Exclude<VerificationStatus, 'PENDING' | 'UNDER_REVIEW' | 'EXPIRED'>; reviewerNotes?: string } }>('/v1/verifications/documents/:id', async (request, reply) => {
    const admin = supabaseAdmin
    if (!supabaseConfigured || !admin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const access = await requireRole(request, ['assessor', 'administrator'])
    if (access.error) return reply.code(access.error === 'Authentication required' ? 401 : access.error === 'Supabase environment variables are not configured' ? 503 : 403).send({ error: access.error })
    const status = request.body?.status
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) return reply.code(400).send({ error: 'status must be APPROVED or REJECTED' })
    if (status === 'REJECTED' && !request.body.reviewerNotes?.trim()) return reply.code(400).send({ error: 'reviewerNotes is required when rejecting a document' })

    const { data, error } = await admin
      .from('documents')
      .update({ status, reviewer_notes: request.body.reviewerNotes?.trim() || null, reviewed_by: access.user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', request.params.id)
      .in('status', ['PENDING', 'UNDER_REVIEW'])
      .select('id,provider_id,document_type,file_name,status,reviewer_notes,expires_at,created_at,updated_at,reviewed_by,reviewed_at')
      .maybeSingle()
    if (error) return reply.code(500).send({ error: error.message })
    if (!data) return reply.code(404).send({ error: 'Verification document not found or already reviewed' })
    const { error: auditError } = await admin.from('audit_logs').insert({ actor_id: access.user.id, target_user_id: data.provider_id, action: 'DOCUMENT_VERIFIED', details: { documentId: data.id, status, reviewerNotes: data.reviewer_notes } })
    if (auditError) return reply.code(500).send({ error: auditError.message })
    return data
  })

  app.get('/v1/documents', async (request, reply) => {
    if (!supabaseConfigured || !supabaseAdmin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const admin = supabaseAdmin
    const user = await currentUser(request)
    if (!user) return reply.code(401).send({ error: 'Authentication required' })
    const { data, error } = await supabaseAdmin.from('documents').select('id,document_type,file_name,storage_path,status,created_at').eq('provider_id', user.id).order('created_at', { ascending: false })
    if (error) return reply.code(500).send({ error: error.message })
    const latestDocuments = (data ?? []).filter((document, index, documents) => documents.findIndex((item) => item.document_type === document.document_type) === index)
    const documents = await Promise.all(latestDocuments.map(async (document) => {
      const signed = await admin.storage.from('provider-documents').createSignedUrl(document.storage_path, 3600)
      return { ...document, signed_url: signed.data?.signedUrl ?? null }
    }))
    return { documents }
  })

  app.patch<{ Params: { id: string }; Body: { storagePath: string; fileName: string } }>('/v1/documents/:id', async (request, reply) => {
    if (!supabaseConfigured || !supabaseAdmin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const admin = supabaseAdmin
    const user = await currentUser(request)
    if (!user) return reply.code(401).send({ error: 'Authentication required' })
    if (!request.body?.storagePath || !request.body.fileName) return reply.code(400).send({ error: 'storagePath and fileName are required' })
    if (!request.body.storagePath.startsWith(`${user.id}/`)) return reply.code(400).send({ error: 'Invalid document storage path' })
    const { data: existing, error: findError } = await admin.from('documents').select('storage_path').eq('id', request.params.id).eq('provider_id', user.id).maybeSingle()
    if (findError) return reply.code(500).send({ error: findError.message })
    if (!existing) return reply.code(404).send({ error: 'Document not found' })
    const { data, error } = await admin.from('documents').update({ storage_path: request.body.storagePath, file_name: request.body.fileName, status: 'PENDING' }).eq('id', request.params.id).eq('provider_id', user.id).select('id,document_type,file_name,storage_path,status,created_at').single()
    if (error) return reply.code(500).send({ error: error.message })
    await admin.storage.from('provider-documents').remove([existing.storage_path])
    const signed = await admin.storage.from('provider-documents').createSignedUrl(data.storage_path, 3600)
    return { ...data, signed_url: signed.data?.signedUrl ?? null }
  })

  app.delete<{ Params: { id: string } }>('/v1/documents/:id', async (request, reply) => {
    if (!supabaseConfigured || !supabaseAdmin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const admin = supabaseAdmin
    const user = await currentUser(request)
    if (!user) return reply.code(401).send({ error: 'Authentication required' })
    const { data: existing, error: findError } = await admin.from('documents').select('storage_path').eq('id', request.params.id).eq('provider_id', user.id).maybeSingle()
    if (findError) return reply.code(500).send({ error: findError.message })
    if (!existing) return reply.code(404).send({ error: 'Document not found' })
    const { error } = await admin.from('documents').delete().eq('id', request.params.id).eq('provider_id', user.id)
    if (error) return reply.code(500).send({ error: error.message })
    await admin.storage.from('provider-documents').remove([existing.storage_path])
    return reply.code(204).send()
  })

  app.get('/v1/opportunities', async (request, reply) => {
    if (!supabaseConfigured || !supabaseAdmin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    if (!await currentUser(request)) return reply.code(401).send({ error: 'Authentication required' })
    const { data, error } = await supabaseAdmin.from('opportunities').select('*, matches(match_score,status)').eq('status', 'OPEN').order('created_at', { ascending: false })
    if (error) return reply.code(500).send({ error: error.message })
    return { opportunities: data }
  })

  app.get('/v1/interviews', async (request, reply) => {
    if (!supabaseConfigured || !supabaseAdmin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const user = await currentUser(request)
    if (!user) return reply.code(401).send({ error: 'Authentication required' })
    const { data, error } = await supabaseAdmin.from('interviews').select('*, opportunities(title,location)').eq('provider_id', user.id).order('scheduled_at', { ascending: true })
    if (error) return reply.code(500).send({ error: error.message })
    return { interviews: data }
  })

  app.get('/v1/notifications', async (request, reply) => {
    if (!supabaseConfigured || !supabaseAdmin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const user = await currentUser(request)
    if (!user) return reply.code(401).send({ error: 'Authentication required' })
    const { data, error } = await supabaseAdmin.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (error) return reply.code(500).send({ error: error.message })
    return { notifications: data }
  })
}
