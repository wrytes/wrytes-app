import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faLock } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '@/hooks/useAuth'
import { AuthModal } from './AuthModal'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  showModal?: boolean
  fallback?: React.ReactNode
  loadingComponent?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/',
  showModal = true,
  fallback,
  loadingComponent
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        if (showModal) {
          setShowAuthModal(true)
        } else {
          setShouldRedirect(true)
        }
      } else {
        setShowAuthModal(false)
        setShouldRedirect(false)
      }
    }
  }, [isAuthenticated, isLoading, showModal])

  useEffect(() => {
    if (shouldRedirect) {
      router.push(redirectTo)
    }
  }, [shouldRedirect, redirectTo, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center -mt-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <FontAwesomeIcon 
            icon={faSpinner} 
            className="text-4xl text-orange-500 animate-spin mb-4" 
          />
          <p className="text-text-primary text-lg">Loading...</p>
          <p className="text-gray-400 text-sm mt-2">Checking authentication status</p>
        </motion.div>
      </div>
    )
  }

  // If not authenticated and should redirect, show nothing (redirect will happen)
  if (shouldRedirect) {
    return null
  }

  // If not authenticated and showModal is false, show fallback
  if (!isAuthenticated && !showModal) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center -mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <FontAwesomeIcon 
            icon={faLock} 
            className="text-4xl text-red-500 mb-4" 
          />
          <h2 className="text-text-primary text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">
            You need to be authenticated to view this page.
          </p>
          <button
            onClick={() => router.push(redirectTo)}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </motion.div>
      </div>
    )
  }

  // If authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Show auth modal if needed
  return (
    <>
      {/* Render a minimal layout while modal is open */}
      <div className="min-h-screen flex items-center justify-center -mt-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <FontAwesomeIcon 
            icon={faLock} 
            className="text-4xl text-orange-500 mb-4" 
          />
          <h2 className="text-text-primary text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-400">Please connect your wallet to continue</p>
        </motion.div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
        }}
      />
    </>
  )
}