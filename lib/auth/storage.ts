import { type User as UserProfile } from './types'

const AUTH_TOKEN_KEY = 'wrytes_auth_token'
const AUTH_USER_KEY = 'wrytes_auth_user'

export class AuthStorage {
  // Token management
  static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AUTH_TOKEN_KEY, token)
      } catch (error) {
        console.error('Failed to store authentication token:', error)
      }
    }
  }

  static getToken(): string | null {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(AUTH_TOKEN_KEY)
      } catch (error) {
        console.error('Failed to retrieve authentication token:', error)
        return null
      }
    }
    return null
  }

  static clearToken(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(AUTH_TOKEN_KEY)
      } catch (error) {
        console.error('Failed to clear authentication token:', error)
      }
    }
  }

  // User data management
  static setUser(user: UserProfile): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
      } catch (error) {
        console.error('Failed to store user data:', error)
      }
    }
  }

  static getUser(): UserProfile | null {
    if (typeof window !== 'undefined') {
      try {
        const userData = localStorage.getItem(AUTH_USER_KEY)
        return userData ? JSON.parse(userData) : null
      } catch (error) {
        console.error('Failed to retrieve user data:', error)
        return null
      }
    }
    return null
  }

  static clearUser(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(AUTH_USER_KEY)
      } catch (error) {
        console.error('Failed to clear user data:', error)
      }
    }
  }

  // Clear all authentication data
  static clearAll(): void {
    this.clearToken()
    this.clearUser()
  }

  // Check if token exists and is not expired
  static hasValidToken(): boolean {
    const token = this.getToken()
    if (!token) return false

    try {
      // Decode JWT payload (basic check - in production you'd want proper validation)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      
      return payload.exp > currentTime
    } catch (error) {
      console.error('Failed to validate token:', error)
      return false
    }
  }

  // Get token expiration time
  static getTokenExpiration(): number | null {
    const token = this.getToken()
    if (!token) return null

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 // Convert to milliseconds
    } catch (error) {
      console.error('Failed to get token expiration:', error)
      return null
    }
  }

  // Check if token will expire soon (within 5 minutes)
  static isTokenExpiringSoon(): boolean {
    const expiration = this.getTokenExpiration()
    if (!expiration) return true

    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000)
    return expiration < fiveMinutesFromNow
  }
}