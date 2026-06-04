import { AuthStorage } from '@/lib/auth/storage'
import { CONFIG } from '@/lib/constants'

export interface ApiError {
  statusCode: number
  message: string
  [key: string]: unknown
}

export async function apiRequest<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const token = AuthStorage.getToken()
  const namespaceId = AuthStorage.getNamespaceId()
  // Skip Content-Type for FormData — browser sets it with the correct multipart boundary.
  const headers: HeadersInit = init.body instanceof FormData
    ? {}
    : { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (namespaceId) headers['X-Namespace-Id'] = namespaceId

  const res = await fetch(`${CONFIG.api}${endpoint}`, {
    ...init,
    headers: { ...headers, ...init.headers },
  })

  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err: ApiError = {
      statusCode: res.status,
      message: body.message || `HTTP ${res.status}`,
      ...body,
    }
    throw err
  }

  return body as T
}
