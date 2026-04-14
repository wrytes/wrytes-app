import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react'
import { type Address } from 'viem'
import { useAppKitAccount, useDisconnect } from '@reown/appkit-controllers/react'
import { useSignMessage } from 'wagmi'
import { AuthService } from '@/lib/auth/AuthService'
import {
  AuthStep,
  type AuthContextType,
  type AuthFlowState,
  type AuthState,
  type User,
} from '@/lib/auth/types'

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'CLEAR_AUTH' }
  | { type: 'SET_AUTH_FLOW'; payload: Partial<AuthFlowState> }

const initialAuthFlow: AuthFlowState = {
  currentStep: AuthStep.CONNECT_WALLET,
  isLoading: false,
  error: null,
}

const initialState: AuthState & { authFlow: AuthFlowState } = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  token: null,
  authFlow: initialAuthFlow,
}

function authReducer(
  state: AuthState & { authFlow: AuthFlowState },
  action: AuthAction,
): AuthState & { authFlow: AuthFlowState } {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload, isLoading: false }
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'SET_TOKEN':
      return { ...state, token: action.payload }
    case 'CLEAR_AUTH':
      return { ...initialState, authFlow: { ...initialAuthFlow } }
    case 'SET_AUTH_FLOW':
      return { ...state, authFlow: { ...state.authFlow, ...action.payload } }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined)
export { AuthContext }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const authService = AuthService.getInstance()

  const { address, isConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()

  // Keep a ref to the current sessionId so the polling effect can access it
  const sessionIdRef = useRef<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ---------------------------------------------------------------------------
  // Init from storage
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const token = authService.getStoredToken()
    if (token && authService.isAuthenticated()) {
      const payload = authService.decodeToken(token)
      if (payload) {
        dispatch({ type: 'SET_TOKEN', payload: token })
        dispatch({ type: 'SET_AUTH_FLOW', payload: { currentStep: AuthStep.AUTHENTICATED } })
        // Fetch full profile in the background
        authService.getMe()
          .then((me) => {
            dispatch({
              type: 'SET_USER',
              payload: { ...me, walletAddress: payload.wallet as Address },
            })
          })
          .catch(() => {
            // Fallback to minimal user from JWT if /auth/me fails
            dispatch({
              type: 'SET_USER',
              payload: {
                id: payload.sub,
                walletAddress: payload.wallet as Address,
                telegramHandle: null,
                notificationsEnabled: true,
                scopes: [],
                wallets: [],
                profile: null,
              },
            })
          })
      } else {
        authService.clearSession()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Sync wallet connection state → step
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isConnected) {
      stopPolling()
      if (state.isAuthenticated) {
        // Wallet disconnected while logged in — clear session
        authService.clearSession()
        dispatch({ type: 'CLEAR_AUTH' })
      } else {
        dispatch({
          type: 'SET_AUTH_FLOW',
          payload: { currentStep: AuthStep.CONNECT_WALLET, error: null, sessionId: undefined },
        })
      }
    } else if (isConnected && address && !state.isAuthenticated) {
      dispatch({
        type: 'SET_AUTH_FLOW',
        payload: { currentStep: AuthStep.SIGN_MESSAGE, error: null },
      })
    }
  }, [isConnected, address]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Session polling (runs while PENDING_TG_APPROVAL)
  // ---------------------------------------------------------------------------

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const startPolling = useCallback((sessionId: string) => {
    stopPolling()
    sessionIdRef.current = sessionId

    pollingRef.current = setInterval(async () => {
      try {
        const result = await authService.pollSession(sessionIdRef.current!)

        if (result.status === 'approved' && result.jwt) {
          stopPolling()
          authService.storeToken(result.jwt)
          const payload = authService.decodeToken(result.jwt)
          if (payload) {
            dispatch({ type: 'SET_TOKEN', payload: result.jwt })
            dispatch({
              type: 'SET_AUTH_FLOW',
              payload: { currentStep: AuthStep.AUTHENTICATED, isLoading: false, error: null },
            })
            // Fetch full profile
            authService.getMe()
              .then((me) => {
                dispatch({
                  type: 'SET_USER',
                  payload: { ...me, walletAddress: payload.wallet as Address },
                })
              })
              .catch(() => {
                dispatch({
                  type: 'SET_USER',
                  payload: {
                    id: payload.sub,
                    walletAddress: payload.wallet as Address,
                    telegramHandle: null,
                    notificationsEnabled: true,
                    scopes: [],
                    wallets: [],
                    profile: null,
                  },
                })
              })
          }
        } else if (result.status === 'denied') {
          stopPolling()
          dispatch({
            type: 'SET_AUTH_FLOW',
            payload: {
              currentStep: AuthStep.SIGN_MESSAGE,
              isLoading: false,
              error: 'Sign-in request was denied in Telegram.',
              sessionId: undefined,
            },
          })
        } else if (result.status === 'expired') {
          stopPolling()
          dispatch({
            type: 'SET_AUTH_FLOW',
            payload: {
              currentStep: AuthStep.SIGN_MESSAGE,
              isLoading: false,
              error: 'Telegram approval timed out. Please try again.',
              sessionId: undefined,
            },
          })
        }
        // 'pending' → keep polling
      } catch {
        // Network glitch — keep polling silently
      }
    }, 2000)
  }, [authService, stopPolling])

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), [stopPolling])

  // ---------------------------------------------------------------------------
  // signIn
  // ---------------------------------------------------------------------------

  const signIn = useCallback(
    async (walletAddress: Address) => {
      if (!walletAddress) throw new Error('Wallet address is required')

      dispatch({ type: 'SET_ERROR', payload: null })
      dispatch({
        type: 'SET_AUTH_FLOW',
        payload: { currentStep: AuthStep.SIGN_MESSAGE, isLoading: true, error: null },
      })

      try {
        // Step 1 — get challenge (404 means wallet not linked yet)
        let challengeResult: Awaited<ReturnType<typeof authService.getChallenge>>
        try {
          challengeResult = await authService.getChallenge(walletAddress)
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode
          if (status === 404) {
            // Wallet not registered — show link flow instead of generic error
            dispatch({
              type: 'SET_AUTH_FLOW',
              payload: { currentStep: AuthStep.WALLET_NOT_LINKED, isLoading: false, error: null },
            })
            return
          }
          throw err
        }
        const { message } = challengeResult
        dispatch({ type: 'SET_AUTH_FLOW', payload: { message, isLoading: false } })

        // Step 2 — sign with wallet
        dispatch({ type: 'SET_AUTH_FLOW', payload: { isLoading: true } })
        const signature = await signMessageAsync({ message }) as `0x${string}`

        // Step 3 — submit, trigger TG 2FA
        const { sessionId, expiresAt } = await authService.submitSignin(
          walletAddress,
          message,
          signature,
        )

        dispatch({
          type: 'SET_AUTH_FLOW',
          payload: {
            currentStep: AuthStep.PENDING_TG_APPROVAL,
            isLoading: false,
            sessionId,
            sessionExpiresAt: new Date(expiresAt),
            error: null,
          },
        })

        startPolling(sessionId)
      } catch (err: unknown) {
        stopPolling()
        let message = 'Authentication failed'

        if (err instanceof Error) {
          if (err.name === 'UserRejectedRequestError' || err.message.includes('User rejected')) {
            message = 'Signature cancelled. Please try again.'
          } else {
            message = err.message
          }
        } else if (typeof err === 'object' && err !== null && 'message' in err) {
          message = (err as { message: string }).message
        }

        dispatch({ type: 'SET_ERROR', payload: message })
        dispatch({
          type: 'SET_AUTH_FLOW',
          payload: { currentStep: AuthStep.SIGN_MESSAGE, isLoading: false, error: message },
        })
      }
    },
    [authService, signMessageAsync, startPolling, stopPolling],
  )

  // ---------------------------------------------------------------------------
  // signOut
  // ---------------------------------------------------------------------------

  const signOut = useCallback(async () => {
    stopPolling()
    authService.clearSession()
    await disconnect().catch(() => null)
    dispatch({ type: 'CLEAR_AUTH' })
  }, [authService, disconnect, stopPolling])

  // ---------------------------------------------------------------------------
  // clearError
  // ---------------------------------------------------------------------------

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null })
    dispatch({ type: 'SET_AUTH_FLOW', payload: { error: null } })
  }, [])

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signOut,
        clearError,
        authFlow: state.authFlow,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
