import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  CircleHelp,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  FileBadge2,
  FileCheck2,
  Heart,
  LayoutGrid,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Pencil,
  Search,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UsersRound,
  UserPlus,
  X,
} from 'lucide-react'
import { supabase } from './lib/supabase'
import { getCurrentUserProfile, saveCurrentUserProfile, updateProfilePhoto } from './lib/api'
import { deleteDocument, getDocuments, getProviders, getVerificationDocuments, replaceDocument, verifyDocument } from './lib/lifecycleApi'
import type { DocumentRecord, VerificationDocument } from '../shared/types'

const categories = [
  'All services',
  'Childcare',
  'Housekeeping',
  'Drivers',
  'Elder care',
  'Chefs',
]
type ProviderCard = {
  name: string
  role: string
  location: string
  rating: string
  reviews: number
  price: string
  image: string
  tag: string
}

type AccountType = 'client' | 'provider' | 'assessor' | 'administrator'
type AppRole = AccountType | 'assessor' | 'administrator'
type AccountWorkspace =
  | 'profile'
  | 'dashboard'
  | 'requests'
  | 'inbox'
  | 'saved'
  | 'opportunities'
  | 'academy'
  | 'certificates'
  | 'payments'
  | 'settings'
  | 'help'
  | 'verification'
  | 'staff'

type ProfileDetails = {
  fullName: string
  location: string
  bio: string
  dateOfBirth: string
  gender: string
  nationality: string
  phoneNumber: string
  nationalId: string
  emergencyContact: string
  nextOfKinName: string
  nextOfKinRelationship: string
  nextOfKinPhone: string
  alternativeContact: string
  professionalCategory: string
  education: string
  previousEmployers: string
  previousJobLocations: string
  availability: string
  salaryExpectation: string
  rateAmount: string
  ratePeriod: '' | 'hour' | 'day' | 'month'
  languages: string
  professionalSkills: string
  skillLevel: string
  preferredWorkLocation: string
  experienceYears: string
  references: string
}

const providerDocumentTypes = [
  { key: 'national_id', label: 'National ID or passport', accept: 'image/*,.pdf' },
  { key: 'cv', label: 'CV', accept: 'image/*,.pdf,.doc,.docx' },
  { key: 'good_conduct', label: 'Good Conduct Certificate', accept: 'image/*,.pdf' },
  { key: 'supporting', label: 'Training certificates or other documents', accept: 'image/*,.pdf,.doc,.docx' },
]

const accountWorkspaceContent: Record<
  AccountWorkspace,
  { title: string; description: string }
> = {
  profile: {
    title: 'Your profile',
    description:
      'Keep your details, availability, and professional information up to date.',
  },
  dashboard: {
    title: 'Your dashboard',
    description:
      'See your next steps, active work, and important account updates in one place.',
  },
  requests: {
    title: 'My service requests',
    description:
      'Review active requests, shortlisted providers, interviews, and placements.',
  },
  inbox: {
    title: 'Inbox',
    description:
      'Keep all client, provider, and Dezhub team conversations together.',
  },
  saved: {
    title: 'Saved providers',
    description:
      'Return to the professionals you have saved while deciding who to contact.',
  },
  opportunities: {
    title: 'My opportunities',
    description:
      'Track matches, interview invitations, and placement progress.',
  },
  academy: {
    title: 'Dezhub Academy',
    description:
      'Continue your courses, view training progress, and prepare for assessments.',
  },
  certificates: {
    title: 'My certificates',
    description: 'View and share your current Dezhub Academy certificates.',
  },
  payments: {
    title: 'Payments and billing',
    description:
      'Review invoices, payment status, and receipts for Dezhub services.',
  },
  settings: {
    title: 'Account settings',
    description:
      'Manage your personal details, notifications, password, and security preferences.',
  },
  help: {
    title: 'Help centre',
    description:
      'Get help with your account, safety, payments, and using Dezhub.',
  },
  verification: {
    title: 'Verification queue',
    description: 'Review provider documents and keep the trusted provider network moving.',
  },
  staff: {
    title: 'Staff management',
    description: 'Invite assessors and administrators to help operate Dezhub.',
  },
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.7-2.5l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.2 13.6a6 6 0 0 1 0-3.8V7.2H2.9a10 10 0 0 0 0 9l3.3-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 2.9 7.2l3.3 2.6C7 6.9 9.3 5.1 12 5.1Z"
      />
    </svg>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All services')
  const [query, setQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [listedProviders, setListedProviders] = useState<ProviderCard[]>([])
  const [notice, setNotice] = useState(true)
  const [authOpen, setAuthOpen] = useState(
    window.location.pathname === '/reset-password',
  )
  const [authMode, setAuthMode] = useState<
    'signin' | 'register' | 'forgot' | 'reset' | 'phone' | 'otp'
  >(window.location.pathname === '/reset-password' ? 'reset' : 'signin')
  const [accountType, setAccountType] = useState<AccountType>('client')
  const [roleSelected, setRoleSelected] = useState(false)
  const [currentRole, setCurrentRole] = useState<AppRole | null>(null)
  const [authMessage, setAuthMessage] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [accountName, setAccountName] = useState('Your Dezhub account')
  const [accountWorkspace, setAccountWorkspace] =
    useState<AccountWorkspace | null>(null)
  const [currentPage, setCurrentPage] = useState<'home' | 'profile' | 'dashboard' | 'verification'>(
    window.location.pathname === '/profile' ? 'profile' : window.location.pathname === '/verification' ? 'verification' : 'home',
  )
  const [selectedProvider, setSelectedProvider] = useState<ProviderCard | null>(null)
  const [activeNavTab, setActiveNavTab] = useState<'browse' | 'how' | 'academy'>('browse')
  const [profileDetails, setProfileDetails] = useState<ProfileDetails>({
    fullName: '',
    location: '',
    bio: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    phoneNumber: '',
    nationalId: '',
    emergencyContact: '',
    nextOfKinName: '',
    nextOfKinRelationship: '',
    nextOfKinPhone: '',
    alternativeContact: '',
    professionalCategory: '',
    education: '',
    previousEmployers: '',
    previousJobLocations: '',
    availability: '',
    salaryExpectation: '',
    rateAmount: '',
    ratePeriod: '',
    languages: '',
    professionalSkills: '',
    skillLevel: '',
    preferredWorkLocation: '',
    experienceYears: '',
    references: '',
  })
  const [profileMessage, setProfileMessage] = useState('')
  const [profileEditMode, setProfileEditMode] = useState(true)
  const [staffEmail, setStaffEmail] = useState('')
  const [staffRole, setStaffRole] = useState<'assessor' | 'administrator'>('assessor')
  const [staffMessage, setStaffMessage] = useState('')
  const [verificationDocuments, setVerificationDocuments] = useState<VerificationDocument[]>([])
  const [verificationMessage, setVerificationMessage] = useState('')
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [profilePromptVisible, setProfilePromptVisible] = useState(false)
  const [profileCompletionNeeded, setProfileCompletionNeeded] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('')
  const [profilePhotoActionsOpen, setProfilePhotoActionsOpen] = useState(false)
  const [documentFiles, setDocumentFiles] = useState<Record<string, File | null>>({})
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentRecord[]>([])
  const [documentActionMessage, setDocumentActionMessage] = useState('')
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const profilePhotoControlRef = useRef<HTMLDivElement>(null)
  const effectiveRole = currentRole ?? accountType
  const isProvider = effectiveRole === 'provider'
  useEffect(() => {
    void getProviders().then(({ providers }) => setListedProviders(providers.map((provider) => ({
      name: provider.name,
      role: provider.role,
      location: provider.location,
      rating: 'New',
      reviews: 0,
      image: provider.image ?? 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=85',
      tag: 'Verified provider',
      price: provider.rateAmount && provider.ratePeriod ? `KSh ${provider.rateAmount.toLocaleString()} / ${provider.ratePeriod}` : 'Rate available on request',
    })))).catch(() => setListedProviders([]))
  }, [])
  const servicesForListing = listedProviders
  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      const target = event.target as Node
      if (!accountMenuRef.current?.contains(target)) setAccountMenuOpen(false)
      if (!notificationsRef.current?.contains(target)) setNotificationsOpen(false)
      if (!profilePhotoControlRef.current?.contains(target)) setProfilePhotoActionsOpen(false)
    }
    const closeMenusOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false)
        setProfilePhotoActionsOpen(false)
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', closeMenus)
    document.addEventListener('keydown', closeMenusOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeMenus)
      document.removeEventListener('keydown', closeMenusOnEscape)
    }
  }, [])
  const loadProfilePhoto = useCallback(async (path: string | null | undefined) => {
    if (!path || !supabase) return
    const { data } = await supabase.storage
      .from('provider-documents')
      .createSignedUrl(path, 3600)
    if (data?.signedUrl) setProfilePhotoUrl(data.signedUrl)
  }, [])
  const loadSavedProfile = useCallback(async (userId: string) => {
    if (!supabase || !userId) return
    const { profile } = await getCurrentUserProfile()
    if (!profile) return
    setProfileDetails({
      fullName: profile.fullName ?? '', location: profile.location ?? '', bio: profile.bio ?? '',
      dateOfBirth: profile.dateOfBirth ?? '', gender: profile.gender ?? '', nationality: profile.nationality ?? '',
      phoneNumber: profile.phoneNumber ?? '', nationalId: profile.nationalId ?? '', emergencyContact: profile.emergencyContact ?? '',
      nextOfKinName: profile.nextOfKinName ?? '', nextOfKinRelationship: profile.nextOfKinRelationship ?? '', nextOfKinPhone: profile.nextOfKinPhone ?? '', alternativeContact: profile.alternativeContact ?? '',
      professionalCategory: profile.professionalCategory ?? '', education: profile.education ?? '', previousEmployers: profile.previousEmployers ?? '', previousJobLocations: profile.previousJobLocations ?? '', skillLevel: profile.skillLevel ?? '',
      availability: profile.availability ?? '', salaryExpectation: profile.salaryExpectation ?? '', rateAmount: profile.rateAmount?.toString() ?? '', ratePeriod: profile.ratePeriod ?? '', languages: profile.languages ?? '', professionalSkills: profile.professionalSkills ?? '', preferredWorkLocation: profile.preferredWorkLocation ?? '',
      experienceYears: profile.experienceYears?.toString() ?? '', references: profile.references ?? '',
    })
    setProfileEditMode(false)
    void loadProfilePhoto(profile.avatarUrl)
    try {
      const result = await getDocuments()
      setUploadedDocuments(result.documents)
    } catch {
      setUploadedDocuments([])
    }
  }, [loadProfilePhoto])
  const requiredProfileFields = [
    ['Full name', profileDetails.fullName],
    ['Date of birth', profileDetails.dateOfBirth],
    ['Nationality', profileDetails.nationality],
    ['Phone number', profileDetails.phoneNumber],
    ['National ID or passport number', profileDetails.nationalId],
    ['Next-of-kin name', profileDetails.nextOfKinName],
    ['Next-of-kin relationship', profileDetails.nextOfKinRelationship],
    ['Next-of-kin phone number', profileDetails.nextOfKinPhone],
    ['Professional category', profileDetails.professionalCategory],
    ['Education', profileDetails.education],
    ['Professional skills', profileDetails.professionalSkills],
    ['Skill level', profileDetails.skillLevel],
    ['Preferred work location', profileDetails.preferredWorkLocation],
    ['Availability', profileDetails.availability],
    ['Years of experience', profileDetails.experienceYears],
    ['Languages', profileDetails.languages],
    ['Expected salary', profileDetails.salaryExpectation],
    ['Rate amount', profileDetails.rateAmount],
    ['Rate period', profileDetails.ratePeriod],
    ['Professional references', profileDetails.references],
  ] as const
  const missingProfileFields = requiredProfileFields
    .filter(([, value]) => String(value).trim().length === 0)
    .map(([label]) => label)
  const profileFieldsComplete = missingProfileFields.length === 0
  const documentsComplete = providerDocumentTypes.every((document) => uploadedDocuments.some((uploaded) => uploaded.document_type === document.key))
  const journeyPercent = documentsComplete ? 100 : profileFieldsComplete ? 75 : 50
  const openProfileCompletion = () => {
    window.history.pushState({}, '', '/profile')
    setCurrentPage('profile')
    setProfilePromptVisible(false)
    setNotificationsOpen(false)
  }
  const editUploadedDocument = async (document: DocumentRecord, file: File | null) => {
    if (!file || !supabase) return
    setDocumentActionMessage('Updating document...')
    const path = `${(await supabase.auth.getUser()).data.user?.id}/document-${Date.now()}-${file.name}`
    const upload = await supabase.storage.from('provider-documents').upload(path, file, { upsert: false })
    if (upload.error) { setDocumentActionMessage(`Document update failed: ${upload.error.message}`); return }
    try {
      const updated = await replaceDocument(document.id, path, file.name)
      setUploadedDocuments((documents) => documents.map((item) => item.id === document.id ? updated : item))
      setEditingDocumentId(null)
      setDocumentActionMessage('Document updated successfully.')
    } catch (error) {
      await supabase.storage.from('provider-documents').remove([path])
      setDocumentActionMessage(error instanceof Error ? error.message : 'Unable to update document.')
    }
  }
  const changeProfilePhoto = async (file: File | null) => {
    if (!file || !supabase) return
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return
    setProfileMessage('Updating profile photo...')
    const path = `${user.id}/profile-${Date.now()}-${file.name}`
    const upload = await supabase.storage.from('provider-documents').upload(path, file, { upsert: false })
    if (upload.error) { setProfileMessage(`Profile photo upload failed: ${upload.error.message}`); return }
    try {
      await updateProfilePhoto(path)
      setProfilePhoto(file)
      setProfilePhotoUrl(URL.createObjectURL(file))
      setProfilePhotoActionsOpen(false)
      setProfileMessage('Profile photo updated successfully.')
    } catch (error) {
      await supabase.storage.from('provider-documents').remove([path])
      setProfileMessage(error instanceof Error ? error.message : 'Unable to update profile photo.')
    }
  }
  const removeProfilePhoto = async () => {
    if (!window.confirm('Remove your profile photo?')) return
    setProfileMessage('Removing profile photo...')
    try {
      await updateProfilePhoto()
      setProfilePhoto(null)
      setProfilePhotoUrl('')
      setProfilePhotoActionsOpen(false)
      setProfileMessage('Profile photo removed.')
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : 'Unable to remove profile photo.')
    }
  }
  const removeUploadedDocument = async (document: DocumentRecord) => {
    if (!window.confirm(`Delete ${document.file_name}? This cannot be undone.`)) return
    setDocumentActionMessage('Deleting document...')
    try {
      await deleteDocument(document.id)
      setUploadedDocuments((documents) => documents.filter((item) => item.id !== document.id))
      setDocumentActionMessage('Document deleted successfully.')
    } catch (error) {
      setDocumentActionMessage(error instanceof Error ? error.message : 'Unable to delete document.')
    }
  }
  const filteredServices = servicesForListing.filter(
    (service) =>
      `${service.name} ${service.role} ${service.location}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (activeCategory === 'All services' ||
        service.role
          .toLowerCase()
          .includes(activeCategory.slice(0, -1).toLowerCase())),
  )
  const toggleFavorite = (name: string) =>
    setFavorites((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    )
  const openAccount = () => {
    if (isAuthenticated) setAccountMenuOpen((open) => !open)
    else {
      setAuthMode('signin')
      setAuthOpen(true)
    }
  }
  const choosePublicRole = (role: AccountType) => {
    setAccountType(role)
    setRoleSelected(true)
  }
  const signOut = async () => {
    await supabase?.auth.signOut()
    setAccountMenuOpen(false)
    setAccountWorkspace(null)
  }
  const openAccountWorkspace = (workspace: AccountWorkspace) => {
    if (workspace === 'profile') {
      window.history.pushState({}, '', '/profile')
      setCurrentPage('profile')
      setAccountMenuOpen(false)
      return
    }
    if (workspace === 'verification') {
      window.history.pushState({}, '', '/verification')
      setCurrentPage('verification')
      void loadVerificationDocuments()
      setAccountMenuOpen(false)
      return
    }
    setAccountWorkspace(workspace)
    if (workspace === 'academy') setActiveNavTab('academy')
    setAccountMenuOpen(false)
    setCurrentPage(workspace === 'dashboard' ? 'dashboard' : 'home')
    window.setTimeout(() =>
      document
        .getElementById('account-workspace')
        ?.scrollIntoView({ behavior: 'smooth' }),
    )
  }
  const goHome = () => {
    window.history.pushState({}, '', '/')
    setCurrentPage('home')
    setAccountWorkspace(null)
    setSelectedProvider(null)
  }
  const inviteStaff = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStaffMessage('Sending invitation...')
    const session = await supabase?.auth.getSession()
    const token = session?.data.session?.access_token
    if (!token) { setStaffMessage('Please sign in as an administrator first.'); return }
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/v1/staff/invitations`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: staffEmail, role: staffRole }) })
      const result = await response.json() as { error?: string; status?: string }
      if (!response.ok) { setStaffMessage(result.error ?? 'Unable to send invitation.'); return }
      setStaffEmail('')
      setStaffMessage(`Invitation sent successfully. Status: ${result.status ?? 'invited'}.`)
    } catch { setStaffMessage('Backend unavailable. Start the API on port 3000 and try again.') }
  }
  const loadVerificationDocuments = async () => {
    setVerificationLoading(true)
    setVerificationMessage('')
    try {
      const result = await getVerificationDocuments()
      setVerificationDocuments(result.documents)
    } catch (error) {
      setVerificationMessage(error instanceof Error ? error.message : 'Unable to load verification queue.')
    } finally {
      setVerificationLoading(false)
    }
  }
  const reviewDocument = async (document: VerificationDocument, status: 'APPROVED' | 'REJECTED') => {
    const reviewerNotes = status === 'REJECTED' ? window.prompt('Add a reason for rejecting this document:')?.trim() : undefined
    if (status === 'REJECTED' && !reviewerNotes) return
    setVerificationMessage(`${status === 'APPROVED' ? 'Approving' : 'Rejecting'} ${document.file_name}...`)
    try {
      await verifyDocument(document.id, status, reviewerNotes)
      setVerificationDocuments((documents) => documents.filter((item) => item.id !== document.id))
      setVerificationMessage(`${document.file_name} marked ${status.toLowerCase()}.`)
    } catch (error) {
      setVerificationMessage(error instanceof Error ? error.message : 'Unable to update document verification.')
    }
  }
  useEffect(() => {
    if (currentPage === 'verification' && isAuthenticated && (currentRole === 'administrator' || currentRole === 'assessor')) void loadVerificationDocuments()
  }, [currentPage, isAuthenticated, currentRole])
  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) {
      setProfileMessage('Add your Supabase keys to save your profile.')
      return
    }
    if ((authMode === 'register' || authMode === 'phone') && !roleSelected) {
      setAuthMessage('Choose whether you need help or provide services before continuing.')
      return
    }
    const { data: userData, error: userError } = await supabase.auth.getUser()
    const user = userData.user
    if (userError || !user) {
      setProfileMessage('Please sign in before saving your profile.')
      return
    }
    if (!profileDetails.fullName.trim()) {
      setProfileMessage('Please add your full name.')
      return
    }
    if (isProvider && !profileFieldsComplete) {
      setProfileMessage(`Please complete: ${missingProfileFields.join(', ')}.`)
      return
    }
    let avatarUrl: string | null = null
    if (profilePhoto) {
      const path = `${user.id}/profile-${Date.now()}-${profilePhoto.name}`
      const upload = await supabase.storage.from('provider-documents').upload(path, profilePhoto, { upsert: false })
      if (upload.error) { setProfileMessage(`Profile photo upload failed: ${upload.error.message}`); return }
      avatarUrl = path
      setProfilePhotoUrl(URL.createObjectURL(profilePhoto))
    }
    try {
      await saveCurrentUserProfile({
        fullName: profileDetails.fullName.trim(), accountType: effectiveRole,
        location: profileDetails.location.trim(), bio: profileDetails.bio.trim(), avatarUrl: avatarUrl ?? undefined,
        dateOfBirth: profileDetails.dateOfBirth, gender: profileDetails.gender, nationality: profileDetails.nationality.trim(),
        phoneNumber: profileDetails.phoneNumber.trim(), nationalId: profileDetails.nationalId.trim(), emergencyContact: profileDetails.emergencyContact.trim(),
        nextOfKinName: profileDetails.nextOfKinName.trim(), nextOfKinRelationship: profileDetails.nextOfKinRelationship.trim(), nextOfKinPhone: profileDetails.nextOfKinPhone.trim(), alternativeContact: profileDetails.alternativeContact.trim(),
        professionalCategory: profileDetails.professionalCategory.trim(), education: profileDetails.education.trim(), previousEmployers: profileDetails.previousEmployers.trim(), previousJobLocations: profileDetails.previousJobLocations.trim(), skillLevel: profileDetails.skillLevel as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
        availability: profileDetails.availability.trim(), salaryExpectation: profileDetails.salaryExpectation.trim(), rateAmount: Number(profileDetails.rateAmount), ratePeriod: profileDetails.ratePeriod || undefined, languages: profileDetails.languages.trim(), professionalSkills: profileDetails.professionalSkills.trim(), preferredWorkLocation: profileDetails.preferredWorkLocation.trim(),
        experienceYears: profileDetails.experienceYears ? Number(profileDetails.experienceYears) : undefined, references: profileDetails.references.trim(),
      })
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : 'Unable to save your profile.')
      return
    }
    const pendingDocuments = providerDocumentTypes.flatMap((document) => {
      const file = documentFiles[document.key]
      return file ? [{ document, file }] : []
    })
    for (const { document, file } of pendingDocuments) {
      const path = `${user.id}/${document.key}-${Date.now()}-${file.name}`
      const upload = await supabase.storage.from('provider-documents').upload(path, file, { upsert: false })
      if (upload.error) { setProfileMessage(`Document upload failed: ${upload.error.message}`); return }
      const record = await supabase.from('documents').insert({ provider_id: user.id, document_type: document.key, file_name: file.name, storage_path: path, status: 'PENDING' })
      if (record.error) { setProfileMessage(`Document record failed: ${record.error.message}`); return }
    }
    if (pendingDocuments.length) {
      const refreshedDocuments = await getDocuments()
      setUploadedDocuments(refreshedDocuments.documents)
      setDocumentFiles({})
    }
    if (profilePhoto) setProfilePhoto(null)
    setAccountName(profileDetails.fullName.trim())
    setProfileCompletionNeeded([profileDetails.fullName, profileDetails.dateOfBirth, profileDetails.nationality, profileDetails.phoneNumber, profileDetails.nationalId, profileDetails.nextOfKinName, profileDetails.nextOfKinRelationship, profileDetails.nextOfKinPhone, profileDetails.professionalCategory, profileDetails.education, profileDetails.experienceYears, profileDetails.languages, profileDetails.professionalSkills, profileDetails.availability, profileDetails.preferredWorkLocation, profileDetails.salaryExpectation, profileDetails.rateAmount, profileDetails.ratePeriod, profileDetails.references].some((value) => !value))
    setProfilePromptVisible(false)
    setProfileEditMode(false)
    setProfileMessage(pendingDocuments.length ? 'Your profile and documents have been submitted for review.' : 'Your profile has been saved.')
  }
  const continueWithGoogle = async () => {
    if (authMode === 'register' && !roleSelected) {
      setAuthMessage('Choose whether you need help or provide services before continuing.')
      return
    }
    if (!supabase) {
      setAuthMessage(
        'Add your Supabase keys to .env.local to enable Google sign-in.',
      )
      return
    }
    window.localStorage.setItem('dezhub_pending_account_type', accountType)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) setAuthMessage(error.message)
  }
  useEffect(() => {
    const auth = supabase
    if (!auth) return
    auth.auth.getSession().then(({ data }) => {
      const user = data.session?.user
      if (user) {
        void loadSavedProfile(user.id)
        void auth.from('user_roles').select('role').eq('user_id', user.id).maybeSingle().then(async ({ data: roleData }) => {
          if (roleData?.role) setCurrentRole(roleData.role as AppRole)
          if (roleData?.role === 'provider') {
            const { data: profile } = await auth.from('profiles').select('avatar_url,full_name,date_of_birth,nationality,phone_number,national_id,next_of_kin_name,next_of_kin_relationship,next_of_kin_phone,professional_category,education,experience_years,languages,professional_skills,skill_level,availability,preferred_work_location,salary_expectation,references').eq('id', user.id).maybeSingle()
            void loadProfilePhoto(profile?.avatar_url)
            const incomplete = !profile || [profile.full_name, profile.date_of_birth, profile.nationality, profile.phone_number, profile.national_id, profile.next_of_kin_name, profile.next_of_kin_relationship, profile.next_of_kin_phone, profile.professional_category, profile.education, profile.experience_years, profile.languages, profile.professional_skills, profile.skill_level, profile.availability, profile.preferred_work_location, profile.salary_expectation, profile.references].some((value) => !value)
            setProfileCompletionNeeded(incomplete)
            setProfilePromptVisible(incomplete)
          }
        })
      } else {
        setCurrentRole(null)
      }
      const pendingAccountType = window.localStorage.getItem(
        'dezhub_pending_account_type',
      )
      if (
        user &&
        (pendingAccountType === 'client' || pendingAccountType === 'provider')
      ) {
        void auth.auth.updateUser({
          data: { account_type: pendingAccountType },
        })
        window.localStorage.removeItem('dezhub_pending_account_type')
      }
      setIsAuthenticated(Boolean(user))
      setAccountName(
        user?.user_metadata.full_name ?? user?.email ?? 'Your Dezhub account',
      )
      setAccountType(
        user?.user_metadata.account_type === 'provider' ? 'provider' : 'client',
      )
      setProfileDetails({
        fullName: user?.user_metadata.full_name ?? '',
        location: user?.user_metadata.location ?? '',
        bio: user?.user_metadata.bio ?? '',
        dateOfBirth: user?.user_metadata.date_of_birth ?? '',
        gender: user?.user_metadata.gender ?? '',
        nationality: user?.user_metadata.nationality ?? '',
        phoneNumber: user?.user_metadata.phone_number ?? '',
        nationalId: user?.user_metadata.national_id ?? '',
        emergencyContact: user?.user_metadata.emergency_contact ?? '',
        nextOfKinName: user?.user_metadata.next_of_kin_name ?? '',
        nextOfKinRelationship: user?.user_metadata.next_of_kin_relationship ?? '',
        nextOfKinPhone: user?.user_metadata.next_of_kin_phone ?? '',
        alternativeContact: user?.user_metadata.alternative_contact ?? '',
        professionalCategory: user?.user_metadata.professional_category ?? '',
        education: user?.user_metadata.education ?? '',
        previousEmployers: user?.user_metadata.previous_employers ?? '',
        previousJobLocations: user?.user_metadata.previous_job_locations ?? '',
        availability: user?.user_metadata.availability ?? '',
        salaryExpectation: user?.user_metadata.salary_expectation ?? '',
        rateAmount: user?.user_metadata.rate_amount?.toString() ?? '',
        ratePeriod: user?.user_metadata.rate_period ?? '',
        languages: user?.user_metadata.languages ?? '',
        professionalSkills: user?.user_metadata.professional_skills ?? '',
        skillLevel: user?.user_metadata.skill_level ?? '',
        preferredWorkLocation: user?.user_metadata.preferred_work_location ?? '',
        experienceYears: user?.user_metadata.experience_years?.toString() ?? '',
        references: user?.user_metadata.references ?? '',
      })
    })
    const { data: listener } = auth.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setAuthMode('reset')
          setAuthOpen(true)
        }
        const user = session?.user
        if (user) {
          void loadSavedProfile(user.id)
          void auth.from('user_roles').select('role').eq('user_id', user.id).maybeSingle().then(({ data: roleData }) => {
            setCurrentRole((roleData?.role as AppRole | undefined) ?? null)
            if (roleData?.role === 'provider') {
              void auth.from('profiles').select('avatar_url,full_name,date_of_birth,nationality,phone_number,national_id,next_of_kin_name,next_of_kin_relationship,next_of_kin_phone,professional_category,education,experience_years,languages,professional_skills,skill_level,availability,preferred_work_location,salary_expectation,references').eq('id', user.id).maybeSingle().then(({ data: profile }) => {
                void loadProfilePhoto(profile?.avatar_url)
                const incomplete = !profile || [profile.full_name, profile.date_of_birth, profile.nationality, profile.phone_number, profile.national_id, profile.next_of_kin_name, profile.next_of_kin_relationship, profile.next_of_kin_phone, profile.professional_category, profile.education, profile.experience_years, profile.languages, profile.professional_skills, profile.skill_level, profile.availability, profile.preferred_work_location, profile.salary_expectation, profile.references].some((value) => !value)
                setProfileCompletionNeeded(incomplete)
                setProfilePromptVisible(incomplete)
              })
            } else {
              setProfileCompletionNeeded(false)
            }
          })
        } else {
          setCurrentRole(null)
          setProfileCompletionNeeded(false)
          setProfilePromptVisible(false)
        }
        setIsAuthenticated(Boolean(user))
        setAccountName(
          user?.user_metadata.full_name ?? user?.email ?? 'Your Dezhub account',
        )
        setAccountType(
          user?.user_metadata.account_type === 'provider'
            ? 'provider'
            : 'client',
        )
        setProfileDetails({
          fullName: user?.user_metadata.full_name ?? '',
          location: user?.user_metadata.location ?? '',
          bio: user?.user_metadata.bio ?? '',
          dateOfBirth: user?.user_metadata.date_of_birth ?? '',
          gender: user?.user_metadata.gender ?? '',
          nationality: user?.user_metadata.nationality ?? '',
          phoneNumber: user?.user_metadata.phone_number ?? '',
          nationalId: user?.user_metadata.national_id ?? '',
          emergencyContact: user?.user_metadata.emergency_contact ?? '',
          nextOfKinName: user?.user_metadata.next_of_kin_name ?? '',
          nextOfKinRelationship: user?.user_metadata.next_of_kin_relationship ?? '',
          nextOfKinPhone: user?.user_metadata.next_of_kin_phone ?? '',
          alternativeContact: user?.user_metadata.alternative_contact ?? '',
          professionalCategory: user?.user_metadata.professional_category ?? '',
          education: user?.user_metadata.education ?? '',
          previousEmployers: user?.user_metadata.previous_employers ?? '',
          previousJobLocations: user?.user_metadata.previous_job_locations ?? '',
          availability: user?.user_metadata.availability ?? '',
          salaryExpectation: user?.user_metadata.salary_expectation ?? '',
          rateAmount: user?.user_metadata.rate_amount?.toString() ?? '',
          ratePeriod: user?.user_metadata.rate_period ?? '',
          languages: user?.user_metadata.languages ?? '',
          professionalSkills: user?.user_metadata.professional_skills ?? '',
          skillLevel: user?.user_metadata.skill_level ?? '',
          preferredWorkLocation: user?.user_metadata.preferred_work_location ?? '',
          experienceYears: user?.user_metadata.experience_years?.toString() ?? '',
          references: user?.user_metadata.references ?? '',
        })
      },
    )
    return () => listener.subscription.unsubscribe()
  }, [loadProfilePhoto, loadSavedProfile])
  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email'))
    const fullName = String(formData.get('fullName') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const phone = String(formData.get('phone') ?? '')
    const token = String(formData.get('token') ?? '')
    const newPassword = String(formData.get('newPassword') ?? '')
    const confirmPassword = String(formData.get('confirmPassword') ?? '')
    if (!supabase) {
      setAuthMessage(
        'Add your Supabase keys to .env.local to enable account access.',
      )
      return
    }
    if (authMode === 'reset' && newPassword !== confirmPassword) {
      setAuthMessage('Your new passwords do not match.')
      return
    }
    if (authMode === 'phone' && !/^\+[1-9]\d{7,14}$/.test(phone)) {
      setAuthMessage(
        'Enter your phone number in international format, for example +254712345678.',
      )
      return
    }
    if (authMode === 'otp' && !/^\d{6}$/.test(token)) {
      setAuthMessage('Enter the six-digit code sent to your phone.')
      return
    }
    const result =
      authMode === 'register'
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, account_type: accountType } },
          })
        : authMode === 'forgot'
          ? await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/reset-password`,
            })
          : authMode === 'reset'
            ? await supabase.auth.updateUser({ password: newPassword })
            : authMode === 'phone'
              ? await supabase.auth.signInWithOtp({
                  phone,
                  options: { data: { account_type: accountType } },
                })
              : authMode === 'otp'
                ? await supabase.auth.verifyOtp({
                    phone: phoneNumber,
                    token,
                    type: 'sms',
                  })
                : await supabase.auth.signInWithPassword({ email, password })
    setAuthMessage(
      result.error?.message ??
        (authMode === 'register'
          ? 'Check your email to confirm your Dezhub account.'
          : authMode === 'forgot'
            ? 'If that email exists, we sent a password reset link.'
            : authMode === 'reset'
              ? 'Your password was updated. You can now sign in.'
              : authMode === 'phone'
                ? 'We sent a six-digit verification code to your phone.'
                : authMode === 'otp'
                  ? 'Your phone number is verified. You are signed in.'
                  : 'You are signed in.'),
    )
    if (authMode === 'phone' && !result.error) {
      setPhoneNumber(phone)
      setAuthMode('otp')
    }
    if (authMode === 'otp' && !result.error) {
      setAuthOpen(false)
      setAuthMode('signin')
      setAuthMessage('')
    }
    if (authMode === 'reset' && !result.error) {
      window.history.replaceState({}, '', '/')
      setAuthMode('signin')
      setAuthMessage('')
      setAuthOpen(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <a className="brand-mark" href="/" onClick={(event) => { event.preventDefault(); goHome() }}>
            <span>de</span>zhub<span className="brand-dot">.</span>
          </a>
          <nav
            className={menuOpen ? 'main-nav nav-open' : 'main-nav'}
            aria-label="Main navigation"
          >
            <a className={activeNavTab === 'browse' ? 'active' : ''} href="/" onClick={(event) => { event.preventDefault(); setActiveNavTab('browse'); goHome() }}>
              Browse services
            </a>
            <a className={activeNavTab === 'how' ? 'active' : ''} href="/" onClick={(event) => { event.preventDefault(); setActiveNavTab('how'); goHome() }}>How it works</a>
                    <a className={activeNavTab === 'academy' ? 'active' : ''} href={isAuthenticated ? '/academy' : '/'} onClick={(event) => { event.preventDefault(); setActiveNavTab('academy'); if (isAuthenticated) openAccountWorkspace('academy'); else { setAuthMode('signin'); setAuthOpen(true) } }}>Dezhub Academy</a>
          </nav>
          <div className="header-actions">
            {!isAuthenticated && (
              <button
                className="sell-link"
                onClick={() => {
                  setAuthMode('register')
                  setAccountType('provider')
                  setRoleSelected(true)
                  setAuthOpen(true)
                }}
              >
                Become a provider
              </button>
            )}
            <div className="notifications-wrap" ref={notificationsRef}>
            <button className="icon-button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}>
              <Bell size={19} />
              {isAuthenticated && isProvider && profileCompletionNeeded && <i />}
            </button>
            {notificationsOpen && (
              <div className="notifications-menu" role="dialog" aria-label="Notifications">
                <div className="notifications-heading"><strong>Notifications</strong><span>{isAuthenticated && isProvider && profileCompletionNeeded ? '1 unread' : 'All caught up'}</span></div>
                {isAuthenticated && isProvider && profileCompletionNeeded ? (
                  <button className="notification-item" onClick={openProfileCompletion}>
                    <span className="notification-icon"><CircleUserRound size={16} /></span>
                    <span><strong>Complete your profile</strong><small>Add your details and documents to unlock more account features.</small></span>
                    <ChevronRight size={15} />
                  </button>
                ) : <p className="notifications-empty">You have no new notifications.</p>}
              </div>
            )}
            </div>
            <div className="account-menu-wrap" ref={accountMenuRef}>
              <button
                className="account-button"
                onClick={openAccount}
                aria-expanded={isAuthenticated ? accountMenuOpen : undefined}
                aria-haspopup={isAuthenticated ? 'menu' : undefined}
              >
                <CircleUserRound size={20} />
                <span>{isAuthenticated ? 'Account' : 'Sign in'}</span>
                <ChevronDown size={15} />
              </button>
              {isAuthenticated && accountMenuOpen && (
                <div
                  className="account-menu"
                  role="menu"
                  aria-label="Account menu"
                >
                  <button
                    className="account-summary"
                    onClick={() => openAccountWorkspace('profile')}
                  >
                    <span className="account-avatar">
                      {profilePhotoUrl ? <img src={profilePhotoUrl} alt="" /> : accountName.charAt(0).toUpperCase()}
                    </span>
                    <span>
                      <strong>{accountName}</strong>
                      <small>View your profile</small>
                    </span>
                    <ChevronRight size={16} />
                  </button>
                  <div className="account-menu-section">
                    <p>My Dezhub</p>
                    <button onClick={() => openAccountWorkspace('dashboard')}>
                      <LayoutDashboard size={16} /> Dashboard
                    </button>
                    <button onClick={() => openAccountWorkspace('inbox')}>
                      <MessageCircle size={16} /> Inbox <i>2</i>
                    </button>
                    {accountType === 'provider' ? (
                      <>
                        <button
                          onClick={() => openAccountWorkspace('opportunities')}
                        >
                          <BriefcaseBusiness size={16} /> My opportunities
                        </button>
                        <button onClick={() => openAccountWorkspace('academy')}>
                          <Sparkles size={16} /> Dezhub Academy
                        </button>
                        <button
                          onClick={() => openAccountWorkspace('certificates')}
                        >
                          <FileBadge2 size={16} /> My certificates
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => openAccountWorkspace('requests')}
                        >
                          <FileCheck2 size={16} /> My requests
                        </button>
                        <button onClick={() => openAccountWorkspace('saved')}>
                          <Heart size={16} /> Saved providers
                        </button>
                      </>
                    )}
                  </div>
                  <div className="account-menu-section">
                    <p>Account</p>
                    {(currentRole === 'administrator' || currentRole === 'assessor') && <button onClick={() => { openAccountWorkspace('verification'); void loadVerificationDocuments() }}><ShieldCheck size={16} /> Verification queue</button>}
                    {currentRole === 'administrator' && <button onClick={() => openAccountWorkspace('staff')}><UserPlus size={16} /> Invite staff</button>}
                    <button onClick={() => openAccountWorkspace('payments')}>
                      <CreditCard size={16} /> Payments and billing
                    </button>
                    <button onClick={() => openAccountWorkspace('settings')}>
                      <Settings size={16} /> Settings
                    </button>
                    <button onClick={() => openAccountWorkspace('help')}>
                      <CircleHelp size={16} /> Help centre
                    </button>
                  </div>
                  <button className="sign-out-button" onClick={signOut}>
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main id="top" className={currentPage === 'dashboard' ? 'dashboard-mode' : undefined}>
        {selectedProvider ? (
          <section className="provider-detail-page">
            <div className="provider-detail-inner">
              <button className="back-button" onClick={goHome}><ArrowLeft size={17} /> Browse services</button>
              <section className="provider-hero-card">
                <img className="provider-detail-photo" src={selectedProvider.image} alt={selectedProvider.name} />
                <div className="provider-detail-intro"><div className="provider-detail-title"><div><p className="eyebrow">Professional provider</p><h1>{selectedProvider.name}</h1><h2>{selectedProvider.role}</h2><p className="provider-detail-location">📍 {selectedProvider.location}</p></div><span className="verified-badge"><ShieldCheck size={15} /> Verified</span></div><div className="provider-detail-rating"><span><Star size={16} fill="currentColor" /> {selectedProvider.rating}</span><span>{selectedProvider.reviews} reviews</span><span>5 years experience</span></div><div className="provider-trust"><span><ShieldCheck size={14} /> Identity verified</span><span><FileBadge2 size={14} /> Dezhub certified</span></div><div className="provider-detail-actions"><button className="detail-primary">Request interview <ChevronRight size={15} /></button><button className="detail-secondary" onClick={() => toggleFavorite(selectedProvider.name)}><Heart size={15} fill={favorites.includes(selectedProvider.name) ? "currentColor" : "none"} /> {favorites.includes(selectedProvider.name) ? 'Shortlisted' : 'Shortlist'}</button></div></div>
              </section>
              <div className="provider-detail-grid">
                <section className="detail-section detail-about"><p className="eyebrow">About</p><p>{selectedProvider.name} is a {selectedProvider.role.toLowerCase()} with a thoughtful, reliable approach to supporting busy households. Clients can expect clear communication, professional conduct, and care tailored to their needs.</p></section>
                <section className="detail-section"><p className="eyebrow">Professional skills</p><div className="skill-tags"><span>Childcare</span><span>Infant care</span><span>First aid</span><span>Cooking</span><span>Housekeeping</span><span>Home safety</span></div></section>
                <section className="detail-section"><p className="eyebrow">Work experience</p><div className="experience-row"><strong>{selectedProvider.role.split(' ')[0]} - {selectedProvider.location.split(',')[0]}</strong><span>2022 - 2026</span></div><div className="experience-row"><strong>Household professional - Mombasa</strong><span>2020 - 2022</span></div></section>
                <section className="detail-section"><p className="eyebrow">Dezhub verification</p><div className="verification-grid"><span><ShieldCheck size={15} /> Identity</span><span><ShieldCheck size={15} /> References</span><span><ShieldCheck size={15} /> Assessment</span><span><ShieldCheck size={15} /> Training</span></div></section>
                <section className="detail-section assessment-section"><div><p className="eyebrow">Skills assessment</p><h2>Overall score: 91/100</h2></div><div className="assessment-bars"><span>Childcare <b>95</b></span><i><em style={{ width: '95%' }} /></i><span>Communication <b>90</b></span><i><em style={{ width: '90%' }} /></i><span>Professional conduct <b>94</b></span><i><em style={{ width: '94%' }} /></i></div></section>
                <section className="detail-section academy-section"><div><p className="eyebrow">Academy & certificates</p><h2><Sparkles size={17} /> Nanny professional training</h2><p>Certified · August 2026</p></div><button className="detail-secondary">View certificate <ChevronRight size={15} /></button></section>
                <section className="detail-section preference-section"><div><p className="eyebrow">Availability</p><h2 className="available-status"><span /> Available</h2><p>Start date: 15 September · Full-time</p></div><div><p className="eyebrow">Work preferences</p><p>Location: {selectedProvider.location}</p><p>Position: Nanny · Employment: Full-time</p></div></section>
                <section className="detail-section references-section"><div><p className="eyebrow">References</p><h2>2 professional references available</h2></div><button className="detail-secondary">Request information <ChevronRight size={15} /></button></section>
              </div>
              <section className="similar-section"><p className="eyebrow">Similar providers</p><div>{servicesForListing.filter((service) => service.name !== selectedProvider.name).slice(0, 3).map((service) => <button key={service.name} onClick={() => setSelectedProvider(service)}><img src={service.image} alt="" /><span>{service.name}</span></button>)}</div></section>
            </div>
          </section>
        ) : currentPage === 'verification' ? (
          <section className="verification-page">
            <div className="verification-page-inner">
              <button className="back-button" onClick={goHome}><ArrowLeft size={17} /> Back to Dezhub</button>
              <div className="verification-page-heading"><div><p className="eyebrow">Operations workspace</p><h1>Verification queue</h1><p>Review provider documents and keep the trusted provider network moving.</p></div><ShieldCheck size={38} /></div>
              {!isAuthenticated || (currentRole !== 'administrator' && currentRole !== 'assessor') ? <div className="verification-access-denied"><ShieldCheck size={22} /><h2>Staff access required</h2><p>Only assessors and administrators can review provider documents.</p></div> : <div className="verification-standalone-panel"><div className="verification-workspace-heading"><div><p className="eyebrow">Provider documents</p><h3>Documents awaiting your review</h3></div><button className="profile-edit-button" type="button" onClick={() => void loadVerificationDocuments()}><FileCheck2 size={15} /> Refresh</button></div>{verificationMessage && <p className="profile-message" role="status">{verificationMessage}</p>}{verificationLoading ? <p className="verification-empty">Loading verification queue...</p> : verificationDocuments.length === 0 ? <p className="verification-empty">No documents are waiting for review.</p> : <div className="verification-items">{verificationDocuments.map((document) => <article className="verification-item" key={document.id}><div className="verification-file"><FileCheck2 size={20} /><div><strong>{document.profiles.full_name}</strong><span>{document.profiles.professional_category || 'Provider'} · {document.profiles.email || 'No email'}</span><small>{document.document_type.replace(/_/g, ' ')} · {document.file_name}</small></div></div><div className="verification-item-actions">{document.signed_url && <a href={document.signed_url} target="_blank" rel="noreferrer">View document</a>}<button className="verification-approve" type="button" onClick={() => void reviewDocument(document, 'APPROVED')}><ShieldCheck size={14} /> Approve</button><button className="verification-reject" type="button" onClick={() => void reviewDocument(document, 'REJECTED')}>Reject</button></div></article>)}</div>}</div>}
            </div>
          </section>
        ) : currentPage === 'profile' ? (
          <section className="profile-page">
            <div className="profile-page-inner">
              <button className="back-button" onClick={goHome}>
                <ArrowLeft size={17} /> Back to Dezhub
              </button>
              <div className="profile-page-heading">
                <div className="profile-photo-control" ref={profilePhotoControlRef}>
                  <button className="profile-page-avatar" type="button" onClick={() => setProfilePhotoActionsOpen((open) => !open)} aria-label="Manage profile photo" aria-expanded={profilePhotoActionsOpen}>
                    {profilePhotoUrl ? <img src={profilePhotoUrl} alt="" /> : accountName.charAt(0).toUpperCase()}
                  </button>
                  {profilePhotoActionsOpen && <div className="profile-photo-actions"><label><span>Change photo</span><input type="file" accept="image/*" onChange={(event) => { void changeProfilePhoto(event.target.files?.[0] ?? null) }} /></label>{profilePhotoUrl && <button type="button" onClick={() => void removeProfilePhoto()}>Remove photo</button>}</div>}
                </div>
                <div>
                  <p className="eyebrow">My account</p>
                  <h1>Your profile</h1>
                  <p>
                    Complete these details to help Dezhub tailor your
                    experience.
                  </p>
                </div>
              </div>
              <div className="profile-layout">
                <aside className="profile-nav" aria-label="Profile navigation">
                  <strong>Account</strong>
                  <button className="active" onClick={() => openAccountWorkspace('profile')}>
                    <CircleUserRound size={16} /> Profile
                  </button>
                  <button
                    onClick={() => openAccountWorkspace('settings')}
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <button
                    onClick={() => openAccountWorkspace('payments')}
                  >
                    <CreditCard size={16} /> Payments and billing
                  </button>
                  <button
                    onClick={() => openAccountWorkspace('help')}
                  >
                    <CircleHelp size={16} /> Help centre
                  </button>
                </aside>
                <form className={profileEditMode ? 'profile-form' : 'profile-form profile-preview'} onSubmit={saveProfile}>
                  <div className="profile-form-heading">
                    <div>
                      <h2>Personal information</h2>
                      <p>
                        This is visible only where needed to operate your Dezhub
                        account.
                      </p>
                    </div>
                    <span className="profile-role">
                      {effectiveRole === 'provider'
                        ? 'Service provider'
                        : effectiveRole === 'assessor'
                          ? 'Assessor / Academy staff'
                          : effectiveRole === 'administrator'
                            ? 'Administrator'
                            : 'Client'}
                    </span>
                    {!profileEditMode && <button className="profile-edit-button" type="button" onClick={() => setProfileEditMode(true)}><Pencil size={14} /> Edit profile</button>}
                  </div>
                  <label>
                    Full name
                    <input
                      value={profileDetails.fullName}
                      onChange={(event) =>
                        setProfileDetails((details) => ({
                          ...details,
                          fullName: event.target.value,
                        }))
                      }
                      placeholder="Your full name"
                      required
                    />
                  </label>
                  <label>
                    Location
                    <input
                      value={profileDetails.location}
                      onChange={(event) =>
                        setProfileDetails((details) => ({
                          ...details,
                          location: event.target.value,
                        }))
                      }
                      placeholder="e.g. Nairobi, Kenya"
                    />
                  </label>
                  {isProvider && (
                    <div className="provider-fields">
                      <div className="profile-field-grid">
                        <label>Date of birth<input type="date" value={profileDetails.dateOfBirth} onChange={(event) => setProfileDetails((details) => ({ ...details, dateOfBirth: event.target.value }))} required /></label>
                        <label>Gender<select value={profileDetails.gender} onChange={(event) => setProfileDetails((details) => ({ ...details, gender: event.target.value }))}><option value="">Select gender</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></label>
                      </div>
                      <div className="profile-field-grid">
                        <label>Nationality<input value={profileDetails.nationality} onChange={(event) => setProfileDetails((details) => ({ ...details, nationality: event.target.value }))} placeholder="e.g. Kenyan" required /></label>
                        <label>Phone number<input type="tel" value={profileDetails.phoneNumber} onChange={(event) => setProfileDetails((details) => ({ ...details, phoneNumber: event.target.value }))} placeholder="+254..." required /></label>
                      </div>
                      <label>National ID or passport number<input value={profileDetails.nationalId} onChange={(event) => setProfileDetails((details) => ({ ...details, nationalId: event.target.value }))} placeholder="Enter your document number" required /></label>
                      <h3 className="profile-section-title">Next of kin</h3>
                      <div className="profile-field-grid"><label>Name<input value={profileDetails.nextOfKinName} onChange={(event) => setProfileDetails((details) => ({ ...details, nextOfKinName: event.target.value }))} required /></label><label>Relationship<input value={profileDetails.nextOfKinRelationship} onChange={(event) => setProfileDetails((details) => ({ ...details, nextOfKinRelationship: event.target.value }))} placeholder="e.g. Sister" required /></label></div>
                      <div className="profile-field-grid"><label>Phone number<input value={profileDetails.nextOfKinPhone} onChange={(event) => setProfileDetails((details) => ({ ...details, nextOfKinPhone: event.target.value }))} required /></label><label>Alternative contact<input value={profileDetails.alternativeContact} onChange={(event) => setProfileDetails((details) => ({ ...details, alternativeContact: event.target.value }))} /></label></div>
                      <h3 className="profile-section-title">Professional history</h3>
                      <label>Professional category<input value={profileDetails.professionalCategory} onChange={(event) => setProfileDetails((details) => ({ ...details, professionalCategory: event.target.value }))} placeholder="e.g. Nanny, housekeeper, driver" required /></label>
                      <label>Education<input value={profileDetails.education} onChange={(event) => setProfileDetails((details) => ({ ...details, education: event.target.value }))} placeholder="Highest education or training" required /></label>
                      <div className="profile-field-grid"><label>Previous employers<textarea rows={3} value={profileDetails.previousEmployers} onChange={(event) => setProfileDetails((details) => ({ ...details, previousEmployers: event.target.value }))} placeholder="Employer, role, and dates" /></label><label>Previous job locations<textarea rows={3} value={profileDetails.previousJobLocations} onChange={(event) => setProfileDetails((details) => ({ ...details, previousJobLocations: event.target.value }))} placeholder="Cities or countries" /></label></div>
                      <label>Professional skills<input value={profileDetails.professionalSkills} onChange={(event) => setProfileDetails((details) => ({ ...details, professionalSkills: event.target.value }))} placeholder="e.g. newborn care, cooking, first aid" required /></label>
                      <label>Skill level<select value={profileDetails.skillLevel} onChange={(event) => setProfileDetails((details) => ({ ...details, skillLevel: event.target.value }))} required><option value="">Select skill level</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Expert</option></select></label>
                      <label>Preferred work location<input value={profileDetails.preferredWorkLocation} onChange={(event) => setProfileDetails((details) => ({ ...details, preferredWorkLocation: event.target.value }))} placeholder="Where would you like to work?" required /></label>
                      <div className="profile-field-grid"><label>Availability<input value={profileDetails.availability} onChange={(event) => setProfileDetails((details) => ({ ...details, availability: event.target.value }))} placeholder="e.g. Full-time, weekdays" required /></label><label>Years of experience<input type="number" min="0" max="60" value={profileDetails.experienceYears} onChange={(event) => setProfileDetails((details) => ({ ...details, experienceYears: event.target.value }))} placeholder="e.g. 5" required /></label></div>
                      <div className="profile-field-grid"><label>Languages<input value={profileDetails.languages} onChange={(event) => setProfileDetails((details) => ({ ...details, languages: event.target.value }))} placeholder="e.g. English, Swahili" required /></label><label>Expected salary<input value={profileDetails.salaryExpectation} onChange={(event) => setProfileDetails((details) => ({ ...details, salaryExpectation: event.target.value }))} placeholder="e.g. KSh 60,000 per month" required /></label></div>
                      <div className="profile-field-grid"><label>Service rate (KSh)<input type="number" min="1" step="0.01" value={profileDetails.rateAmount} onChange={(event) => setProfileDetails((details) => ({ ...details, rateAmount: event.target.value }))} placeholder="e.g. 2500" required /></label><label>Rate period<select value={profileDetails.ratePeriod} onChange={(event) => setProfileDetails((details) => ({ ...details, ratePeriod: event.target.value as ProfileDetails['ratePeriod'] }))} required><option value="">Select rate period</option><option value="hour">Per hour</option><option value="day">Per day</option><option value="month">Per month</option></select></label></div>
                      <label>Professional references<textarea rows={4} value={profileDetails.references} onChange={(event) => setProfileDetails((details) => ({ ...details, references: event.target.value }))} placeholder="Names, roles, and contact details" required /></label>
                      <label className="file-input">Profile photo<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0] ?? null; setProfilePhoto(file); if (file) setProfilePhotoUrl(URL.createObjectURL(file)) }} /></label>
                      {uploadedDocuments.length < providerDocumentTypes.length && <div className="document-upload"><strong>Required documents</strong><span>Upload clear copies. Each document starts as pending review.</span>{providerDocumentTypes.filter((document) => !uploadedDocuments.some((uploaded) => uploaded.document_type === document.key)).map((document) => <label className="file-input" key={document.key}>{document.label}<input type="file" accept={document.accept} multiple={document.key === 'supporting'} onChange={(event) => setDocumentFiles((files) => ({ ...files, [document.key]: event.target.files?.[0] ?? null }))} /></label>)}</div>}
                      {uploadedDocuments.length > 0 && <div className="uploaded-documents"><div className="uploaded-documents-heading"><div><h3>Uploaded documents</h3><p>Your saved files are available below.</p></div><span>{uploadedDocuments.length} file{uploadedDocuments.length === 1 ? '' : 's'}</span></div>{documentActionMessage && <p className="document-action-message" role="status">{documentActionMessage}</p>}{uploadedDocuments.map((document) => <div className="uploaded-document" key={document.id}>{document.signed_url && /\.(png|jpe?g|gif|webp)$/i.test(document.file_name) ? <img src={document.signed_url} alt={document.file_name} /> : <span className="uploaded-document-file"><FileCheck2 size={21} /></span> }<div><strong>{providerDocumentTypes.find((item) => item.key === document.document_type)?.label ?? document.file_name}</strong><small>{document.file_name} · <em>{document.status.replace('_', ' ')}</em></small></div><div className="uploaded-document-actions">{document.signed_url && <a href={document.signed_url} target="_blank" rel="noreferrer">View</a>}<button type="button" onClick={() => setEditingDocumentId(editingDocumentId === document.id ? null : document.id)} aria-label={`Edit ${document.file_name}`}>Edit</button><button className="document-delete" type="button" onClick={() => void removeUploadedDocument(document)} aria-label={`Delete ${document.file_name}`}>Delete</button></div>{editingDocumentId === document.id && <label className="document-replace">Choose replacement<input type="file" accept={providerDocumentTypes.find((item) => item.key === document.document_type)?.accept} onChange={(event) => { void editUploadedDocument(document, event.target.files?.[0] ?? null) }} /></label>}</div>)}</div>}
                    </div>
                  )}
                  <label>
                    About you
                    <textarea
                      value={profileDetails.bio}
                      onChange={(event) =>
                        setProfileDetails((details) => ({
                          ...details,
                          bio: event.target.value,
                        }))
                      }
                      placeholder={
                        accountType === 'provider'
                          ? 'Tell clients about your experience and strengths.'
                          : 'Tell us what kind of help you are looking for.'
                      }
                      rows={5}
                    />
                  </label>
                  {profileMessage && (
                    <p className="profile-message">{profileMessage}</p>
                  )}
                  <button className={profileEditMode || Object.values(documentFiles).some(Boolean) ? 'profile-save' : 'profile-save profile-save-hidden'} type="submit">
                    <Save size={16} /> Save profile
                  </button>
                </form>
              </div>
            </div>
          </section>
        ) : (
          <>
            <section className="hero" id="browse">
              <div className="hero-inner">
                <div className="hero-copy">
                  <p className="eyebrow">A better way to find help</p>
                  <h1>
                    Find the people
                    <br />
                    <em>who make life easier.</em>
                  </h1>
                  <p>
                    Trusted care and home professionals, matched to your life
                    and ready to help.
                  </p>
                </div>
                <div className="search-box">
                  <Search size={21} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="What service are you looking for?"
                    aria-label="Search services"
                  />
                  <button
                    onClick={() =>
                      document
                        .getElementById('service-grid')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                  >
                    Search
                  </button>
                </div>
                <div className="popular-searches">
                  <span>Popular:</span>
                  <button onClick={() => setQuery('nanny')}>Nanny</button>
                  <button onClick={() => setQuery('cleaning')}>
                    House cleaning
                  </button>
                  <button onClick={() => setQuery('driver')}>
                    Family driver
                  </button>
                </div>
              </div>
            </section>
            <div className="content-wrap">
              {accountWorkspace && (
                <section
                  className="account-workspace"
                  id="account-workspace"
                  aria-live="polite"
                >
                  {accountWorkspace === 'dashboard' && isProvider ? (
                    <div className="provider-dashboard">
                      <div className="provider-dashboard-heading">
                        <div>
                          <p className="eyebrow">Your professional workspace</p>
                          <h1>Good morning, {accountName.split(' ')[0]}.</h1>
                          <p>Keep building your profile, skills, and opportunities on Dezhub.</p>
                        </div>
                        <div className="provider-dashboard-avatar">
                          {profilePhotoUrl ? <img src={profilePhotoUrl} alt="" /> : accountName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <section className="journey-panel" aria-labelledby="journey-title">
                        <div className="journey-heading"><div><p className="eyebrow">Your Dezhub journey</p><h2 id="journey-title">A few steps closer to your next opportunity</h2></div><strong>{journeyPercent}% <span>complete</span></strong></div>
                        <div className="journey-progress"><span style={{ width: `${journeyPercent}%` }} /></div>
                        <div className="journey-steps"><span className="journey-step done">✓ Account</span><span className="journey-step done">✓ Email</span><span className={profileFieldsComplete ? 'journey-step done' : 'journey-step'}>{profileFieldsComplete ? '✓' : '○'} Profile</span><span className={documentsComplete ? 'journey-step done' : 'journey-step'}>{documentsComplete ? '✓' : '○'} Documents</span></div>
                        <div className="next-step"><div><p className="eyebrow">Next step</p><strong>{!profileFieldsComplete ? 'Complete your professional profile' : !documentsComplete ? 'Upload your verification documents' : 'Your profile is ready for review'}</strong></div><button className="dashboard-primary" onClick={openProfileCompletion}>{documentsComplete ? 'View profile' : 'Continue'} <ChevronRight size={15} /></button></div>
                      </section>
                      <div className="dashboard-two-column">
                        <section className="dashboard-card"><div className="dashboard-card-heading"><p className="eyebrow">Your profile</p><CircleUserRound size={18} /></div><div className="dashboard-profile-summary"><div className="dashboard-profile-photo">{profilePhotoUrl ? <img src={profilePhotoUrl} alt="" /> : accountName.charAt(0).toUpperCase()}</div><div><strong>{accountName}</strong><span>{profileDetails.professionalCategory || 'Professional provider'}</span><span>{profileDetails.skillLevel ? `${profileDetails.skillLevel} level` : 'Add your skill level'}</span><span>{profileDetails.location || 'Add your location'}</span></div></div><button className="dashboard-link" onClick={() => openAccountWorkspace('profile')}>View profile <ChevronRight size={14} /></button></section>
                        <section className="dashboard-card"><div className="dashboard-card-heading"><p className="eyebrow">Verification</p><ShieldCheck size={18} /></div><div className="verification-list"><span className="verification-done">✓ <b>Email</b></span><span className="verification-done">✓ <b>Phone</b></span><span className="verification-pending">⏳ <b>ID</b><small>Under review</small></span><span className="verification-open">○ <b>Good conduct</b></span></div><button className="dashboard-link" onClick={openProfileCompletion}>View documents <ChevronRight size={14} /></button></section>
                      </div>
                      <section className="dashboard-card dashboard-learning"><div><p className="eyebrow">Dezhub Academy</p><h2>Nanny training</h2><p>Strengthen your skills and prepare for your next assessment.</p><div className="learning-progress"><span /></div><small>80% complete</small><button className="dashboard-link" onClick={() => openAccountWorkspace('academy')}>Continue course <ChevronRight size={14} /></button></div><div className="assessment"><p className="eyebrow">Skills assessment</p><strong>Not completed</strong><button className="dashboard-primary">Start assessment <ChevronRight size={15} /></button></div></section>
                      <section className="dashboard-card opportunities-card"><div className="dashboard-section-heading"><div><p className="eyebrow">Recommended opportunities</p><h2>Work that matches your profile</h2></div><button className="dashboard-link" onClick={() => openAccountWorkspace('opportunities')}>See all <ChevronRight size={14} /></button></div><div className="opportunity-row"><div><strong>Nanny</strong><span>Nairobi</span></div><b>94% match</b><button className="dashboard-link">View <ChevronRight size={14} /></button></div><div className="opportunity-row"><div><strong>Housekeeper</strong><span>Karen</span></div><b>88% match</b><button className="dashboard-link">View <ChevronRight size={14} /></button></div></section>
                      <div className="dashboard-two-column"><section className="dashboard-card"><p className="eyebrow">Upcoming interview</p><h2>Nanny - Runda</h2><p>8 Sep · 10:00 AM</p><button className="dashboard-primary">View interview <ChevronRight size={15} /></button></section><section className="dashboard-card"><p className="eyebrow">Your certificates</p><h2>Nanny training</h2><p className="certificate-status">Not yet issued</p><button className="dashboard-link" onClick={() => openAccountWorkspace('certificates')}>View certificates <ChevronRight size={14} /></button></section></div>
                    </div>
                  ) : <>
                  <div className="account-workspace-icon">
                    <CircleUserRound size={22} />
                  </div>
                  <div>
                    <h2>{accountWorkspaceContent[accountWorkspace].title}</h2>
                    <p>
                      {accountWorkspaceContent[accountWorkspace].description}
                    </p>
                    {accountWorkspace === 'dashboard' && isProvider && (
                      <section className="onboarding-checklist" aria-labelledby="onboarding-title">
                        <div className="onboarding-header">
                          <div>
                            <p className="eyebrow">New provider checklist</p>
                            <h3 id="onboarding-title">Build a profile that gets noticed</h3>
                            <p>Complete these steps to improve your chances of being matched with the right clients.</p>
                          </div>
                          <div className="onboarding-progress" aria-label={`${profileFieldsComplete ? 100 : 25}% complete`}>
                            <strong>{profileFieldsComplete ? 100 : 25}%</strong>
                            <span>complete</span>
                          </div>
                        </div>
                        <div className="onboarding-tasks">
                          <button className="onboarding-task task-complete" type="button">
                            <span className="task-marker">✓</span><span><strong>Create your account</strong><small>Your Dezhub account is ready.</small></span>
                          </button>
                          <button className="onboarding-task task-complete" type="button">
                            <span className="task-marker">✓</span><span><strong>Confirm your email address</strong><small>Your sign-in email is confirmed.</small></span>
                          </button>
                          <button className={profileFieldsComplete ? 'onboarding-task task-complete' : 'onboarding-task'} onClick={openProfileCompletion} type="button">
                            <span className="task-marker">{profileFieldsComplete ? '✓' : ''}</span><span><strong>Complete your profile</strong><small>{profileFieldsComplete ? 'Your professional details are complete.' : 'Add your details so clients can find and trust you.'}</small></span><ChevronRight size={15} />
                          </button>
                          <button className="onboarding-task" onClick={() => openAccountWorkspace('opportunities')} type="button">
                            <span className="task-marker" /><span><strong>Explore opportunities</strong><small>Find work that matches your skills and availability.</small></span><ChevronRight size={15} />
                          </button>
                          <button className="onboarding-task" onClick={() => openAccountWorkspace('academy')} type="button">
                            <span className="task-marker" /><span><strong>Take a course at the Academy</strong><small>Learn best practices and prepare for assessment.</small></span><ChevronRight size={15} />
                          </button>
                        </div>
                      </section>
                    )}
                    {accountWorkspace === 'academy' && (
                      <section className="academy-page" aria-labelledby="academy-title">
                        <div className="academy-page-hero"><div><p className="eyebrow">DEZHUB ACADEMY</p><h3 id="academy-title">Build skills that open doors.</h3><p>Practical learning for confident, trusted household professionals.</p></div><div className="academy-hero-mark"><Sparkles size={25} /><span>Learn · Practice · Grow</span></div></div>
                        <div className="academy-stats"><div><span>Current progress</span><strong>80%</strong><small>Across 1 course</small></div><div><span>Learning time</span><strong>4.5 hrs</strong><small>This month</small></div><div><span>Certificates</span><strong>0</strong><small>Complete a course to earn one</small></div></div>
                        <div className="academy-content-grid"><section className="academy-course-card"><div className="academy-card-top"><div><p className="eyebrow">CONTINUE LEARNING</p><h4>Professional household care</h4><p>Build a strong foundation in care, communication, and professional conduct.</p></div><span className="academy-course-icon"><Sparkles size={20} /></span></div><div className="academy-course-progress"><div><span>80% complete</span><b>8 of 10 lessons</b></div><div className="learning-progress"><span /></div></div><div className="academy-course-footer"><span><FileCheck2 size={15} /> 10 lessons</span><span><CircleHelp size={15} /> Beginner</span><button className="dashboard-primary" type="button">Continue course <ChevronRight size={15} /></button></div></section><aside className="academy-assessment-card"><p className="eyebrow">NEXT MILESTONE</p><h4>Skills assessment</h4><p>Test what you have learned when your course is complete.</p><div className="academy-assessment-status"><span className="academy-status-dot" /> Not started</div><button className="dashboard-link" type="button">View assessment <ChevronRight size={14} /></button></aside></div>
                        <div className="academy-lower-grid"><section><div className="academy-section-title"><div><p className="eyebrow">EXPLORE COURSES</p><h4>Learn at your pace</h4></div><button className="dashboard-link" type="button">View all <ChevronRight size={14} /></button></div><div className="academy-course-list"><article><span className="academy-list-icon coral"><Heart size={18} /></span><div><strong>Safe and thoughtful care</strong><small>6 lessons · 45 min</small></div><span className="academy-course-state">Start</span></article><article><span className="academy-list-icon teal"><MessageCircle size={18} /></span><div><strong>Professional communication</strong><small>5 lessons · 35 min</small></div><span className="academy-course-state">Start</span></article></div></section><section className="academy-certificate-card"><p className="eyebrow">YOUR CERTIFICATES</p><FileBadge2 size={22} /><h4>Earn your first certificate</h4><p>Complete your course and assessment to show clients what you know.</p><button className="dashboard-link" type="button" onClick={() => openAccountWorkspace('certificates')}>View certificates <ChevronRight size={14} /></button></section></div>
                      </section>
                    )}
                    {accountWorkspace === 'staff' && currentRole === 'administrator' && (
                      <form className="staff-invite-form" onSubmit={inviteStaff}>
                        <label>Staff email<input type="email" value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)} placeholder="colleague@example.com" required /></label>
                        <label>Staff role<select value={staffRole} onChange={(event) => setStaffRole(event.target.value as 'assessor' | 'administrator')}><option value="assessor">Assessor / Academy staff</option><option value="administrator">Administrator</option></select></label>
                        <button className="profile-save" type="submit"><UserPlus size={16} /> Send invitation</button>
                        {staffMessage && <p className="profile-message">{staffMessage}</p>}
                      </form>
                    )}
                    {accountWorkspace === 'verification' && (currentRole === 'administrator' || currentRole === 'assessor') && (
                      <div className="verification-workspace">
                        <div className="verification-workspace-heading"><div><p className="eyebrow">Provider documents</p><h3>Documents awaiting your review</h3></div><button className="profile-edit-button" type="button" onClick={() => void loadVerificationDocuments()}><FileCheck2 size={15} /> Refresh</button></div>
                        {verificationMessage && <p className="profile-message" role="status">{verificationMessage}</p>}
                        {verificationLoading ? <p className="verification-empty">Loading verification queue...</p> : verificationDocuments.length === 0 ? <p className="verification-empty">No documents are waiting for review.</p> : <div className="verification-items">{verificationDocuments.map((document) => <article className="verification-item" key={document.id}><div className="verification-file"><FileCheck2 size={20} /><div><strong>{document.profiles.full_name}</strong><span>{document.profiles.professional_category || 'Provider'} · {document.profiles.email || 'No email'}</span><small>{document.document_type.replace(/_/g, ' ')} · {document.file_name}</small></div></div><div className="verification-item-actions">{document.signed_url && <a href={document.signed_url} target="_blank" rel="noreferrer">View document</a>}<button className="verification-approve" type="button" onClick={() => void reviewDocument(document, 'APPROVED')}><ShieldCheck size={14} /> Approve</button><button className="verification-reject" type="button" onClick={() => void reviewDocument(document, 'REJECTED')}>Reject</button></div></article>)}</div>}
                      </div>
                    )}
                  </div>
                  <button
                    className="account-workspace-close"
                    onClick={() => accountWorkspace === 'dashboard' ? goHome() : setAccountWorkspace(null)}
                    aria-label="Close account area"
                  >
                    <X size={18} />
                  </button>
                  </>}
                </section>
              )}
              {accountWorkspace !== 'academy' && <>
              {notice && (!isAuthenticated || !isProvider) && (
                <div className="notice">
                  <Sparkles size={16} />
                  <span>
                    <strong>Welcome back, {accountName.split(' ')[0]}.</strong> Your team has {listedProviders.length} verified provider{listedProviders.length === 1 ? '' : 's'} to explore.
                  </span>
                  <button
                    onClick={() => setNotice(false)}
                    aria-label="Dismiss welcome message"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {isAuthenticated && isProvider && profilePromptVisible && (
                <div className="profile-completion-notice" role="status">
                  <div className="profile-completion-icon"><CircleUserRound size={18} /></div>
                  <div><strong>Complete your profile to unlock more account features.</strong><span>Add your professional details and documents so Dezhub can verify and match you.</span></div>
                  <button className="profile-completion-action" onClick={openProfileCompletion}>Unlock more features <ChevronRight size={15} /></button>
                  <button className="profile-completion-dismiss" onClick={() => setProfilePromptVisible(false)} aria-label="Dismiss profile completion notice"><X size={16} /></button>
                </div>
              )}
              <section className="category-bar" aria-label="Service categories">
                <div className="category-title">
                  <LayoutGrid size={18} />
                  <strong>Explore services</strong>
                </div>
                <div className="category-list">
                  {categories.map((category) => (
                    <button
                      className={
                        activeCategory === category
                          ? 'category active'
                          : 'category'
                      }
                      key={category}
                      onClick={() => setActiveCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </section>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Curated for you</p>
                  <h2>Popular services</h2>
                </div>
                <div className="heading-actions">
                  <button className="filter-button">
                    <SlidersHorizontal size={16} /> Filters
                  </button>
                  <button className="sort-button">
                    Sort: Recommended <ChevronDown size={15} />
                  </button>
                </div>
              </div>
              <section className="marketplace-layout" id="service-grid">
                <div className="service-grid">
                  {filteredServices.map((service) => (
                    <article className="service-card" key={service.name} onClick={() => setSelectedProvider(service)} tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedProvider(service) }}>
                      <div className="service-image">
                        <img
                          src={service.image}
                          alt={`${service.role} by ${service.name}`}
                        />
                        <span className="service-tag">
                          <ShieldCheck size={13} /> {service.tag}
                        </span>
                        <button
                          className={
                            favorites.includes(service.name)
                              ? 'favorite active'
                              : 'favorite'
                          }
                          onClick={(event) => { event.stopPropagation(); toggleFavorite(service.name) }}
                          aria-label={`Save ${service.name}`}
                        >
                          <Heart
                            size={18}
                            fill={
                              favorites.includes(service.name)
                                ? 'currentColor'
                                : 'none'
                            }
                          />
                        </button>
                      </div>
                      <div className="service-body">
                        <div className="provider-line">
                          <div className="avatar">
                            {service.name
                              .split(' ')
                              .map((part) => part[0])
                              .join('')}
                          </div>
                          <span>{service.name}</span>
                          <ShieldCheck className="verified" size={14} />
                        </div>
                        <h3>{service.role}</h3>
                        <p className="location">{service.location}</p>
                        <div className="service-meta">
                          <span>
                            <Star size={14} fill="currentColor" />{' '}
                            <strong>{service.rating}</strong>{' '}
                            <small>({service.reviews})</small>
                          </span>
                          <strong>{service.price}</strong>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <aside className="activity-panel">
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">{currentRole === 'administrator' || currentRole === 'assessor' ? 'Operations workspace' : 'Your workspace'}</p>
                      <h2>{currentRole === 'administrator' || currentRole === 'assessor' ? 'Review and support providers' : 'Keep things moving'}</h2>
                    </div>
                    <button className="icon-button">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  {currentRole === 'administrator' || currentRole === 'assessor' ? <>
                    <div className="activity-item">
                      <div className="activity-icon coral"><UsersRound size={17} /></div>
                      <div><strong>12 pending providers to review</strong><span>New profiles are waiting for verification</span></div>
                      <ChevronRight size={16} />
                    </div>
                    <div className="activity-item">
                      <div className="activity-icon teal"><FileCheck2 size={17} /></div>
                      <div><strong>8 documents need review</strong><span>Check identity and conduct certificates</span></div>
                      <ChevronRight size={16} />
                    </div>
                  </> : <>
                  <div className="activity-item">
                    <div className="activity-icon coral"><UsersRound size={17} /></div>
                    <div><strong>{effectiveRole === 'provider' ? '3 opportunities to explore' : '12 providers to review'}</strong><span>{effectiveRole === 'provider' ? 'Matches for your skills are waiting' : 'New profiles are waiting'}</span></div>
                    <ChevronRight size={16} />
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon teal"><BriefcaseBusiness size={17} /></div>
                    <div><strong>{effectiveRole === 'provider' ? '1 upcoming interview' : '4 open requests'}</strong><span>{effectiveRole === 'provider' ? 'Prepare for your next conversation' : 'One needs your attention'}</span></div>
                    <ChevronRight size={16} />
                  </div>
                  </>}
                  <div className="academy-strip">
                    <div className="academy-icon">
                      <Sparkles size={17} />
                    </div>
                    <div>
                      <p>DEZHUB ACADEMY</p>
                      <strong>{currentRole === 'administrator' || currentRole === 'assessor' ? '8 learners are in progress' : effectiveRole === 'provider' ? 'Continue your training' : 'Explore trusted providers'}</strong>
                      <button id="academy" onClick={() => isAuthenticated ? openAccountWorkspace('academy') : setAuthOpen(true)}>
                        Open popular courses <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="panel-footer">
                    <FileCheck2 size={16} />
                    <span>7 placements this month</span>
                    <strong>86%</strong>
                  </div>
                </aside>
              </section>
              {filteredServices.length === 0 && (
                <div className="empty-state">
                  No providers match that search yet. Try “nanny”, “cleaning”,
                  or “driver”.
                </div>
              )}
              </>}
            </div>
            <footer className="site-footer">
              <div className="footer-inner">
                {!isAuthenticated && <div className="footer-cta">
                  <div>
                    <p className="eyebrow">Have a skill to share?</p>
                    <h2>
                      Build your work around
                      <br />
                      the life you want.
                    </h2>
                  </div>
                  <button
                    className="footer-cta-button"
                    onClick={() => {
                      setAuthMode('register')
                      setAccountType('provider')
                      setRoleSelected(true)
                      setAuthOpen(true)
                    }}
                  >
                    Become a provider <ChevronRight size={16} />
                  </button>
                </div>}
                <div className="footer-links">
                  <div className="footer-brand">
                    <a className="brand-mark" href="#top">
                      <span>de</span>zhub<span className="brand-dot">.</span>
                    </a>
                    <p>
                      Trusted people for the work
                      <br />
                      that makes life better.
                    </p>
                  </div>
                  <div>
                    <strong>Discover</strong>
                    <a href="#browse">Browse services</a>
                    <a href="#how-it-works">How it works</a>
                    <a href="#academy">Dezhub Academy</a>
                  </div>
                  <div>
                    <strong>For providers</strong>
                    <a href="#provider">Join Dezhub</a>
                    <a href="#provider">Provider resources</a>
                    <a href="#provider">Community</a>
                  </div>
                  <div>
                    <strong>Support</strong>
                    <a href="#support">Help centre</a>
                    <a href="#support">Safety and trust</a>
                    <a href="#support">Contact us</a>
                  </div>
                </div>
                <div className="footer-bottom">
                  <span>© 2026 Dezhub. Care, matched thoughtfully.</span>
                  <div>
                    <a href="#privacy">Privacy</a>
                    <a href="#terms">Terms</a>
                    <span className="status">
                      <i /> All systems operational
                    </span>
                  </div>
                </div>
              </div>
            </footer>
          </>
        )}
        {authOpen && (
          <div
            className="modal-backdrop"
            role="presentation"
            onMouseDown={(event) =>
              event.currentTarget === event.target && setAuthOpen(false)
            }
          >
            <section
              className="auth-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-title"
            >
              <button
                className="modal-close"
                onClick={() => setAuthOpen(false)}
                aria-label="Close authentication"
              >
                <X size={18} />
              </button>
              <p className="eyebrow">Welcome to Dezhub</p>
              <h2 id="auth-title">
                {authMode === 'register'
                  ? 'Create your account'
                  : authMode === 'forgot'
                    ? 'Reset your password'
                  : authMode === 'reset'
                    ? 'Choose a new password'
                    : authMode === 'phone'
                      ? 'Continue with your phone'
                      : authMode === 'otp'
                        ? 'Verify your phone'
                    : 'Welcome back'}
              </h2>
              <p className="auth-subtitle">
                {authMode === 'register'
                  ? 'Join a trusted network built around real people.'
                  : authMode === 'forgot'
                    ? 'Enter your email and we will send you a secure reset link.'
                    : authMode === 'reset'
                      ? 'Create a new password for your Dezhub account.'
                      : authMode === 'phone'
                        ? 'We will send a six-digit verification code by SMS.'
                        : authMode === 'otp'
                          ? `Enter the code sent to ${phoneNumber}.`
                      : 'Sign in to manage your requests and placements.'}
              </p>
              {(authMode === 'register' || authMode === 'phone') && (
                <div className="account-types" aria-label="Choose your account type">
                  <p className="account-type-label">Choose your account type</p>
                  <button
                    type="button"
                    className={
                      roleSelected && accountType === 'client'
                        ? 'type-button active'
                        : 'type-button'
                    }
                    onClick={() => choosePublicRole('client')}
                  >
                    <strong>I need help</strong>
                    <span>Find trusted professionals</span>
                  </button>
                  <button
                    type="button"
                    className={
                      roleSelected && accountType === 'provider'
                        ? 'type-button active'
                        : 'type-button'
                    }
                    onClick={() => choosePublicRole('provider')}
                  >
                    <strong>I provide services</strong>
                    <span>Grow your work with Dezhub</span>
                  </button>
                </div>
              )}
              {authMode !== 'reset' && authMode !== 'phone' && authMode !== 'otp' && (
                <>
                  <button
                    className="google-sign-in"
                    type="button"
                    onClick={continueWithGoogle}
                  >
                    <GoogleIcon /> Continue with Google
                  </button>
                  <div className="auth-divider">
                    <span>or continue with email</span>
                  </div>
                </>
              )}
              <form onSubmit={submitAuth}>
                {authMode === 'register' && (
                  <label>
                    Full name
                    <input
                      name="fullName"
                      type="text"
                      required
                      minLength={2}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </label>
                )}
                {authMode !== 'reset' && authMode !== 'phone' && authMode !== 'otp' && (
                  <label>
                    Email address
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                    />
                  </label>
                )}
                {authMode === 'phone' ? (
                  <label>
                    Phone number
                    <input
                      name="phone"
                      type="tel"
                      required
                      placeholder="+254712345678"
                      autoComplete="tel"
                    />
                  </label>
                ) : authMode === 'otp' ? (
                  <label>
                    Six-digit code
                    <input
                      name="token"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      required
                      maxLength={6}
                      placeholder="123456"
                      autoComplete="one-time-code"
                    />
                  </label>
                ) : authMode === 'reset' ? (
                  <>
                    <label>
                      New password
                      <input
                        name="newPassword"
                        type="password"
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                      />
                    </label>
                    <label>
                      Confirm new password
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        minLength={6}
                        placeholder="Repeat your new password"
                      />
                    </label>
                  </>
                ) : (
                  authMode !== 'forgot' && (
                    <label>
                      Password
                      <input
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                      />
                    </label>
                  )
                )}
                {authMode === 'signin' && (
                  <button
                    className="forgot-link"
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot')
                      setAuthMessage('')
                    }}
                  >
                    Forgot password?
                  </button>
                )}
                <button className="auth-submit" type="submit">
                  {authMode === 'register'
                    ? 'Create account'
                    : authMode === 'forgot'
                      ? 'Send reset link'
                    : authMode === 'reset'
                      ? 'Update password'
                      : authMode === 'phone'
                        ? 'Send verification code'
                        : authMode === 'otp'
                          ? 'Verify and sign in'
                        : 'Sign in'}{' '}
                  <ChevronRight size={16} />
                </button>
              </form>
              {(authMode === 'signin' || authMode === 'register') && (
                <button
                  className="auth-alt-button"
                  type="button"
                  onClick={() => {
                    setAuthMode('phone')
                    setAuthMessage('')
                  }}
                >
                  {authMode === 'register' ? 'Register with phone instead' : 'Continue with phone'}
                </button>
              )}
              {(authMode === 'phone' || authMode === 'otp') && (
                <button
                  className="auth-alt-button"
                  type="button"
                  onClick={() => {
                    setAuthMode('signin')
                    setAuthMessage('')
                  }}
                >
                  Use email instead
                </button>
              )}
              {authMessage && <p className="auth-message">{authMessage}</p>}
              <p className="auth-switch">
                {authMode === 'reset'
                  ? 'Need to start over?'
                  : authMode === 'forgot'
                    ? 'Remember your password?'
                  : authMode === 'register' || authMode === 'phone' || authMode === 'otp'
                      ? 'Already have an account?'
                      : 'New to Dezhub?'}{' '}
                <button
                  onClick={() => {
                    setAuthMode(
                      authMode === 'reset' ||
                        authMode === 'forgot' ||
                        authMode === 'register' ||
                        authMode === 'phone' ||
                        authMode === 'otp'
                        ? 'signin'
                        : 'register',
                    )
                    setAuthMessage('')
                  }}
                >
                  {authMode === 'reset' ||
                  authMode === 'forgot' ||
                  authMode === 'register' ||
                  authMode === 'phone' ||
                  authMode === 'otp'
                    ? 'Sign in'
                    : 'Create an account'}
                </button>
              </p>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
