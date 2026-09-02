import { useEffect, useState } from 'react'
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

const categories = [
  'All services',
  'Childcare',
  'Housekeeping',
  'Drivers',
  'Elder care',
  'Chefs',
]
const services = [
  {
    name: 'Amina Muthoni',
    role: 'Elite nanny and newborn care',
    location: 'Nairobi, Kenya',
    rating: '5.0',
    reviews: 48,
    price: 'From $18/hr',
    image:
      'https://images.unsplash.com/photo-1543333995-a78aea2eee50?auto=format&fit=crop&w=800&q=85',
    tag: 'Top rated',
  },
  {
    name: 'Wanjiku Njeri',
    role: 'Detailed home cleaning service',
    location: 'Nairobi, Kenya',
    rating: '4.9',
    reviews: 31,
    price: 'From $12/hr',
    image:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=85',
    tag: 'Fast response',
  },
  {
    name: 'James Kariuki',
    role: 'Safe, professional family driver',
    location: 'Kiambu, Kenya',
    rating: '5.0',
    reviews: 27,
    price: 'From $15/hr',
    image:
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=85',
    tag: 'Verified pro',
  },
  {
    name: 'Miriam Wambui',
    role: 'Healthy family meals, prepared fresh',
    location: 'Nairobi, Kenya',
    rating: '4.8',
    reviews: 19,
    price: 'From $20/hr',
    image:
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=85',
    tag: 'New on Dezhub',
  },
]

type AccountType = 'client' | 'provider'
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
  languages: string
  professionalSkills: string
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
  const [notice, setNotice] = useState(true)
  const [authOpen, setAuthOpen] = useState(
    window.location.pathname === '/reset-password',
  )
  const [authMode, setAuthMode] = useState<
    'signin' | 'register' | 'forgot' | 'reset' | 'phone' | 'otp'
  >(window.location.pathname === '/reset-password' ? 'reset' : 'signin')
  const [accountType, setAccountType] = useState<AccountType>('client')
  const [currentRole, setCurrentRole] = useState<AppRole | null>(null)
  const [authMessage, setAuthMessage] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [accountName, setAccountName] = useState('Your Dezhub account')
  const [accountWorkspace, setAccountWorkspace] =
    useState<AccountWorkspace | null>(null)
  const [currentPage, setCurrentPage] = useState(
    window.location.pathname === '/profile' ? 'profile' : 'home',
  )
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
    languages: '',
    professionalSkills: '',
    preferredWorkLocation: '',
    experienceYears: '',
    references: '',
  })
  const [profileMessage, setProfileMessage] = useState('')
  const [staffEmail, setStaffEmail] = useState('')
  const [staffRole, setStaffRole] = useState<'assessor' | 'administrator'>('assessor')
  const [staffMessage, setStaffMessage] = useState('')
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [documentFiles, setDocumentFiles] = useState<Record<string, File | null>>({})
  const effectiveRole = currentRole ?? accountType
  const isProvider = effectiveRole === 'provider'
  const filteredServices = services.filter(
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
    setAccountWorkspace(workspace)
    setAccountMenuOpen(false)
    window.setTimeout(() =>
      document
        .getElementById('account-workspace')
        ?.scrollIntoView({ behavior: 'smooth' }),
    )
  }
  const goHome = () => {
    window.history.pushState({}, '', '/')
    setCurrentPage('home')
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
  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) {
      setProfileMessage('Add your Supabase keys to save your profile.')
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
    let avatarUrl: string | null = null
    if (profilePhoto) {
      const path = `${user.id}/profile-${Date.now()}-${profilePhoto.name}`
      const upload = await supabase.storage.from('provider-documents').upload(path, profilePhoto, { upsert: false })
      if (upload.error) { setProfileMessage(`Profile photo upload failed: ${upload.error.message}`); return }
      avatarUrl = path
    }
    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email,
        full_name: profileDetails.fullName.trim(),
        account_type: effectiveRole,
        location: profileDetails.location.trim() || null,
        bio: profileDetails.bio.trim() || null,
        date_of_birth: profileDetails.dateOfBirth || null,
        gender: profileDetails.gender || null,
        nationality: profileDetails.nationality.trim() || null,
        phone_number: profileDetails.phoneNumber.trim() || null,
        national_id: profileDetails.nationalId.trim() || null,
        emergency_contact: profileDetails.emergencyContact.trim() || null,
        next_of_kin_name: profileDetails.nextOfKinName.trim() || null,
        next_of_kin_relationship: profileDetails.nextOfKinRelationship.trim() || null,
        next_of_kin_phone: profileDetails.nextOfKinPhone.trim() || null,
        alternative_contact: profileDetails.alternativeContact.trim() || null,
        professional_category: profileDetails.professionalCategory.trim() || null,
        education: profileDetails.education.trim() || null,
        previous_employers: profileDetails.previousEmployers.trim() || null,
        previous_job_locations: profileDetails.previousJobLocations.trim() || null,
        availability: profileDetails.availability.trim() || null,
        salary_expectation: profileDetails.salaryExpectation.trim() || null,
        languages: profileDetails.languages.trim() || null,
        professional_skills: profileDetails.professionalSkills.trim() || null,
        preferred_work_location: profileDetails.preferredWorkLocation.trim() || null,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        experience_years: profileDetails.experienceYears ? Number(profileDetails.experienceYears) : null,
        references: profileDetails.references.trim() || null,
      },
      { onConflict: 'id' },
    )
    if (error) {
      setProfileMessage(error.message)
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
    setAccountName(profileDetails.fullName.trim())
    setProfileMessage(pendingDocuments.length ? 'Your profile and documents have been submitted for review.' : 'Your profile has been saved.')
  }
  const continueWithGoogle = async () => {
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
        void auth.from('user_roles').select('role').eq('user_id', user.id).maybeSingle().then(({ data: roleData }) => {
          if (roleData?.role) setCurrentRole(roleData.role as AppRole)
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
        languages: user?.user_metadata.languages ?? '',
        professionalSkills: user?.user_metadata.professional_skills ?? '',
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
          void auth.from('user_roles').select('role').eq('user_id', user.id).maybeSingle().then(({ data: roleData }) => {
            setCurrentRole((roleData?.role as AppRole | undefined) ?? null)
          })
        } else {
          setCurrentRole(null)
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
          languages: user?.user_metadata.languages ?? '',
          professionalSkills: user?.user_metadata.professional_skills ?? '',
          preferredWorkLocation: user?.user_metadata.preferred_work_location ?? '',
          experienceYears: user?.user_metadata.experience_years?.toString() ?? '',
          references: user?.user_metadata.references ?? '',
        })
      },
    )
    return () => listener.subscription.unsubscribe()
  }, [])
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
          <a className="brand-mark" href="#top">
            <span>de</span>zhub<span className="brand-dot">.</span>
          </a>
          <nav
            className={menuOpen ? 'main-nav nav-open' : 'main-nav'}
            aria-label="Main navigation"
          >
            <a className="active" href="#browse">
              Browse services
            </a>
            <a href="#how-it-works">How it works</a>
            <a href="#academy">Dezhub Academy</a>
          </nav>
          <div className="header-actions">
            <button
              className="sell-link"
              onClick={() => {
                setAuthMode('register')
                setAccountType('provider')
                setAuthOpen(true)
              }}
            >
              Become a provider
            </button>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={19} />
              <i />
            </button>
            <div className="account-menu-wrap">
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
                      {accountName.charAt(0).toUpperCase()}
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
      <main id="top">
        {currentPage === 'profile' ? (
          <section className="profile-page">
            <div className="profile-page-inner">
              <button className="back-button" onClick={goHome}>
                <ArrowLeft size={17} /> Back to Dezhub
              </button>
              <div className="profile-page-heading">
                <div className="profile-page-avatar">
                  {accountName.charAt(0).toUpperCase()}
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
                  <button className="active">
                    <CircleUserRound size={16} /> Profile
                  </button>
                  <button
                    onClick={() => {
                      goHome()
                      openAccountWorkspace('settings')
                    }}
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <button
                    onClick={() => {
                      goHome()
                      openAccountWorkspace('payments')
                    }}
                  >
                    <CreditCard size={16} /> Payments and billing
                  </button>
                  <button
                    onClick={() => {
                      goHome()
                      openAccountWorkspace('help')
                    }}
                  >
                    <CircleHelp size={16} /> Help centre
                  </button>
                </aside>
                <form className="profile-form" onSubmit={saveProfile}>
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
                        <label>Date of birth<input type="date" value={profileDetails.dateOfBirth} onChange={(event) => setProfileDetails((details) => ({ ...details, dateOfBirth: event.target.value }))} /></label>
                        <label>Gender<select value={profileDetails.gender} onChange={(event) => setProfileDetails((details) => ({ ...details, gender: event.target.value }))}><option value="">Select gender</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select></label>
                      </div>
                      <div className="profile-field-grid">
                        <label>Nationality<input value={profileDetails.nationality} onChange={(event) => setProfileDetails((details) => ({ ...details, nationality: event.target.value }))} placeholder="e.g. Kenyan" /></label>
                        <label>Phone number<input type="tel" value={profileDetails.phoneNumber} onChange={(event) => setProfileDetails((details) => ({ ...details, phoneNumber: event.target.value }))} placeholder="+254..." /></label>
                      </div>
                      <label>National ID or passport number<input value={profileDetails.nationalId} onChange={(event) => setProfileDetails((details) => ({ ...details, nationalId: event.target.value }))} placeholder="Enter your document number" /></label>
                      <h3 className="profile-section-title">Next of kin</h3>
                      <div className="profile-field-grid"><label>Name<input value={profileDetails.nextOfKinName} onChange={(event) => setProfileDetails((details) => ({ ...details, nextOfKinName: event.target.value }))} /></label><label>Relationship<input value={profileDetails.nextOfKinRelationship} onChange={(event) => setProfileDetails((details) => ({ ...details, nextOfKinRelationship: event.target.value }))} placeholder="e.g. Sister" /></label></div>
                      <div className="profile-field-grid"><label>Phone number<input value={profileDetails.nextOfKinPhone} onChange={(event) => setProfileDetails((details) => ({ ...details, nextOfKinPhone: event.target.value }))} /></label><label>Alternative contact<input value={profileDetails.alternativeContact} onChange={(event) => setProfileDetails((details) => ({ ...details, alternativeContact: event.target.value }))} /></label></div>
                      <h3 className="profile-section-title">Professional history</h3>
                      <label>Education<input value={profileDetails.education} onChange={(event) => setProfileDetails((details) => ({ ...details, education: event.target.value }))} placeholder="Highest education or training" /></label>
                      <div className="profile-field-grid"><label>Previous employers<textarea rows={3} value={profileDetails.previousEmployers} onChange={(event) => setProfileDetails((details) => ({ ...details, previousEmployers: event.target.value }))} placeholder="Employer, role, and dates" /></label><label>Previous job locations<textarea rows={3} value={profileDetails.previousJobLocations} onChange={(event) => setProfileDetails((details) => ({ ...details, previousJobLocations: event.target.value }))} placeholder="Cities or countries" /></label></div>
                      <label>Professional skills<input value={profileDetails.professionalSkills} onChange={(event) => setProfileDetails((details) => ({ ...details, professionalSkills: event.target.value }))} placeholder="e.g. newborn care, cooking, first aid" /></label>
                      <label>Preferred work location<input value={profileDetails.preferredWorkLocation} onChange={(event) => setProfileDetails((details) => ({ ...details, preferredWorkLocation: event.target.value }))} placeholder="Where would you like to work?" /></label>
                      <div className="profile-field-grid"><label>Availability<input value={profileDetails.availability} onChange={(event) => setProfileDetails((details) => ({ ...details, availability: event.target.value }))} placeholder="e.g. Full-time, weekdays" /></label><label>Years of experience<input type="number" min="0" max="60" value={profileDetails.experienceYears} onChange={(event) => setProfileDetails((details) => ({ ...details, experienceYears: event.target.value }))} placeholder="e.g. 5" /></label></div>
                      <div className="profile-field-grid"><label>Languages<input value={profileDetails.languages} onChange={(event) => setProfileDetails((details) => ({ ...details, languages: event.target.value }))} placeholder="e.g. English, Swahili" /></label><label>Expected salary<input value={profileDetails.salaryExpectation} onChange={(event) => setProfileDetails((details) => ({ ...details, salaryExpectation: event.target.value }))} placeholder="e.g. $600 per month" /></label></div>
                      <label>Professional references<textarea rows={4} value={profileDetails.references} onChange={(event) => setProfileDetails((details) => ({ ...details, references: event.target.value }))} placeholder="Names, roles, and contact details" /></label>
                      <label className="file-input">Profile photo<input type="file" accept="image/*" onChange={(event) => setProfilePhoto(event.target.files?.[0] ?? null)} /></label>
                      <div className="document-upload"><strong>Required documents</strong><span>Upload clear copies. Each document starts as pending review.</span>{providerDocumentTypes.map((document) => <label className="file-input" key={document.key}>{document.label}<input type="file" accept={document.accept} multiple={document.key === 'supporting'} onChange={(event) => setDocumentFiles((files) => ({ ...files, [document.key]: event.target.files?.[0] ?? null }))} /></label>)}</div>
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
                  <button className="profile-save" type="submit">
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
                  <div className="account-workspace-icon">
                    <CircleUserRound size={22} />
                  </div>
                  <div>
                    <p className="eyebrow">Account area</p>
                    <h2>{accountWorkspaceContent[accountWorkspace].title}</h2>
                    <p>
                      {accountWorkspaceContent[accountWorkspace].description}
                    </p>
                    {accountWorkspace === 'staff' && currentRole === 'administrator' && (
                      <form className="staff-invite-form" onSubmit={inviteStaff}>
                        <label>Staff email<input type="email" value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)} placeholder="colleague@example.com" required /></label>
                        <label>Staff role<select value={staffRole} onChange={(event) => setStaffRole(event.target.value as 'assessor' | 'administrator')}><option value="assessor">Assessor / Academy staff</option><option value="administrator">Administrator</option></select></label>
                        <button className="profile-save" type="submit"><UserPlus size={16} /> Send invitation</button>
                        {staffMessage && <p className="profile-message">{staffMessage}</p>}
                      </form>
                    )}
                  </div>
                  <button
                    className="account-workspace-close"
                    onClick={() => setAccountWorkspace(null)}
                    aria-label="Close account area"
                  >
                    <X size={18} />
                  </button>
                </section>
              )}
              {notice && (
                <div className="notice">
                  <Sparkles size={16} />
                  <span>
                    <strong>Welcome back, Joy.</strong> Your team has 12 new
                    verified providers to explore.
                  </span>
                  <button
                    onClick={() => setNotice(false)}
                    aria-label="Dismiss welcome message"
                  >
                    <X size={16} />
                  </button>
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
                    <article className="service-card" key={service.name}>
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
                          onClick={() => toggleFavorite(service.name)}
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
                      <p className="eyebrow">Your workspace</p>
                      <h2>Keep things moving</h2>
                    </div>
                    <button className="icon-button">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon coral">
                      <UsersRound size={17} />
                    </div>
                    <div>
                      <strong>12 providers to review</strong>
                      <span>New profiles are waiting</span>
                    </div>
                    <ChevronRight size={16} />
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon teal">
                      <BriefcaseBusiness size={17} />
                    </div>
                    <div>
                      <strong>4 open requests</strong>
                      <span>One needs your attention</span>
                    </div>
                    <ChevronRight size={16} />
                  </div>
                  <div className="academy-strip">
                    <div className="academy-icon">
                      <Sparkles size={17} />
                    </div>
                    <div>
                      <p>DEZHUB ACADEMY</p>
                      <strong>8 learners are in progress</strong>
                      <button id="academy">
                        Open academy <ChevronRight size={14} />
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
            </div>
            <footer className="site-footer">
              <div className="footer-inner">
                <div className="footer-cta">
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
                      setAuthOpen(true)
                    }}
                  >
                    Become a provider <ChevronRight size={16} />
                  </button>
                </div>
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
                <div className="account-types">
                  <button
                    type="button"
                    className={
                      accountType === 'client'
                        ? 'type-button active'
                        : 'type-button'
                    }
                    onClick={() => setAccountType('client')}
                  >
                    <strong>I need help</strong>
                    <span>Find trusted professionals</span>
                  </button>
                  <button
                    type="button"
                    className={
                      accountType === 'provider'
                        ? 'type-button active'
                        : 'type-button'
                    }
                    onClick={() => setAccountType('provider')}
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
