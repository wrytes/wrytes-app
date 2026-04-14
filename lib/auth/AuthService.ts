import { type Address } from 'viem'
import { AuthStorage } from './storage'
import {
  type ChallengeResponse,
  type SigninResponse,
  type SessionPollResponse,
  type LinkTokenResponse,
  type LinkTokenStatusResponse,
  type User,
  type ApiError,
} from './types'
import { CONFIG } from '@/lib/constants'

export class AuthService {
  private static instance: AuthService
  private readonly baseURL: string

  private constructor() {
    this.baseURL = CONFIG.api
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // ---------------------------------------------------------------------------
  // HTTP helper
  // ---------------------------------------------------------------------------

  private async request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const token = AuthStorage.getToken()

    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(url, { ...init, headers: { ...headers, ...init.headers } })

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      const err: ApiError = {
        message: body.message || `HTTP ${response.status}`,
        code: body.error || 'HTTP_ERROR',
        statusCode: response.status,
        details: body,
      }
      throw err
    }

    return response.json() as Promise<T>
  }

  // ---------------------------------------------------------------------------
  // Wallet sign-in flow (3 steps)
  // ---------------------------------------------------------------------------

  /** Step 1 — get a nonce-based challenge message to sign. */
  async getChallenge(address: Address): Promise<ChallengeResponse> {
    return this.request<ChallengeResponse>('/user-wallets/auth/challenge', {
      method: 'POST',
      body: JSON.stringify({ address }),
    })
  }

  /** Step 2 — submit the signed challenge; triggers Telegram 2FA. */
  async submitSignin(
    address: Address,
    message: string,
    signature: `0x${string}`,
  ): Promise<SigninResponse> {
    return this.request<SigninResponse>('/user-wallets/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ address, message, signature }),
    })
  }

  /** Step 3 — poll until the user taps Allow/Deny in Telegram. */
  async pollSession(sessionId: string): Promise<SessionPollResponse> {
    return this.request<SessionPollResponse>(`/user-wallets/auth/session/${sessionId}`)
  }

  // ---------------------------------------------------------------------------
  // User profile
  // ---------------------------------------------------------------------------

  async getMe(): Promise<User & { walletAddress: Address }> {
    const data = await this.request<Omit<User, 'walletAddress'> & { wallets: { address: string; label: string | null }[] }>('/auth/me')
    // walletAddress will be patched in by the caller from the JWT payload
    return data as unknown as User & { walletAddress: Address }
  }

  // ---------------------------------------------------------------------------
  // Wallet link token (reverse magic key)
  // ---------------------------------------------------------------------------

  /** Returns the ownership message the wallet must sign before creating a token. */
  getLinkMessage(address: Address): string {
    const issued = new Date().toISOString()
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    return (
      `Link wallet to Wrytes\n\n` +
      `Address: ${address}\n` +
      `Issued: ${issued}\n` +
      `Expires: ${expires}\n\n` +
      `By signing this message you confirm ownership of this wallet.`
    )
  }

  async createLinkToken(
    address: Address,
    message: string,
    signature: `0x${string}`,
  ): Promise<LinkTokenResponse> {
    return this.request<LinkTokenResponse>('/user-wallets/link-token', {
      method: 'POST',
      body: JSON.stringify({ address, message, signature }),
    })
  }

  async getLinkTokenStatus(token: string): Promise<LinkTokenStatusResponse> {
    return this.request<LinkTokenStatusResponse>(`/user-wallets/link-token/${token}/status`)
  }

  // ---------------------------------------------------------------------------
  // Storage helpers
  // ---------------------------------------------------------------------------

  storeToken(jwt: string): void {
    AuthStorage.setToken(jwt)
  }

  clearSession(): void {
    AuthStorage.clearAll()
  }

  isAuthenticated(): boolean {
    return AuthStorage.hasValidToken()
  }

  getStoredToken(): string | null {
    return AuthStorage.getToken()
  }

  isTokenExpiringSoon(): boolean {
    return AuthStorage.isTokenExpiringSoon()
  }

  /** Decode JWT payload without verifying signature (browser-side). */
  decodeToken(token: string): { sub: string; wallet: string } | null {
    try {
      return JSON.parse(atob(token.split('.')[1]))
    } catch {
      return null
    }
  }
}
