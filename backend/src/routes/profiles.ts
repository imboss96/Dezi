import type { FastifyInstance, FastifyRequest } from 'fastify'
import { supabaseAdmin, supabaseAuth } from '../lib/supabase.js'
import { config, supabaseConfigured } from '../config.js'

type AccountType = 'client' | 'provider'
type AppRole = 'provider' | 'client' | 'assessor' | 'administrator'
type ProfileBody = {
  fullName: string
  accountType: AccountType
  location?: string
  bio?: string
  dateOfBirth?: string
  gender?: string
  nationality?: string
  phoneNumber?: string
  nationalId?: string
  emergencyContact?: string
  nextOfKinName?: string
  nextOfKinRelationship?: string
  nextOfKinPhone?: string
  alternativeContact?: string
  professionalCategory?: string
  education?: string
  previousEmployers?: string
  previousJobLocations?: string
  availability?: string
  salaryExpectation?: string
  languages?: string
  professionalSkills?: string
  preferredWorkLocation?: string
  experienceYears?: number
  references?: string
}

async function authenticatedUser(request: FastifyRequest) {
  if (!supabaseAuth) return null
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await supabaseAuth.auth.getUser(token)
  return error ? null : data.user
}

async function requireRole(request: FastifyRequest, roles: AppRole[]) {
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
    return { user: { id: user.id, email: user.email }, profile }
  })

  app.post<{ Body: ProfileBody }>('/v1/profiles', async (request, reply) => {
    if (!supabaseConfigured || !supabaseAdmin) return reply.code(503).send({ error: 'Supabase environment variables are not configured' })
    const user = await authenticatedUser(request)
    if (!user) return reply.code(401).send({ error: 'Authentication required' })
    if (
      !request.body?.fullName ||
      !['client', 'provider'].includes(request.body.accountType)
    )
      return reply
        .code(400)
        .send({ error: 'fullName and a valid accountType are required' })
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email,
          full_name: request.body.fullName,
          account_type: request.body.accountType,
          location: request.body.location ?? null,
          bio: request.body.bio ?? null,
          date_of_birth: request.body.dateOfBirth ?? null,
          gender: request.body.gender ?? null,
          nationality: request.body.nationality ?? null,
          phone_number: request.body.phoneNumber ?? null,
          national_id: request.body.nationalId ?? null,
          emergency_contact: request.body.emergencyContact ?? null,
          next_of_kin_name: request.body.nextOfKinName ?? null,
          next_of_kin_relationship: request.body.nextOfKinRelationship ?? null,
          next_of_kin_phone: request.body.nextOfKinPhone ?? null,
          alternative_contact: request.body.alternativeContact ?? null,
          professional_category: request.body.professionalCategory ?? null,
          education: request.body.education ?? null,
          previous_employers: request.body.previousEmployers ?? null,
          previous_job_locations: request.body.previousJobLocations ?? null,
          availability: request.body.availability ?? null,
          salary_expectation: request.body.salaryExpectation ?? null,
          languages: request.body.languages ?? null,
          professional_skills: request.body.professionalSkills ?? null,
          preferred_work_location: request.body.preferredWorkLocation ?? null,
          experience_years: request.body.experienceYears ?? null,
          references: request.body.references ?? null,
        },
        { onConflict: 'id' },
      )
      .select()
      .single()
    if (error) return reply.code(500).send({ error: error.message })
    return reply.code(201).send(data)
  })
}
