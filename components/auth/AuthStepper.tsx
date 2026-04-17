import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faWallet,
  faFileSignature,
  faPaperPlane,
  faCheck,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '@/hooks/useAuth'
import { useWallet } from '@/hooks/useWallet'
import { AuthStep } from '@/lib/auth/types'

const STEPS = [
  {
    id: AuthStep.CONNECT_WALLET,
    title: 'Connect',
    description: 'Link your wallet',
    icon: faWallet,
  },
  {
    id: AuthStep.SIGN_MESSAGE,
    title: 'Sign',
    description: 'Confirm ownership',
    icon: faFileSignature,
  },
  {
    id: AuthStep.PENDING_TG_APPROVAL,
    title: 'Approve',
    description: 'Tap Allow in Telegram',
    icon: faPaperPlane,
  },
  {
    id: AuthStep.AUTHENTICATED,
    title: 'Done',
    description: 'Access granted',
    icon: faCheck,
  },
]

// Map each AuthStep to its visual index
const STEP_INDEX: Record<AuthStep, number> = {
  [AuthStep.CONNECT_WALLET]:    0,
  [AuthStep.SIGN_MESSAGE]:      1,
  [AuthStep.WALLET_NOT_LINKED]: 1, // sub-flow within the Sign step
  [AuthStep.PENDING_TG_APPROVAL]: 2,
  [AuthStep.AUTHENTICATED]:     3,
}

interface AuthStepperProps {
  onComplete?: () => void
}

export function AuthStepper({ onComplete }: AuthStepperProps) {
  const { isAuthenticated, authFlow } = useAuth()
  const { isConnected } = useWallet()

  useEffect(() => {
    if (isAuthenticated && onComplete) {
      const t = setTimeout(onComplete, 8000)
      return () => clearTimeout(t)
    }
  }, [isAuthenticated, onComplete])

  const currentStep = isAuthenticated
    ? AuthStep.AUTHENTICATED
    : authFlow?.currentStep ?? (isConnected ? AuthStep.SIGN_MESSAGE : AuthStep.CONNECT_WALLET)

  const currentIndex = STEP_INDEX[currentStep] ?? 0

  const getStatus = (stepIndex: number) => {
    if (currentStep === AuthStep.AUTHENTICATED) return 'completed'
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) {
      if (authFlow?.error) return 'error'
      if (authFlow?.isLoading) return 'loading'
      return 'current'
    }
    return 'pending'
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-start">
        {STEPS.map((step, index) => {
          const status = getStatus(index)

          const iconColor =
            status === 'completed' ? 'text-green-500' :
            status === 'loading'   ? 'text-orange-500' :
            status === 'error'     ? 'text-red-500' :
            status === 'current'   ? 'text-orange-500' :
            'text-gray-500'

          const ringClass =
            status === 'completed' ? 'border-green-500 bg-green-500/20' :
            status === 'loading' || status === 'current' ? 'border-orange-500 bg-orange-500/20' :
            status === 'error'     ? 'border-red-500 bg-red-500/20' :
            'border-gray-600 bg-gray-800'

          const displayIcon =
            status === 'completed' ? faCheck :
            status === 'error'     ? faExclamationTriangle :
            step.icon

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <motion.div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2 ${ringClass}`}
                  animate={{ scale: status === 'loading' ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 1.5, repeat: status === 'loading' ? Infinity : 0, ease: 'easeInOut' }}
                >
                  <FontAwesomeIcon icon={displayIcon} className={`text-sm ${iconColor}`} />
                </motion.div>
                <div className="text-center max-w-[72px]">
                  <p className={`text-xs font-medium ${
                    status === 'current' || status === 'completed' || status === 'loading'
                      ? 'text-text-primary'
                      : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">
                    {step.description}
                  </p>
                </div>
              </div>

              {index < STEPS.length - 1 && (
                <div className="flex-1 px-2 mt-5">
                  <div className={`h-0.5 rounded-full transition-colors duration-500 ${
                    getStatus(index) === 'completed' ? 'bg-green-500' :
                    getStatus(index) === 'error'     ? 'bg-red-500' :
                    'bg-gray-700'
                  }`} />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
