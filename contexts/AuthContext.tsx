import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react'
import { type Address } from 'viem'
import { useAppKitAccount, useDisconnect } from '@reown/appkit-controllers/react'
import { useSignMessage } from 'wagmi'
import { AuthService } from '@/lib/auth/AuthService'
import { AuthStorage } from '@/lib/auth/storage'
import {
  AuthStep,
  type AuthContextType,
  type AuthFlowState,
  type AuthState,
  type Namespace,
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
  | { type: 'SET_NAMESPACES'; payload: Namespace[] }
  | { type: 'SET_ACTIVE_NAMESPACE'; payload: Namespace | null }
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
  namespaces: [],
  activeNamespace: null,
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
    case 'SET_NAMESPACES':
      return { ...state, namespaces: action.payload }
    case 'SET_ACTIVE_NAMESPACE':
      return { ...state, activeNamespace: action.payload }
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

  const sessionIdRef = useRef<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Hold the user profile while we wait for namespace selection
  const pendingUserRef = useRef<(User & { walletAddress: Address }) | null>(null)

  // ---------------------------------------------------------------------------
  // After JWT: fetch namespaces + user, decide next step
  // ---------------------------------------------------------------------------

  const afterJwt = useCallback(async (walletAddress: Address) => {
    const [nsResult, meResult] = await Promise.allSettled([
      authService.getNamespaces(),
      authService.getMe(),
    ])

    if (nsResult.status === 'rejected') {
      console.error('[afterJwt] getNamespaces failed:', nsResult.reason)
    }

    const resolvedNamespaces: Namespace[] = nsResult.status === 'fulfilled' ? nsResult.value : []
    const resolvedUser: (User & { walletAddress: Address }) | null =
      meResult.status === 'fulfilled' ? { ...meResult.value, walletAddress } : null

    dispatch({ type: 'SET_NAMESPACES', payload: resolvedNamespaces })
    pendingUserRef.current = resolvedUser

    // Restore previously stored namespace selection
    const storedId = AuthStorage.getNamespaceId()
    const restoredNs = storedId ? resolvedNamespaces.find((n) => n.id === storedId) ?? null : null

    if (restoredNs) {
      dispatch({ type: 'SET_ACTIVE_NAMESPACE', payload: restoredNs })
      commitUser(resolvedUser, walletAddress)
      return
    }

    if (resolvedNamespaces.length === 1) {
      AuthStorage.setNamespaceId(resolvedNamespaces[0].id)
      dispatch({ type: 'SET_ACTIVE_NAMESPACE', payload: resolvedNamespaces[0] })
      commitUser(resolvedUser, walletAddress)
      return
    }

    if (resolvedNamespaces.length === 0) {
      // No namespaces yet (API error or new user) — proceed without selection
      commitUser(resolvedUser, walletAddress)
      return
    }

    // Multiple namespaces with no stored selection → show the picker
    dispatch({
      type: 'SET_AUTH_FLOW',
      payload: { currentStep: AuthStep.SELECT_NAMESPACE, isLoading: false, error: null },
    })
  }, [authService]) // eslint-disable-line react-hooks/exhaustive-deps

  function commitUser(user: (User & { walletAddress: Address }) | null, walletAddress: Address) {
    dispatch({
      type: 'SET_USER',
      payload: user ?? {
        id: '',
        walletAddress,
        telegramHandle: null,
        notificationsEnabled: true,
        scopes: [],
        wallets: [],
        profile: null,
      },
    })
    dispatch({ type: 'SET_AUTH_FLOW', payload: { currentStep: AuthStep.AUTHENTICATED, isLoading: false, error: null } })
  }

  // ---------------------------------------------------------------------------
  // Init from storage
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const token = authService.getStoredToken()
    if (token && authService.isAuthenticated()) {
      const payload = authService.decodeToken(token)
      if (payload) {
        dispatch({ type: 'SET_TOKEN', payload: token })
        // Show AUTHENTICATED optimistically while we load namespaces in the background
        dispatch({ type: 'SET_AUTH_FLOW', payload: { currentStep: AuthStep.AUTHENTICATED } })
        afterJwt(payload.wallet as Address).catch(() => {
          // Fallback: minimal user from JWT
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
  // Sync wallet connection → step
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isConnected) {
      stopPolling()
      if (state.isAuthenticated) {
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
  // Session polling (PENDING_TG_APPROVAL)
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
            // Show the "Done" step as loading while we fetch namespaces
            dispatch({ type: 'SET_AUTH_FLOW', payload: { isLoading: true } })
            await afterJwt(payload.wallet as Address)
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
      } catch {
        // Network glitch — keep polling silently
      }
    }, 2000)
  }, [afterJwt, authService, stopPolling])

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
        let challengeResult: Awaited<ReturnType<typeof authService.getChallenge>>
        try {
          challengeResult = await authService.getChallenge(walletAddress)
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode
          if (status === 404) {
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

        dispatch({ type: 'SET_AUTH_FLOW', payload: { isLoading: true } })
        const signature = await signMessageAsync({ message }) as `0x${string}`

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
  // setActiveNamespace — called when user picks a namespace from the selector
  // ---------------------------------------------------------------------------

  const setActiveNamespace = useCallback((namespace: Namespace) => {
    AuthStorage.setNamespaceId(namespace.id)
    dispatch({ type: 'SET_ACTIVE_NAMESPACE', payload: namespace })
    const wallet = pendingUserRef.current?.walletAddress
    commitUser(pendingUserRef.current, wallet ?? (address as Address))
  }, [address]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // switchNamespace — re-open the namespace picker without signing out
  // ---------------------------------------------------------------------------

  const switchNamespace = useCallback(() => {
    dispatch({ type: 'SET_AUTH_FLOW', payload: { currentStep: AuthStep.SELECT_NAMESPACE } })
  }, [])

  // ---------------------------------------------------------------------------
  // signOut
  // ---------------------------------------------------------------------------

  const signOut = useCallback(async () => {
    stopPolling()
    authService.clearSession()
    pendingUserRef.current = null
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

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signOut,
        clearError,
        setActiveNamespace,
        switchNamespace,
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
