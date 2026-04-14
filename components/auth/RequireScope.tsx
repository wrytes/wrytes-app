import React from 'react'
import { useAuth } from '@/hooks/useAuth'

interface RequireScopeProps {
  scope?: string | string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

/** Renders children only when the user is authenticated and (optionally) holds the required scope(s). */
export function RequireScope({ scope, children, fallback }: RequireScopeProps) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated || !user) return fallback ? <>{fallback}</> : null

  if (scope) {
    const required = Array.isArray(scope) ? scope : [scope]
    const hasScope = user.scopes.includes('ADMIN') || required.some((s) => user.scopes.includes(s))
    if (!hasScope) return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

export function withScopeProtection<P extends object>(
  Component: React.ComponentType<P>,
  requiredScope?: string | string[],
) {
  const Protected = (props: P) => (
    <RequireScope scope={requiredScope}>
      <Component {...props} />
    </RequireScope>
  )
  Protected.displayName = `withScopeProtection(${Component.displayName || Component.name})`
  return Protected
}

/** Shows the user's Telegram handle or a truncated wallet address. */
export function UserBadge({ className = '' }: { className?: string }) {
  const { user } = useAuth()
  if (!user) return null

  const label = user.telegramHandle
    ? `@${user.telegramHandle}`
    : `${user.walletAddress.slice(0, 6)}…${user.walletAddress.slice(-4)}`

  return (
    <div
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs border border-gray-600 bg-gray-800 text-gray-400 ${className}`}
    >
      {label}
    </div>
  )
}
