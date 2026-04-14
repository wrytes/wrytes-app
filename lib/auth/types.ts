import { type Address } from 'viem'

// ---------------------------------------------------------------------------
// Auth flow steps (matches the UX: Connect → Sign → Approve in TG → Done)
// ---------------------------------------------------------------------------

export enum AuthStep {
  CONNECT_WALLET      = 'connect_wallet',
  SIGN_MESSAGE        = 'sign_message',
  WALLET_NOT_LINKED   = 'wallet_not_linked',  // challenge 404 → show link flow
  PENDING_TG_APPROVAL = 'pending_tg_approval',
  AUTHENTICATED       = 'authenticated',
}

export interface AuthFlowState {
  currentStep: AuthStep
  isLoading: boolean
  error: string | null
  /** The challenge message returned by the API — passed to signMessageAsync */
  message?: string
  /** Polling handle after signature submission */
  sessionId?: string
  sessionExpiresAt?: Date
}

// ---------------------------------------------------------------------------
// User — derived from JWT payload (sub + wallet)
// ---------------------------------------------------------------------------

export interface UserProfile {
  firstName: string
  lastName: string
  businessName: string | null
  isVerified: boolean
}

export interface LinkedWallet {
  address: Address
  label: string | null
}

export interface User {
  id: string
  walletAddress: Address      // the wallet used to sign in (from JWT)
  telegramHandle: string | null
  notificationsEnabled: boolean
  scopes: string[]
  wallets: LinkedWallet[]
  profile: UserProfile | null
}

// ---------------------------------------------------------------------------
// API shapes
// ---------------------------------------------------------------------------

export interface ChallengeResponse {
  nonce: string
  message: string
  expiresAt: string
}

export interface SigninResponse {
  sessionId: string
  expiresAt: string
  message: string
}

export type SessionStatus = 'pending' | 'approved' | 'denied' | 'expired'

export interface SessionPollResponse {
  status: SessionStatus
  jwt?: string
}

export interface LinkTokenResponse {
  token: string
  expiresAt: string
  message: string
}

export type LinkTokenStatus = 'pending' | 'linked' | 'expired' | 'invalid'

export interface LinkTokenStatusResponse {
  status: LinkTokenStatus
  walletAddress?: string
  linkedAt?: string
}

// ---------------------------------------------------------------------------
// Auth state / context
// ---------------------------------------------------------------------------

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  token: string | null
}

export interface AuthContextType extends AuthState {
  signIn: (address: Address) => Promise<void>
  signOut: () => void
  clearError: () => void
  authFlow: AuthFlowState
}

// ---------------------------------------------------------------------------
// Wallet state
// ---------------------------------------------------------------------------

export interface WalletState {
  isConnected: boolean
  isConnecting: boolean
  address: Address | null
  chainId: number | null
  error: string | null
}

// ---------------------------------------------------------------------------
// API error
// ---------------------------------------------------------------------------

export interface ApiError {
  message: string
  code: string
  statusCode: number
  details?: Record<string, unknown>
}
