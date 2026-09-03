import type { FastifyInstance, FastifyRequest } from 'fastify'
import { supabaseAdmin, supabaseAuth } from '../lib/supabase.js'
import { config, supabaseConfigured } from '../config.js'
import type { AppRole, ProfileInput } from '../../../shared/types.js'

type ProfileBody = ProfileInput
const nullableText = (value?: string) => value?.trim() || null

function profileResponse(profile: Record<string, unknown>) {
  return {
    id: profile.id as string, email: profile.email as string | null,
    fullName: profile.full_name as string, accountType: profile.account_type as ProfileInput['accountType'],
    location: profile.location as string | null, bio: profile.bio as string | null, avatarUrl: profile.avatar_url as string | null,
    dateOfBirth: profile.date_of_birth as string | null, gender: profile.gender as string | null, nationality: profile.nationality as string | null,
    phoneNumber: profile.phone_number as string | null, nationalId: profile.national_id as string | null, emergencyContact: profile.emergency_contact as string | null,
    nextOfKinName: profile.next_of_kin_name as string | null, nextOfKinRelationship: profile.next_of_kin_relationship as string | null, nextOfKinPhone: profile.next_of_kin_phone as string | null, alternativeContact: profile.alternative_contact as string | null,
    professionalCategory: profile.professional_category as string | null, education: profile.education as string | null, previousEmployers: profile.previous_employers as string | null, previousJobLocations: profile.previous_job_locations as string | null, skillLevel: profile.skill_level as ProfileInput['skillLevel'] | null,
    availability: profile.availability as string | null, salaryExpectation: profile.salary_expectation as string | null, rateAmount: profile.rate_amount as number | null, ratePeriod: profile.rate_period as ProfileInput['ratePeriod'] | null, languages: profile.languages as string | null, professionalSkills: profile.professional_skills as string | null, preferredWorkLocation: profile.preferred_work_location as string | null,
    experienceYears: profile.experience_years as number | null, references: profile.references as string | null,
  }
}

async function authenticatedUser(request: FastifyRequest) {
  if (!supabaseAuth) return null
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await supabaseAuth.auth.getUser(token)
  return error ? null : data.user
}

export async function requireRole(request: FastifyRequest, roles: AppRole[]) {
  if (!supabaseConfigured || !supabaseAdmin) return { user: null, error: 'Supabase environment variables are not configured' as const }
  const user = await authenticatedUser(request)
  if (!user) return { user: null, error: 'Authentication required' as const }
  const { data, error } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
  if (error || !data || !roles.includes(data.role as AppRole)) return { user: null, error: 'Insufficient permissions' as const }
  return { user, error: null }
}

export async function profileRoutes(app: FastifyInstance) {
  app.get('/v1/roles/me', async (request, reply) => {
    if (!supabaseConfigured || !supabaseAdmin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const user = await authenticatedUser(request)
    if (!user) return reply.code(401).send({ error: 'Authentication required' })
    const { data, error } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (error) return reply.code(500).send({ error: error.message })
    return { role: data?.role ?? null }
  })

  app.post<{ Body: { userId: string; role: AppRole } }>('/v1/roles', async (request, reply) => {
    const admin = supabaseAdmin
    if (!admin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const access = await requireRole(request, ['administrator'])
    if (access.error) return reply.code(access.error === 'Authentication required' ? 401 : access.error === 'Supabase environment variables are not configured' ? 503 : 403).send({ error: access.error })
    if (!request.body?.userId || !['provider', 'client', 'assessor', 'administrator'].includes(request.body.role)) return reply.code(400).send({ error: 'userId and a valid role are required' })
    const { data, error } = await admin.from('user_roles').upsert({ user_id: request.body.userId, role: request.body.role, assigned_by: access.user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select().single()
    if (error) return reply.code(500).send({ error: error.message })
    await admin.from('audit_logs').insert({ actor_id: access.user.id, target_user_id: request.body.userId, action: 'ROLE_ASSIGNED', details: { role: request.body.role } })
    return data
  })

  app.post<{ Body: { email: string; role: 'assessor' | 'administrator' } }>('/v1/staff/invitations', async (request, reply) => {
    const admin = supabaseAdmin
    if (!admin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const access = await requireRole(request, ['administrator'])
    if (access.error) return reply.code(access.error === 'Authentication required' ? 401 : access.error === 'Supabase environment variables are not configured' ? 503 : 403).send({ error: access.error })
    const email = request.body?.email?.trim().toLowerCase()
    const role = request.body?.role
    if (!email || !/^\S+@\S+\.\S+$/.test(email) || !['assessor', 'administrator'].includes(role)) return reply.code(400).send({ error: 'A valid email and staff role (assessor or administrator) are required' })
    const existingUsers = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (existingUsers.error) return reply.code(502).send({ error: existingUsers.error.message })
    const existingUser = existingUsers.data.users.find((user) => user.email?.toLowerCase() === email)
    let replacedPendingInvite = false
    if (existingUser) {
      if (existingUser.email_confirmed_at) return reply.code(409).send({ error: 'This user already has an active account. Assign the staff role using the role management endpoint instead.' })
      const removed = await admin.auth.admin.deleteUser(existingUser.id)
      if (removed.error) return reply.code(502).send({ error: `Unable to resend invitation: ${removed.error.message}` })
      replacedPendingInvite = true
    }
    const invitation = await admin.auth.admin.inviteUserByEmail(email, { data: { account_type: role }, redirectTo: config.frontendOrigin })
    if (invitation.error || !invitation.data.user) return reply.code(502).send({ error: invitation.error?.message ?? 'Unable to create invitation' })
    const { error: roleError } = await admin.from('user_roles').upsert({ user_id: invitation.data.user.id, role, assigned_by: access.user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (roleError) return reply.code(500).send({ error: roleError.message })
    await admin.from('audit_logs').insert({ actor_id: access.user.id, target_user_id: invitation.data.user.id, action: 'STAFF_INVITED', details: { email, role, resent: replacedPendingInvite } })
    return reply.code(201).send({ userId: invitation.data.user.id, email, role, status: replacedPendingInvite ? 'resent' : 'invited' })
  })

  app.get('/v1/me', async (request, reply) => {
    if (!supabaseConfigured || !supabaseAdmin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const user = await authenticatedUser(request)
    if (!user) return reply.code(401).send({ error: 'Authentication required' })
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (error) return reply.code(500).send({ error: error.message })
    return { user: { id: user.id, email: user.email }, profile: profile ? profileResponse(profile as Record<string, unknown>) : null }
  })

  app.patch<{ Body: { storagePath?: string | null } }>('/v1/me/photo', async (request, reply) => {
    if (!supabaseConfigured || !supabaseAdmin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const admin = supabaseAdmin
    const user = await authenticatedUser(request)
    if (!user) return reply.code(401).send({ error: 'Authentication required' })
    const { data: profile, error: findError } = await admin.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
    if (findError) return reply.code(500).send({ error: findError.message })
    const storagePath = request.body?.storagePath ?? null
    if (storagePath && !storagePath.startsWith(`${user.id}/profile-`)) return reply.code(400).send({ error: 'Invalid profile photo path' })
    const { error } = await admin.from('profiles').update({ avatar_url: storagePath }).eq('id', user.id)
    if (error) return reply.code(500).send({ error: error.message })
    if (profile?.avatar_url) await admin.storage.from('provider-documents').remove([profile.avatar_url])
    return { avatarUrl: storagePath }
  })

  app.post<{ Body: ProfileBody }>('/v1/profiles', async (request, reply) => {
    if (!supabaseConfigured || !supabaseAdmin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const user = await authenticatedUser(request)
    if (!user) return reply.code(401).send({ error: 'Authentication required' })
    if (!request.body?.fullName?.trim() || !['client', 'provider', 'assessor', 'administrator'].includes(request.body.accountType))
      return reply
        .code(400)
        .send({ error: 'fullName and a valid accountType are required' })
    if (request.body.accountType === 'provider') {
      const requiredFields: (keyof ProfileBody)[] = ['dateOfBirth', 'nationality', 'phoneNumber', 'nationalId', 'nextOfKinName', 'nextOfKinRelationship', 'nextOfKinPhone', 'professionalCategory', 'education', 'availability', 'salaryExpectation', 'rateAmount', 'ratePeriod', 'languages', 'professionalSkills', 'skillLevel', 'preferredWorkLocation', 'references']
      const missing = requiredFields.filter((field) => !String(request.body[field] ?? '').trim())
      if (missing.length) return reply.code(400).send({ error: `Missing required provider fields: ${missing.join(', ')}` })
      if (!Number.isFinite(request.body.rateAmount) || Number(request.body.rateAmount) <= 0 || !['hour', 'day', 'month'].includes(request.body.ratePeriod ?? '')) return reply.code(400).send({ error: 'A positive rateAmount and a valid ratePeriod are required' })
    }
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email,
          full_name: request.body.fullName.trim(),
          account_type: request.body.accountType,
          location: nullableText(request.body.location),
          bio: nullableText(request.body.bio),
          ...(request.body.avatarUrl !== undefined ? { avatar_url: request.body.avatarUrl } : {}),
          date_of_birth: nullableText(request.body.dateOfBirth),
          gender: nullableText(request.body.gender),
          nationality: nullableText(request.body.nationality),
          phone_number: nullableText(request.body.phoneNumber),
          national_id: nullableText(request.body.nationalId),
          emergency_contact: nullableText(request.body.emergencyContact),
          next_of_kin_name: nullableText(request.body.nextOfKinName),
          next_of_kin_relationship: nullableText(request.body.nextOfKinRelationship),
          next_of_kin_phone: nullableText(request.body.nextOfKinPhone),
          alternative_contact: nullableText(request.body.alternativeContact),
          professional_category: nullableText(request.body.professionalCategory),
          education: nullableText(request.body.education),
          previous_employers: nullableText(request.body.previousEmployers),
          previous_job_locations: nullableText(request.body.previousJobLocations),
          availability: nullableText(request.body.availability),
          salary_expectation: nullableText(request.body.salaryExpectation),
          rate_amount: request.body.rateAmount ?? null,
          rate_period: request.body.ratePeriod ?? null,
          languages: nullableText(request.body.languages),
          professional_skills: nullableText(request.body.professionalSkills),
          skill_level: nullableText(request.body.skillLevel),
          preferred_work_location: nullableText(request.body.preferredWorkLocation),
          experience_years: request.body.experienceYears ?? null,
          references: nullableText(request.body.references),
        },
        { onConflict: 'id' },
      )
      .select()
      .single()
    if (error) return reply.code(500).send({ error: error.message })
    return reply.code(201).send(profileResponse(data as Record<string, unknown>))
  })
}
