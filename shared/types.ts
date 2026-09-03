export type AccountType = 'client' | 'provider' | 'assessor' | 'administrator'
export type AppRole = AccountType | 'assessor' | 'administrator'

export type ProfileInput = {
  fullName: string
  accountType: AccountType
  location?: string
  bio?: string
  avatarUrl?: string
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
  rateAmount?: number
  ratePeriod?: 'hour' | 'day' | 'month'
  languages?: string
  professionalSkills?: string
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  preferredWorkLocation?: string
  experienceYears?: number
  references?: string
}

export type ProfileRecord = ProfileInput & {
  id: string
  email: string | null
  createdAt?: string
  updatedAt?: string
}

export type LifecycleStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED'

export type Opportunity = {
  id: string
  title: string
  location: string
  description: string | null
  required_category: string | null
  status: string
  matches?: { match_score: number | null; status: string }[]
}

export type DocumentRecord = {
  id: string
  document_type: string
  file_name: string
  status: LifecycleStatus
  created_at: string
  storage_path?: string
  signed_url?: string
}

export type VerificationDocument = DocumentRecord & {
  provider_id: string
  reviewer_notes: string | null
  expires_at: string | null
  updated_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  profiles: { full_name: string; email: string | null; professional_category: string | null }
}

export type Notification = {
  id: string
  title: string
  body: string
  read_at: string | null
  created_at: string
}
